create table if not exists public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  image_url text not null default '',
  subcategories jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

revoke all on public.categories from public, anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

create policy "Categories are public"
on public.categories for select to anon, authenticated
using (true);

create policy "Sellers insert categories"
on public.categories for insert to authenticated
with check ((select public.is_seller()));

create policy "Sellers update categories"
on public.categories for update to authenticated
using ((select public.is_seller()))
with check ((select public.is_seller()));

create policy "Sellers delete categories"
on public.categories for delete to authenticated
using ((select public.is_seller()));

insert into public.categories (slug, name, description, subcategories, position) values
  ('codigo-de-barras', 'Código de Barras', 'Impresión y lectura de códigos de barras para retail e industria.',
   '[{"name":"Impresoras de etiquetas","slug":"impresoras-etiquetas"},{"name":"Impresoras de brazaletes","slug":"impresoras-brazaletes"},{"name":"Impresoras de punto de venta","slug":"impresoras-punto-venta"},{"name":"Lectores","slug":"lectores"},{"name":"Suministros","slug":"suministros"},{"name":"Etiquetas / Nylon","slug":"suministros-etiquetas","parent":"suministros"},{"name":"Etiquetas Especiales","slug":"suministros-etiquetas-especiales","parent":"suministros"},{"name":"Cintas","slug":"suministros-cintas","parent":"suministros"}]'::jsonb, 1),
  ('computo-movil', 'Cómputo Móvil', 'Equipos portátiles y tabletas profesionales para trabajo en campo.',
   '[{"name":"Computadores de mano (PDA)","slug":"computadores-de-mano"},{"name":"Tabletas","slug":"tabletas"}]'::jsonb, 2),
  ('rfid', 'RFID', 'Identificación por radiofrecuencia: antenas, impresoras, tags y portales.',
   '[{"name":"Antenas","slug":"antenas"},{"name":"Impresoras RFID","slug":"impresoras"},{"name":"Tags","slug":"tags"},{"name":"Portales","slug":"portales"}]'::jsonb, 3),
  ('identificacion-pvc', 'Identificación PVC', 'Impresoras, suministros y tarjetas para credenciales y membresías.',
   '[{"name":"Impresoras","slug":"impresoras"},{"name":"Suministros","slug":"suministros"},{"name":"Accesorios y cordones","slug":"accesorios"},{"name":"Tarjetas con Chip","slug":"tarjetas-con-chip"}]'::jsonb, 4)
on conflict (slug) do nothing;
