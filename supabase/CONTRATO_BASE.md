# Contrato de la capa base (P1.1)

La migración base (`20261020140000_initial_schema.sql`), las políticas RLS de
`profiles`, `products`, `orders`, `addresses` y `commerce_settings`, las políticas
de Storage y el cuerpo de `create_order` **no están en este repositorio**
(`README.md:7,35,39-45`). No se pueden inventar: aplicar una versión distinta de
la producción rompería datos reales.

## Cómo restaurar

1. En Supabase → **Database → Migrations**, abrir el historial y descargar el SQL
   de la migración base y de `20261027160000_category_heroes.sql` y
   `20261028170000_commerce_visibility.sql`.
2. Alternativamente, exportar el esquema real:
   ```bash
   supabase db dump --db-url "$DATABASE_URL" --schema public --file supabase/migrations/20261020140000_initial_schema.sql
   ```
3. Guardar el resultado en `supabase/migrations/` y verificar que `supabase db reset`
   funciona en un proyecto local antes de tocar producción.
4. Ejecutar `supabase/VERIFICACION_SEGURIDAD.sql` en el SQL Editor y archivar la
   salida como evidencia de auditoría.

## Contrato que debe cumplir lo restaurado

### `profiles`
- RLS activo; cada usuario lee y actualiza **solo** su fila (`id = auth.uid()`).
- La columna `role` **no** puede ser escrita por el propio usuario. La actualización
  de `role` debe estar restringida a una política separada o hecha por un administrador en SQL.
- `cart_items` vive en la fila del perfil; nadie puede modificar el carrito de otro usuario.

### `products`
- RLS de lectura pública solo para `is_active = true` y columnas no sensibles;
  precios visibles solo para usuarios autenticados cuando el interruptor de comercio está activo.
- Escrituras (insert/update/delete) solo con `user_id = auth.uid()` **y** `role = 'seller'`.
- Las rutas API ya refuerzan esta propiedad con `.eq("user_id", user.id)`.

### `orders` y `order_items`
- El usuario solo ve sus órdenes (`user_id = auth.uid()`).
- Los sellers pueden leer órdenes para operar; si hay varios sellers, definir el
  alcance con `SELLER_ORDER_SCOPE=own` (la API filtra por `user_id`). Por defecto
  `all`, pensado para un único administrador.
- `create_order(p_address jsonb, p_items jsonb)` debe:
  - derivar precios de `products`, no del payload;
  - verificar `is_active` y `stock >= quantity` **dentro de la transacción**;
  - fijar `user_id = auth.uid()`;
  - grabar snapshots en `order_items` (nombre, imagen, precio unitario);
  - descontar stock y vaciar `cart_items` atómicamente;
  - guardar `amount = subtotal * 1.15` (IVA 15 %), sin envío.

### Storage (`product-media`)
- Bucket público solo para lectura; escritura y borrado restringidos a rutas
  `auth.uid()/...` y a sellers. Sin subdirectorios arbitrarios.

### Funciones `SECURITY DEFINER`
- `is_ip_blocked` no debe tener `execute` para `anon` (la app llama con la publishable key
  desde el servidor/middleware; idealmente moverlo a una RPC con JWT de servicio).
- `record_site_visit` debe recibir la IP derivada en servidor, nunca del navegador.
- Las funciones de reordenamiento ya comprueban `role = 'seller'`.

## Migraciones añadidas en P1

| Migración | Propósito |
|---|---|
| `20261124140000_order_idempotency.sql` | `orders.idempotency_key` + índice único por usuario |
| `20261124150000_order_payment_audit.sql` | `paid_at`, `paid_by`, `payment_ref`, `status` y bitácora `order_payment_events` |

Ambas usan `add column if not exists` / `create table if not exists`, por lo que son
seguras de aplicar sobre el esquema actual.
