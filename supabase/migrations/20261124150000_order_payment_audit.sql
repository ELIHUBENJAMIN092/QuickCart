-- Auditoría de confirmación de pagos y estado de la orden.

alter table public.orders
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references auth.users(id) on delete set null,
  add column if not exists payment_ref text,
  add column if not exists status text not null default 'pending';

create table if not exists public.order_payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text not null,
  payment_ref text,
  created_at timestamptz not null default now()
);

alter table public.order_payment_events enable row level security;

drop policy if exists "sellers read payment events" on public.order_payment_events;
create policy "sellers read payment events"
  on public.order_payment_events for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'seller'
  ));

drop policy if exists "sellers insert payment events" on public.order_payment_events;
create policy "sellers insert payment events"
  on public.order_payment_events for insert to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'seller'
  ));

revoke all on table public.order_payment_events from public, anon;
grant select, insert on table public.order_payment_events to authenticated;
