create table if not exists public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^09[0-9]{8}$'),
  position integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.whatsapp_contacts (name, phone, position)
select seed.name, seed.phone, seed.position
from (values
  ('WhatsApp', '0984617873', 1),
  ('WhatsApp', '0995768770', 2),
  ('WhatsApp', '0999033418', 3)
) as seed(name, phone, position)
where not exists (select 1 from public.whatsapp_contacts);

alter table public.whatsapp_contacts enable row level security;

drop policy if exists "Anyone can read whatsapp contacts" on public.whatsapp_contacts;
create policy "Anyone can read whatsapp contacts"
  on public.whatsapp_contacts for select to anon, authenticated using (true);

drop policy if exists "Sellers can insert whatsapp contacts" on public.whatsapp_contacts;
create policy "Sellers can insert whatsapp contacts"
  on public.whatsapp_contacts for insert to authenticated
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can update whatsapp contacts" on public.whatsapp_contacts;
create policy "Sellers can update whatsapp contacts"
  on public.whatsapp_contacts for update to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

drop policy if exists "Sellers can delete whatsapp contacts" on public.whatsapp_contacts;
create policy "Sellers can delete whatsapp contacts"
  on public.whatsapp_contacts for delete to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'seller')
  );

grant select on public.whatsapp_contacts to anon, authenticated;
grant insert, update, delete on public.whatsapp_contacts to authenticated;

create or replace function public.reorder_whatsapp_contacts(new_order uuid[])
returns setof public.whatsapp_contacts
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

  select count(*) into item_count from public.whatsapp_contacts;
  if coalesce(array_length(new_order, 1), 0) <> item_count
    or (select count(distinct item_id) from unnest(new_order) as order_ids(item_id)) <> item_count
    or exists (
      select 1 from unnest(new_order) as order_ids(item_id)
      where not exists (select 1 from public.whatsapp_contacts where id = order_ids.item_id)
    ) then
    raise exception 'WhatsApp contact order does not match the current records';
  end if;

  update public.whatsapp_contacts
    set position = -1000000 - position
    where id is not null;
  for item_index in 1..item_count loop
    update public.whatsapp_contacts
      set position = item_index, updated_at = now()
      where id = new_order[item_index];
  end loop;

  return query select * from public.whatsapp_contacts order by position;
end;
$$;

revoke all on function public.reorder_whatsapp_contacts(uuid[]) from public;
grant execute on function public.reorder_whatsapp_contacts(uuid[]) to authenticated;
