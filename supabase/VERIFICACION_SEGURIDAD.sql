-- Auditoría de solo lectura de la capa de base de datos.
-- Ejecutar en el SQL Editor del proyecto Supabase de producción y guardar el resultado.

-- 1) Estado de RLS por tabla (todas las tablas públicas deben tenerlo activo).
select c.relname as tabla, c.relrowsecurity as rls_activo, c.relforcerowsecurity as rls_forzado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

-- 2) Políticas vigentes. Revisar especialmente profiles, products, orders, addresses y cart_items.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Funciones SECURITY DEFINER. Ninguna debe estar expuesta a anon salvo justificación.
select p.proname, p.prosecdef, pg_get_function_identity_arguments(p.oid) as argumentos,
       pg_get_functiondef(p.oid) as definicion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname;

-- 4) Contrato de las RPC críticas del checkout.
select proname, pg_get_functiondef(oid) as definicion
from pg_proc
where proname in ('create_order', 'storefront_products', 'storefront_product', 'is_ip_blocked', 'record_site_visit');

-- 5) Políticas de Storage (bucket product-media).
select id, name, bucket_id, command, role, definition, check_expression
from storage.policies
order by bucket_id, name;

-- 6) Columnas actuales de orders (para confirmar las migraciones de idempotencia/pagos).
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
order by ordinal_position;
