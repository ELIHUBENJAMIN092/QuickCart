-- Suscripciones reales al boletín. Solo inserción; nadie puede listar los correos.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (
    length(email) <= 254
    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

revoke all on table public.newsletter_subscribers from public;
grant insert on table public.newsletter_subscribers to anon, authenticated;
