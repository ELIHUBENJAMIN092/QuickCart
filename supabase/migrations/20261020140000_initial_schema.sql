create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar_url text not null default '',
  role text not null default 'customer' check (role in ('customer', 'seller')),
  cart_items jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  name text not null check (char_length(name) between 1 and 160),
  description text not null check (char_length(description) between 1 and 5000),
  price numeric(12, 2) not null check (price > 0),
  offer_price numeric(12, 2) not null check (offer_price >= 0 and offer_price <= price),
  stock integer not null default 0 check (stock >= 0),
  image_urls text[] not null check (cardinality(image_urls) between 1 and 4),
  category text not null,
  subcategory text not null default '',
  video text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone_number text not null default '',
  area text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  address jsonb not null,
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null default 'Order Placed',
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_image text not null default '',
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create index products_category_idx on public.products (category, subcategory);
create index products_created_at_idx on public.products (created_at desc);
create index addresses_user_id_idx on public.addresses (user_id, created_at desc);
create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = case when excluded.name = '' then public.profiles.name else excluded.name end,
    avatar_url = case when excluded.avatar_url = '' then public.profiles.avatar_url else excluded.avatar_url end;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set
    email = coalesce(new.email, ''),
    name = coalesce(new.raw_user_meta_data ->> 'name', name),
    avatar_url = coalesce(new.raw_user_meta_data ->> 'avatar_url', avatar_url),
    updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_user_updated();

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'seller'
  );
$$;

create or replace function public.create_order(p_address jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(12, 2) := 0;
  v_total numeric(12, 2);
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_address is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Invalid order';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 then raise exception 'Invalid quantity'; end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product')::uuid and is_active = true;
    if not found then raise exception 'Product not found'; end if;
    v_subtotal := v_subtotal + v_product.offer_price * v_quantity;
  end loop;

  v_total := round(v_subtotal * 1.15, 2);
  insert into public.orders (user_id, address, amount)
  values (v_user_id, p_address, v_total)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item ->> 'product')::uuid and is_active = true;

    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, coalesce(v_product.image_urls[1], ''), v_product.offer_price, v_quantity);
  end loop;

  update public.profiles set cart_items = '{}'::jsonb, updated_at = now()
  where id = v_user_id;

  return jsonb_build_object('id', v_order_id, 'amount', v_total);
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, avatar_url, cart_items, updated_at) on public.profiles to authenticated;

revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

revoke all on public.addresses from public, anon, authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

revoke all on public.orders from public, anon, authenticated;
grant select on public.orders to authenticated;
revoke update on public.orders from authenticated;
grant update (is_paid, status, updated_at) on public.orders to authenticated;

revoke all on public.order_items from public, anon, authenticated;
grant select on public.order_items to authenticated;
grant usage on schema public to anon, authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Products are publicly readable"
on public.products for select to anon, authenticated
using (is_active or (select public.is_seller()));

create policy "Sellers can create products"
on public.products for insert to authenticated
with check ((select public.is_seller()) and user_id = (select auth.uid()));

create policy "Sellers can update products"
on public.products for update to authenticated
using ((select public.is_seller()))
with check ((select public.is_seller()));

create policy "Sellers can delete products"
on public.products for delete to authenticated
using ((select public.is_seller()));

create policy "Users can manage their own addresses"
on public.addresses for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Customers and sellers can read orders"
on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_seller()));

create policy "Sellers can update orders"
on public.orders for update to authenticated
using ((select public.is_seller()))
with check ((select public.is_seller()));

create policy "Customers and sellers can read order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = (select auth.uid()) or (select public.is_seller()))
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Product media is publicly readable"
on storage.objects for select to public
using (bucket_id = 'product-media');

create policy "Sellers can upload product media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-media'
  and (select public.is_seller())
  and split_part(name, '/', 1) = (select auth.uid())::text
);

create policy "Sellers can update product media"
on storage.objects for update to authenticated
using (bucket_id = 'product-media' and (select public.is_seller()))
with check (bucket_id = 'product-media' and (select public.is_seller()));

create policy "Sellers can delete product media"
on storage.objects for delete to authenticated
using (bucket_id = 'product-media' and (select public.is_seller()));

grant execute on function public.create_order(jsonb, jsonb) to authenticated;
revoke execute on function public.create_order(jsonb, jsonb) from public, anon;
