-- Fix: reorder_whatsapp_contacts used an UPDATE without a WHERE clause,
-- which Supabase rejects with "21000: UPDATE requires a WHERE clause".
-- This version keeps every UPDATE filtered so the RPC can run.

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

  -- Move every row to a unique negative position first so the final
  -- positive positions never collide with the unique(position) constraint.
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
