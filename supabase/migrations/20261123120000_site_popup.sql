-- Ventana emergente de la tienda: promociones o mensajes importantes que se
-- muestran como modal al cargar la página. Fila única (id = 1), igual que el
-- banner superior. La imagen se guarda en storage "product-media" bajo /popup.

create table if not exists public.site_popup (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default true,
  image_url text not null default '',
  title text not null default '',
  message text not null default '',
  button_label text not null default '',
  button_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_popup (id)
select 1
where not exists (select 1 from public.site_popup where id = 1);

alter table public.site_popup enable row level security;

drop policy if exists "Anyone can read site popup" on public.site_popup;
create policy "Anyone can read site popup"
  on public.site_popup for select to anon, authenticated using (true);

drop policy if exists "Sellers can manage site popup" on public.site_popup;
create policy "Sellers can manage site popup"
  on public.site_popup for all to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

grant select on public.site_popup to anon, authenticated;
grant insert, update on public.site_popup to authenticated;
