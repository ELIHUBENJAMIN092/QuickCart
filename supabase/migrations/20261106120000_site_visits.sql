-- Monitoreo de visitas y bloqueo de direcciones IP.
-- Las visitas las registra la función record_site_visit (security definer) para
-- no exponer la tabla al público. Solo los vendedores pueden leer y administrar.

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  ip text not null,
  path text not null default '/',
  referrer text not null default '',
  user_agent text not null default '',
  country text not null default '',
  city text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx on public.site_visits (created_at desc);
create index if not exists site_visits_ip_idx on public.site_visits (ip);
create index if not exists site_visits_ip_created_idx on public.site_visits (ip, created_at desc);
create index if not exists site_visits_path_idx on public.site_visits (path);

create table if not exists public.blocked_ips (
  ip text primary key,
  reason text not null default '',
  created_at timestamptz not null default now()
);

alter table public.site_visits enable row level security;
alter table public.blocked_ips enable row level security;

drop policy if exists "Sellers can read site visits" on public.site_visits;
create policy "Sellers can read site visits"
  on public.site_visits for select to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can delete site visits" on public.site_visits;
create policy "Sellers can delete site visits"
  on public.site_visits for delete to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can manage blocked ips" on public.blocked_ips;
create policy "Sellers can manage blocked ips"
  on public.blocked_ips for all to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

grant select, delete on public.site_visits to authenticated;
grant select, insert, update, delete on public.blocked_ips to authenticated;

-- Registra una visita. Devuelve true cuando la IP está bloqueada.
create or replace function public.record_site_visit(
  p_ip text,
  p_path text,
  p_referrer text default '',
  p_user_agent text default '',
  p_country text default '',
  p_city text default ''
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := btrim(coalesce(p_ip, ''));
  v_path text := left(coalesce(nullif(btrim(p_path), ''), '/'), 300);
begin
  if v_ip = '' then
    return false;
  end if;

  if exists (select 1 from public.blocked_ips where ip = v_ip) then
    return true;
  end if;

  -- Evita duplicados por recarga o doble render en la misma ruta.
  if exists (
    select 1 from public.site_visits
    where ip = v_ip
      and path = v_path
      and created_at > now() - interval '20 seconds'
  ) then
    return false;
  end if;

  -- Límite de seguridad: una misma IP no puede generar más de 60 registros
  -- por minuto, incluso si cambia de ruta artificialmente.
  if (
    select count(*) from public.site_visits
    where ip = v_ip and created_at > now() - interval '1 minute'
  ) >= 60 then
    return false;
  end if;

  insert into public.site_visits (ip, path, referrer, user_agent, country, city)
  values (
    v_ip,
    v_path,
    left(coalesce(p_referrer, ''), 1000),
    left(coalesce(p_user_agent, ''), 500),
    left(coalesce(p_country, ''), 80),
    left(coalesce(p_city, ''), 80)
  );

  return false;
end;
$$;

revoke all on function public.record_site_visit(text, text, text, text, text, text) from public;
grant execute on function public.record_site_visit(text, text, text, text, text, text) to anon, authenticated;

-- Consulta rápida usada por el middleware para bloquear solicitudes.
create or replace function public.is_ip_blocked(p_ip text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.blocked_ips where ip = btrim(coalesce(p_ip, '')));
$$;

revoke all on function public.is_ip_blocked(text) from public;
grant execute on function public.is_ip_blocked(text) to anon, authenticated;
