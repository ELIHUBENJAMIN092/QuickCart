-- Orden manual de los productos en la tienda.
-- Los productos sin posición (por ejemplo los recién creados) se muestran primero,
-- de más nuevo a más antiguo; los demás siguen la posición guardada.

create table if not exists public.product_positions (
  product_id uuid primary key references public.products(id) on delete cascade,
  position integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists product_positions_position_idx on public.product_positions (position);

alter table public.product_positions enable row level security;

drop policy if exists "Anyone can read product positions" on public.product_positions;
create policy "Anyone can read product positions"
  on public.product_positions for select to anon, authenticated using (true);

grant select on public.product_positions to anon, authenticated;

create or replace function public.reorder_products(new_order uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller'
  ) then
    raise exception 'Seller authorization required';
  end if;

  if coalesce(array_length(new_order, 1), 0) = 0
    or (select count(distinct item_id) from unnest(new_order) as order_ids(item_id)) <> array_length(new_order, 1)
    or exists (
      select 1 from unnest(new_order) as order_ids(item_id)
      where not exists (select 1 from public.products where products.id = order_ids.item_id)
    ) then
    raise exception 'Product order does not match the current records';
  end if;

  delete from public.product_positions where product_id is not null;

  insert into public.product_positions (product_id, position)
  select item_id, item_position::integer
  from unnest(new_order) with ordinality as order_ids(item_id, item_position);
end;
$$;

revoke all on function public.reorder_products(uuid[]) from public;
grant execute on function public.reorder_products(uuid[]) to authenticated;
