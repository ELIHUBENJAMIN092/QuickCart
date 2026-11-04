create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  image_url text not null,
  height integer not null default 104 check (height between 56 and 176),
  position integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.certifications (name, image_url, height, position)
select seed.name, seed.image_url, seed.height, seed.position
from (values
  ('Zebra Supplies Specialist', '/certificaciones/zebra-supplies-specialist.png', 104, 1),
  ('Zebra Supplies Specialist', '/certificaciones/zebra-supplies-specialist.png', 104, 2),
  ('Zebra Supplies Specialist', '/certificaciones/zebra-supplies-specialist.png', 104, 3)
) as seed(name, image_url, height, position)
where not exists (select 1 from public.certifications);

alter table public.certifications enable row level security;

drop policy if exists "Anyone can read certifications" on public.certifications;
create policy "Anyone can read certifications"
  on public.certifications for select to anon, authenticated using (true);

drop policy if exists "Sellers can insert certifications" on public.certifications;
create policy "Sellers can insert certifications"
  on public.certifications for insert to authenticated
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can update certifications" on public.certifications;
create policy "Sellers can update certifications"
  on public.certifications for update to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can delete certifications" on public.certifications;
create policy "Sellers can delete certifications"
  on public.certifications for delete to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

grant select on public.certifications to anon, authenticated;
grant insert, update, delete on public.certifications to authenticated;

create or replace function public.reorder_certifications(new_order uuid[])
returns setof public.certifications
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

  select count(*) into item_count from public.certifications;
  if coalesce(array_length(new_order, 1), 0) <> item_count
    or (select count(distinct item_id) from unnest(new_order) as order_ids(item_id)) <> item_count
    or exists (
      select 1 from unnest(new_order) as order_ids(item_id)
      where not exists (select 1 from public.certifications where id = order_ids.item_id)
    ) then
    raise exception 'Certification order does not match the current records';
  end if;

  update public.certifications set position = -position;
  for item_index in 1..item_count loop
    update public.certifications
      set position = item_index, updated_at = now()
      where id = new_order[item_index];
  end loop;

  return query select * from public.certifications order by position;
end;
$$;

revoke all on function public.reorder_certifications(uuid[]) from public;
grant execute on function public.reorder_certifications(uuid[]) to authenticated;
