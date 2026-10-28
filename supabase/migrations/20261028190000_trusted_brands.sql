create table if not exists public.trusted_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  logo_url text not null,
  position integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trusted_brands_name_lower_idx
  on public.trusted_brands (lower(name));

insert into public.trusted_brands (name, logo_url, position)
select seed.name, seed.logo_url, seed.position
from (values
  ('Zebra', '/logos/zebra.png', 1),
  ('TSC', '/logos/tsc.png', 2),
  ('Swiftpro', '/logos/swiftpro.png', 3),
  ('Magicard', '/logos/magicard.png', 4),
  ('Epson', '/logos/epson.png', 5),
  ('HID', '/logos/hid.png', 6),
  ('Bartender', '/logos/bartender.png', 7),
  ('Unitech', '/logos/unitech.png', 8)
) as seed(name, logo_url, position)
where not exists (
  select 1 from public.trusted_brands where lower(name) = lower(seed.name)
);

alter table public.trusted_brands enable row level security;

drop policy if exists "Anyone can read trusted brands" on public.trusted_brands;
create policy "Anyone can read trusted brands"
  on public.trusted_brands for select to anon, authenticated using (true);

drop policy if exists "Sellers can insert trusted brands" on public.trusted_brands;
create policy "Sellers can insert trusted brands"
  on public.trusted_brands for insert to authenticated
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can update trusted brands" on public.trusted_brands;
create policy "Sellers can update trusted brands"
  on public.trusted_brands for update to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can delete trusted brands" on public.trusted_brands;
create policy "Sellers can delete trusted brands"
  on public.trusted_brands for delete to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

grant select on public.trusted_brands to anon, authenticated;
grant insert, update, delete on public.trusted_brands to authenticated;

create or replace function public.reorder_trusted_brands(new_order uuid[])
returns setof public.trusted_brands
language plpgsql
security definer
set search_path = public
as $$
declare
  item_count integer;
  item_index integer;
begin
  if not exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller'
  ) then
    raise exception 'Seller authorization required';
  end if;

  select count(*) into item_count from public.trusted_brands;
  if coalesce(array_length(new_order, 1), 0) <> item_count
    or (select count(distinct item_id) from unnest(new_order) as order_ids(item_id)) <> item_count
    or exists (
      select 1 from unnest(new_order) as order_ids(item_id)
      where not exists (select 1 from public.trusted_brands where id = order_ids.item_id)
    ) then
    raise exception 'Brand order does not match the current records';
  end if;

  update public.trusted_brands set position = -position;
  for item_index in 1..item_count loop
    update public.trusted_brands
      set position = item_index, updated_at = now()
      where id = new_order[item_index];
  end loop;

  return query select * from public.trusted_brands order by position;
end;
$$;

revoke all on function public.reorder_trusted_brands(uuid[]) from public;
grant execute on function public.reorder_trusted_brands(uuid[]) to authenticated;
