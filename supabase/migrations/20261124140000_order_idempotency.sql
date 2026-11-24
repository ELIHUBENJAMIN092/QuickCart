-- Idempotencia de órdenes: evita duplicados por reintentos de red o doble clic.
-- La app envía la clave en la cabecera Idempotency-Key y la guarda tras crear la orden.

alter table public.orders
  add column if not exists idempotency_key text;

create unique index if not exists orders_user_idempotency_key_idx
  on public.orders (user_id, idempotency_key)
  where idempotency_key is not null;

comment on column public.orders.idempotency_key is
  'Clave del cliente para deduplicar la creación de órdenes por usuario.';
