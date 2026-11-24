-- Campos de contacto necesarios para reutilizar una dirección en el checkout.
alter table public.addresses
  add column if not exists email text,
  add column if not exists id_number text;
