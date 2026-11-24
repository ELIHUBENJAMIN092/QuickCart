# Plan de mejoras y auditoría de seguridad — QuickCart / COMPEL

**Fecha:** 2026-11-24
**Alcance:** análisis de todo el sitio (storefront, panel seller, APIs, Supabase, dependencias, UX/SEO/accesibilidad).
**Estado del análisis:** solo lectura. No se modificó código. Base: Next.js 15 + Supabase (Auth/Postgres/Storage/Edge Functions) + Tailwind + Gemini.

---

## 0. Resumen ejecutivo

**Lo que está bien:** el proyecto compila (`npm run build`), los 80 tests pasan (86 % de cobertura) y `npm audit --omit=dev` reporta **0 vulnerabilidades** en dependencias de producción. La autenticación está centralizada y bien hecha (`lib/supabase/server.js:16-49` valida el JWT con `auth.getUser()` y nunca confía en un `user_id` del cliente). No hay SQLi, ni `dangerouslySetInnerHTML` con datos de usuario, ni secretos en el bundle cliente, ni `.env` versionado en el HEAD actual. Casi todos los endpoints sensibles exigen sesión y rol de vendedor.

**Lo que exige acción inmediata:**

1. **CRÍTICO — Credenciales reales en el historial de Git.** Aunque `.env` fue eliminado del tracking en el commit `4818e7e`, commits antiguos (`fce3c6a`, `e50ae75`, `d1f4b17`, `d0c8706`, `2644ea1`, `6450e2d`) contienen valores no vacíos de `MONGODB_URI`, `CLERK_SECRET_KEY`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY` y `GEMINI_API_KEY`. De estos, **solo siguen en uso `RESEND_API_KEY` y `GEMINI_API_KEY`** (confirmado por el propietario); el resto son servicios dados de baja (MongoDB, Clerk, Inngest, Cloudinary). El repositorio tiene `origin` en GitHub (`package.json:42`), así que basta `git show <commit>:.env` para recuperarlos. **Rotar las dos claves activas y purgar el historial antes de cualquier otra tarea.**
2. **ALTO — IDOR en productos:** las rutas `product/update/[id]`, `product/delete/[id]` y `product/seller-list/[id]` no filtran por `user_id` en la aplicación; la protección depende solo de una política RLS que **no está versionada** (`supabase/README.md:7,39-45`).
3. **ALTO — Bloqueo de IP evadible:** el middleware excluye `/api` y `/seller` (`middleware.js:67-69,88`) y la IP se toma de `x-forwarded-for` (`lib/visits.js:4-16`), falsificable por el cliente.
4. **CRÍTICO de negocio — `offerPrice = 0` se trata como oferta activa:** el panel dice «usa 0 si no aplica», la API guarda `offer_price = 0`, y el carrito usa ese 0 como precio → `$0.00`, IVA 0 y total 0 en checkout.

**Limitación de la auditoría:** la migración base, las políticas RLS de `profiles`/`products`/`orders`/`addresses`, las políticas de Storage y el RPC `create_order` no están en el repositorio. Por eso los riesgos de propiedad y de cálculo de totales **no se pueden confirmar ni descartar** solo con el código: hay que revisarlos en el proyecto Supabase de producción.

**Orden recomendado:** P0 (hoy, 0-48 h) → P1 (semana 1) → P2 (semanas 2-3) → P3 (mes).

---

## 1. Lo que ya funciona y debe conservarse

- `lib/supabase/server.js`: Bearer + `auth.getUser(token)`; sin confiar en payloads sin verificar.
- `authSeller()` (`lib/authSeller.js`) aplicado en los 20+ endpoints de seller.
- Sin secretos en cliente: solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas por diseño).
- Sin inyección SQL (query builder + RPC parametrizados); validación de URLs (`javascript:`, `//dominio`) en banners, popup, carruseles y categorías.
- `lib/supabase/storage.js`: sanitización de nombres, prefijo `userId/folder/UUID`, validación de propiedad de ruta, tamaño y MIME.
- Rate limiting de chat/lead/feedback/eventos con Upstash y **fail-closed** en producción (`lib/ai/rateLimit.js:69-81`).
- Edge Function `send-order-email`: verifica JWT, filtra por `user_id` y escapa HTML del correo.
- RLS activa y bien formulada en todas las tablas creadas por las migraciones presentes; `purge_expired_chat_data` revoca execute al público.
- Diseño consistente (tokens `brand.*`, componentes UI reutilizables), estados de carga/error, buen uso de `next/image`, `<html lang="es">`, fuentes self-hosted, `aria-*` en la mayoría de iconos-botón, focus trap en `ChatWidget` y `ConfirmProvider`.
- Lógica de carrito con cola secuencial, rollback y validación de stock en cliente (`context/AppContext.jsx:156-234`).

---

## 2. Matriz de hallazgos

### Seguridad

| ID | Sev. | Hallazgo | Evidencia |
|---|---|---|---|
| SEC-1 | **CRÍTICO** | Secretos reales en el historial de Git con remote público | `git log --all -- .env`; commits listados arriba; `package.json:42` |
| SEC-2 | **ALTO** | IDOR: update/delete/lectura de productos sin `.eq("user_id", user.id)` | `app/api/product/update/[id]/route.js:17,57-105`; `delete/[id]/route.js:13-25`; `seller-list/[id]/route.js:14-15` |
| SEC-3 | **ALTO** | Bloqueo por IP no cubre `/api`; IP falsificable; `p_ip` aceptado del cliente | `middleware.js:67-69,88`; `lib/visits.js:4-16`; `lib/ai/request.js:4-12`; `app/api/visits/route.js:32-39`; `site_visits.sql:58-130` |
| SEC-4 | MEDIO | Panel `/seller` sin autorización server-side (solo gate de API) | `middleware.js:67`; `app/seller/layout.jsx:1-23`; varias páginas sin `isSeller` |
| SEC-5 | MEDIO | RLS / Storage / `create_order` no verificables (fuera del repo) | `supabase/README.md:7,35,39-45` |
| SEC-6 | MEDIO | Pago marcado sin validar UUID, estado previo ni auditoría | `app/api/order/update-payment/[id]/route.js:12-18` |
| SEC-7 | MEDIO | Sin rate limit HTTP en `/api/visits`, sin comprobación de `Origin`/CSRF y sin headers de seguridad | `app/api/visits/route.js:22`; `next.config.mjs:1-14` |
| SEC-8 | MEDIO | Validación incompleta en orden, carrito y URLs del popup | `order/create/route.js:16-31`; `cart/update/route.js:20-27`; `popup/route.js:56-75`; `product/[id]/route.js:11` |
| SEC-9 | BAJO | RPC `SECURITY DEFINER` ejecutable por `anon`; sesión de huésped reclamable por usuario autenticado | `site_visits.sql:120-130`; `chat_phase2.sql:158-176` |
| SEC-10 | BAJO | Logs con PII y objetos completos de Supabase | `context/AppContext.jsx:20`; `product/add/route.js:99`; `banner/route.js:18,52` |
| SEC-11 | BAJO | Desalineación de versiones Next 15 / paquetes 16 | `package.json:14,19,28` |
| SEC-12 | MEDIO | `seller-orders` entrega todas las órdenes con PII, sin paginación | `app/api/order/seller-orders/route.js:12-15`; `lib/supabase/records.js:18` |

### Funcionalidad y datos

| ID | Sev. | Hallazgo | Evidencia |
|---|---|---|---|
| FUN-1 | **CRÍTICO** | `offerPrice = 0` como oferta → precio, subtotal, IVA y total en cero | `components/ui/Price.jsx:2-4`; `lib/cart.js:16-19`; `lib/supabase/records.js:8`; `app/seller/page.jsx:109,461-464`; `OrderSummary.jsx:38,247-259` |
| FUN-2 | **ALTO** | Precio/stock/atomicidad delegados a un RPC no versionado; IVA 15 % no verificable | `app/api/order/create/route.js:28-31`; `supabase/README.md:35,44-45` |
| FUN-3 | ALTO | Sin idempotencia real en creación de órdenes | `OrderSummary.jsx:37,122-128`; `order/create/route.js:16-31` |
| FUN-4 | MEDIO | Stock y cantidad validados solo en navegador | `AppContext.jsx:203-208,224-225`; `cart/update/route.js:20-35` |
| FUN-5 | MEDIO | `orders.status` nunca se actualiza; correo puede mostrar estado distinto | `update-payment/[id]/route.js:13-18`; `send-order-email/index.ts:35,74-75` |
| FUN-6 | MEDIO | Cotizaciones del chat usan `price`, carrito usa `offerPrice` | `lib/ai/cart.js:53-59`; `lib/cart.js:16-19` |
| FUN-7 | BAJO | Órdenes antiguas primero (doble ordenamiento) | `order/list/route.js:15`; `my-orders/page.jsx:35` |
| FUN-8 | BAJO | `idNumber` se exige pero no se guarda con la dirección | `order/create/route.js:17`; `user/add-address/route.js:12-19` |

### UX, accesibilidad, performance y SEO

| ID | Sev. | Hallazgo | Evidencia |
|---|---|---|---|
| UX-1 | **ALTO** | SEO casi inexistente: una sola metadata, sin canonical/OG/robots/sitemap, rutas duplicadas | `app/layout.js:18-21`; sin `public/robots.txt` ni `sitemap` |
| UX-2 | ALTO | Popup navideño activo por defecto, se abre al cargar y autoinicia audio | `lib/popup.js:6-16`; `popupServer.js:17-19`; `PopupModal.jsx:51-56,76-117` |
| UX-3 | ALTO | Búsqueda del navbar no filtra si ya estás en `/all-products` | `all-products/page.jsx:24-28`; `Navbar.jsx:295-306` |
| UX-4 | ALTO | WhatsApp flotante con número incompleto | `components/WhatsappFloat.jsx:14` vs `Footer.jsx:68` |
| UX-5 | MEDIO | Checkout sin errores inline; `<div>` en vez de `<form>`; `type="button"` | `OrderSummary.jsx:121-180,216-243,265-269` |
| UX-6 | MEDIO | Newsletter muestra éxito sin enviar nada | `components/Footer.jsx:18-31` |
| UX-7 | MEDIO | Cinco `<h1>` en la home; carrusel sin pausa ni `prefers-reduced-motion` | `HeaderSlider.jsx:18-60`; `lib/carousel.js:20-32` |
| UX-8 | MEDIO | `:focus-visible` ausente, `Loading` sin `role="status"`, modales sin focus trap/retorno de foco | `globals.css`; `Loading.jsx:5-8`; `PopupModal.jsx:168-239`; `Footer.jsx:94-101` |
| UX-9 | MEDIO | Re-renders: `AppContext` global con sondeo cada 30 s; `Navbar` recalcula listas; `createObjectURL` sin liberar | `AppContext.jsx:117,270-276`; `Navbar.jsx:272-291`; `seller/popup/page.jsx:55` |
| UX-10 | MEDIO | Login siempre vuelve a `/`, rompiendo el flujo de compra | `components/auth/AuthForm.jsx:62` |
| UX-11 | BAJO | Animaciones referenciadas pero no definidas; border-radius global que gana sobre `rounded-full`; copys mixtos | `Sidebar.jsx:171-172`; `order-placed/page.jsx:17`; `globals.css:14-18`; `Navbar.jsx:1092` |

### Calidad

| ID | Sev. | Hallazgo | Evidencia |
|---|---|---|---|
| QA-1 | MEDIO | `"lint": "next lint"` obsoleto; romperá al migrar a Next 16 | `package.json:9,19,28` |
| QA-2 | MEDIO | Ningún test de rutas API, RLS, RPC ni flujo de pedidos | `__tests__/**`; `jest.config.ts:18` sin `coverageThreshold` |
| QA-3 | BAJO | Duplicación de validación de producto, detectores de migración y carga de órdenes | `product/add` vs `product/update`; `visits/blocked-ips/contacts`; `seller/orders` vs `seller/pagos` |

---

## 3. Plan de ejecución

### P0 — Hoy (0-48 h): contención

**P0.1 Rotar credenciales filtradas (SEC-1)**

1. Rotar solo las credenciales aún activas: `RESEND_API_KEY` y `GEMINI_API_KEY`. Actualizar los valores en Vercel/Supabase/entorno local. `MONGODB_URI`, `CLERK_SECRET_KEY`, `INNGEST_*` y `CLOUDINARY_*` pertenecen a servicios dados de baja: no requieren rotación, pero **sí deben desaparecer del historial de Git** (paso 3) y las cuentas deben estar cerradas.
2. Revisar logs de esos proveedores por uso indebido (fechas de los commits antiguos en adelante).
3. Purgar el historial con `git filter-repo` o BFG y hacer push forzado coordinado con el equipo; limpiar ramas, tags y forks.
4. **Criterio de aceptación:** `git log --all -p -- .env` ya no devuelve valores; las credenciales antiguas han sido invalidadas en todos los proveedores.
5. Mantener `.gitignore:34-35` y añadir un hook/CI que rechace archivos `.env*`.

**P0.2 Corregir el precio efectivo (FUN-1)**

1. Crear un único helper, p. ej. `getEffectiveUnitPrice(product)` con la regla `offerPrice > 0 && offerPrice < price ? offerPrice : price`.
2. Usarlo en `components/ui/Price.jsx`, `lib/cart.js`, `components/OrderSummary.jsx`, `app/(shop)/cart/page.jsx`, `components/Navbar.jsx`, `lib/ai/cart.js`, `app/seller/dashboard/page.jsx` y en el RPC.
3. Corregir `mapProduct` (`lib/supabase/records.js:8`) para conservar `null` como «sin oferta» en vez de convertirlo en 0; actualizar el texto del formulario «usa 0 si no aplica» por «déjalo vacío si no aplica» y la validación de `app/api/product/add/route.js`.
4. **Criterio de aceptación:** producto con `offer_price = 0` muestra `price`, no `$0.00` ni `-100 %`; carrito, navbar, chat y total de orden coinciden. Añadir test de regresión en `__tests__/cart.test.ts` con `offerPrice: 0`.

**P0.3 Evitar que el bloqueo de IP sea bypass (SEC-3)**

1. Ejecutar `isBlocked` también para `/api` (extraer helper compartido); no excluir `/api` en `middleware.js:67-69,88`.
2. Delegar la caché de IP a Redis compartido (ya existe Upstash) en vez del `Map` por instancia; acortar el TTL de 60 s.
3. Derivar la IP de una cabecera confiable de la plataforma y no del primer valor de `x-forwarded-for`; calcular `p_ip` en servidor en `app/api/visits/route.js`.
4. **Criterio de aceptación:** una IP bloqueada recibe 403 tanto en páginas como en `/api/chat`, `/api/visits` y `/api/order/*`.

---

### P1 — Semana 1: Autorización, dinero y datos

**P1.1 Restaurar y versionar la capa de base de datos (SEC-5, FUN-2)**

1. Recuperar de Supabase la migración base `20261020140000_initial_schema.sql`, `20261027160000_category_heroes.sql`, `20261028170000_commerce_visibility.sql` y el cuerpo de `create_order`, `storefront_products` y políticas de Storage; guardarlos en `supabase/migrations/`.
2. Documentar el contrato del RPC: columnas, regla de IVA 15 %, envío excluido, descuento de stock y limpieza de carrito atómicos.
3. Actualizar `supabase/README.md` para que deje de decir que no se puede verificar.
4. **Criterio de aceptación:** se puede crear un proyecto Supabase nuevo solo con `supabase db push` + migraciones, sin pasos manuales ocultos.

**P1.2 Cerrar IDOR de productos (SEC-2)**

1. Añadir `.eq("user_id", user.id)` a la lectura y escritura en `product/update/[id]`, `product/delete/[id]` y `product/seller-list/[id]`; responder 404 si no hay fila.
2. Validar que `[id]` sea UUID.
3. Reforzar en RLS: `using (user_id = auth.uid())` / `with check (user_id = auth.uid())` para escrituras de vendedor.
4. **Criterio de aceptación:** test de integración donde el seller A intenta editar/borrar/leer el producto del seller B y recibe 404/403.

**P1.3 Endurecer creación de órdenes (FUN-2, FUN-3, FUN-4)**

1. En `order/create/route.js`: validar UUID de producto, existencia, `is_active`, `stock >= quantity`, tope de cantidad y número máximo de ítems; validar formato de email, teléfono y cédula y longitudes de dirección.
2. Dentro del RPC: recalcular precios desde la tabla de productos (nunca desde el body), descontar stock y limpiar carrito en una sola transacción; guardar snapshots de nombre/imagen/precio.
3. Idempotencia: `Idempotency-Key` del cliente + restricción única `(user_id, idempotency_key)`; ante conflicto devolver la orden existente.
4. Añadir `stats` de IVA Deriva: comparar `getOrderTotals()` con el monto guardado en un test de integración.

**P1.4 Paginación y PII del panel (SEC-12)**

1. Añadir `limit`, `offset` y filtros de estado a `seller-orders` y `order/list`.
2. Definir si un seller ve todas las órdenes o solo las suyas; si hay un único administrador, documentarlo y reforzarlo en RLS.
3. Reducir campos sensibles en la respuesta (últimos dígitos de cédula/teléfono, nombre); mantener la búsqueda operativa del panel.

**P1.5 Confirmación de pago auditable (SEC-6, FUN-5)**

1. Validar UUID; solo permitir transición `pending → paid` con `eq("is_paid", false)`.
2. Registrar `paid_at`, `paid_by`, `payment_ref`; actualizar `orders.status` de forma atómica.
3. Enviar el correo a `address.email` de la orden (hoy va a `profiles.email`, `send-order-email/index.ts:36,64`) o documentar el criterio.

---

### P2 — Semanas 2-3: Defensa en profundidad

**P2.1 Autorización server-side del panel (SEC-4)**

Crear `app/seller/layout.server.js` (o middleware con refresh de sesión vía `@supabase/ssr`): `auth.getUser()` desde cookies + consulta de `profiles.role`, con `redirect("/sign-in")` si no es seller. Mantener las comprobaciones de API como segunda capa.

**P2.2 Validación y cabeceras (SEC-7, SEC-8, SEC-9)**

1. Esquemas Zod/Valibot compartidos para orden, carrito, productos y popup; UUID en todos los `[id]`; topes de longitud y cantidad; aplicar `isValidLink` también a `image_url`/`audio_url` del popup.
2. Rate limit HTTP en `/api/visits` con IP confiable; comprobación de `Origin`/`Sec-Fetch-Site` en POST/PUT/DELETE sin Bearer.
3. `headers()` en `next.config.mjs`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, CSP con nonce para el script inline de `app/layout.js:28-35`.
4. Revocar `execute` de `is_ip_blocked` a `anon`; impedir que un usuario autenticado reclame una sesión de chat huésped (`auth.uid() is null`).

**P2.3 Higiene de logs y dependencias (SEC-10, SEC-11, QA-1)**

1. Quitar `data` del `console.error` en `context/AppContext.jsx:20`; logger centralizado con redacción de PII; evitar objetos completos de Supabase en logs.
2. Cambiar `"lint": "next lint"` por `"lint": "eslint ."` y alinear `@next/third-parties` y `eslint-config-next` con Next 15 (o migrar todo a Next 16 de forma planificada).
3. Añadir `npm audit` y `npm run lint` al CI.

**P2.4 Cobertura de tests (QA-2, QA-3)**

1. Tests con mocks de Supabase para `/api/order/create`, `/api/cart/update`, `/api/order/update-payment`, IDOR de productos y RLS cross-usuario.
2. `coverageThreshold` en `jest.config.ts`; eliminar `__tests__/sum.test.ts` (placeholder).
3. Extraer a `lib/` la validación de producto, los detectores de migración y la carga de órdenes del panel.

---

### P3 — Mes: SEO, UX, accesibilidad y performance

**P3.1 SEO (UX-1)**

1. `generateMetadata` por ruta con título/descripción únicos; `metadataBase`, `alternates.canonical` y `openGraph` (`locale: es_EC`, `type: website`; `product` en la PDP).
2. `app/robots.ts` y `app/sitemap.ts`; excluir `/seller/**`, auth y parámetros de filtro; `noindex` en `/Productos` o redirect 301 a `/all-products?category=rfid`.
3. Unificar rutas a kebab-case (`/Acerca`, `/Productos`, `/Contactos`) con redirects 301.

**P3.2 Flujo de compra (UX-3, UX-4, UX-5, UX-10)**

1. `all-products/page.jsx`: usar `useSearchParams()` y sincronizar búsqueda/precio/orden con la URL, o compartir el estado de búsqueda por contexto.
2. `OrderSummary`: convertir en `<form onSubmit>` con `type="submit"`, errores inline (`role="alert"`, `aria-invalid`) y foco al primer campo inválido. Persistir `email`/`idNumber` con la dirección o quitarlos del checkout; hacer visible el enlace a `/add-address` y validar teléfono `^09\d{8}$`.
3. `WhatsappFloat.jsx:14`: usar `COMPANY_INFO.whatsapp_url` en vez del número hardcodeado.
4. `AuthForm.jsx:62`: respetar un parámetro `next`/`redirectTo` para volver al producto o al carrito tras iniciar sesión.

**P3.3 Contenido y accesibilidad (UX-2, UX-6, UX-7, UX-8)**

1. `defaultPopup.enabled = false`, mostrar diferido (5-10 s o tras interacción), sin autoplay de audio y con `loading="lazy"`.
2. Newsletter: implementar alta real o retirar el formulario para evitar falsos positivos.
3. `HeaderSlider`: un solo `<h1>` (o `<h2>` en slides inactivos), botón de pausa y respeto a `prefers-reduced-motion` también en el `setInterval` de React.
4. Regla global `:focus-visible { outline: 2px solid #0060E6; outline-offset: 2px }`; `Loading.jsx` con `role="status"` y texto `sr-only`; focus trap + retorno de foco en `PopupModal` y en el modal de privacidad del footer; `aria-controls`/`tabpanel` en la bandeja de chat.

**P3.4 Performance y consistencia (UX-9, UX-11)**

1. Dividir `AppContext` (auth / catálogo / carrito) o memoizar el `value`; `useMemo` para `cartProducts`, `searchResults` y `suggestionPool` en `Navbar`.
2. Eliminar `toast.error` del sondeo silenciento y usar `visibilitychange` en vez de 30 s.
3. Limpiar `URL.createObjectURL` con `useEffect` y usar `next/image` en previews del panel.
4. Definir `seller-fade-in`, `seller-drawer-in` y `scale-in` (o usar las animaciones existentes); quitar el border-radius global de `globals.css:14-18`; corregir copys mixtos y testimonios genéricos.

---

## 4. Checklist de verificación antes de liberar

- [ ] Credenciales antiguas rotadas e historial de Git purgado; `git log -p -- .env` limpio.
- [ ] Producto con `offer_price = 0` muestra precio normal en tarjeta, navbar, carrito, chat y orden.
- [ ] Orden de prueba: monto guardado = `getOrderTotals()` (IVA 15 %, envío excluido); stock descontado y carrito vaciado en una transacción.
- [ ] Doble envío del checkout no crea dos órdenes (idempotencia).
- [ ] Seller A no puede leer/editar/borrar productos ni órdenes del seller B (test automatizado).
- [ ] IP bloqueada da 403 en páginas **y** en APIs; la IP del visitante no puede falsificarse con `x-forwarded-for`.
- [ ] RLS verificada en Supabase: `profiles.role` no autoasignable; anon no ejecuta `is_ip_blocked`; Storage restringido a rutas propias.
- [ ] `/seller` redirige a `/sign-in` para visitantes no autenticados.
- [ ] Headers de seguridad presentes en todas las respuestas (`curl -I`).
- [ ] `npm run build`, `npm run lint`, `npm test` y `npm audit` en verde en CI.
- [ ] Cada ruta pública tiene título/descripción/canonical únicos; `robots.txt` y `sitemap.xml` accesibles.
- [ ] Recorrido completo de compra en móvil: búsqueda → producto → login con retorno → carrito → dirección → orden → correo.

---

## 5. Estimación orientativa

| Fase | Trabajo | Esfuerzo aprox. |
|---|---|---|
| P0 | Rotación de secretos, purga de historial, fix de precio, bloqueo de IP en API | 1-2 días |
| P1 | Migración base/RPC, IDOR, orden idempotente, pagos, PII | 1 semana |
| P2 | Layout seller, esquemas, headers, logs, tests de API | 2 semanas |
| P3 | SEO, UX de compra, a11y, performance, limpieza | 3-4 semanas |

**Prioridad de negocio:** P0.1 (secretos) y P0.2 (precio en cero) impactan directamente en seguridad e ingresos. P3.1 (SEO) es el mayor multiplicador de crecimiento una vez corregida la base.

---

## 6. Estado de ejecución del P0 (2026-11-24)

### P0.2 Precio efectivo — ✅ implementado

- Nuevo helper `lib/pricing.js` (`getEffectiveUnitPrice`, `hasActiveOffer`, `getDiscountedPrice`).
- Aplicado en `lib/cart.js`, `components/ui/Price.jsx`, `components/Navbar.jsx`, `components/OrderSummary.jsx` (vía `getCartAmount`), `app/(shop)/cart/page.jsx`, `app/(shop)/all-products/page.jsx`, `app/seller/dashboard/page.jsx`, `app/seller/product-list/page.jsx`, `lib/ai/catalog.js` y formularios seller.
- Regla única: `offerPrice > 0 && offerPrice < price` → oferta; `0`, `null`, `""` y ausente → precio normal.
- Test de regresión añadido en `__tests__/cart.test.ts` para `offerPrice: 0`, `null`, `""` y sin campo.
- Copy de los formularios actualizado: «0 = sin oferta».

### P0.3 Bloqueo de IP — ✅ implementado

- `lib/blockedIps.js`: consulta centralizada, caché compartida en Upstash (TTL 30 s), sin caché por instancia en producción, invalidación explícita al bloquear/desbloquear.
- `middleware.js`: comprueba la IP bloqueada en **todas** las rutas, incluidas `/api` (respuesta JSON 403) y `/seller`; el matcher ya no excluye `/api`.
- `lib/visits.js`: la IP se toma de cabeceras confiables (`IP_SOURCE_HEADER`, `x-vercel-forwarded-for` en Vercel, `cf-connecting-ip`, `x-real-ip`) y se valida antes de usarla; `x-forwarded-for` queda como último recurso.
- `lib/ai/request.js`: el rate limit anónimo usa la misma IP confiable.
- `app/api/blocked-ips/route.js`: invalida la caché al bloquear o desbloquear.
- **Configuración recomendada:** definir `IP_SOURCE_HEADER` con el nombre de la cabecera que tu CDN/proxy sobrescribe (por ejemplo `cf-connecting-ip`). En Vercel, la variable `VERCEL=1` ya está presente.

### P0.1 Rotación de credenciales — ⚠️ requiere acciones manuales

Este agente **no puede rotar credenciales en proveedores externos ni reescribir el historial remoto** (push forzado es destructivo y debe coordinarse). Pasos pendientes:

1. Rotar solo `RESEND_API_KEY` y `GEMINI_API_KEY`. El resto (`MONGODB_URI`, `CLERK_SECRET_KEY`, `INNGEST_*`, `CLOUDINARY_*`) son de servicios dados de baja: no se rotan, pero se eliminan del historial en el paso 3.
2. Actualizar los valores en Vercel/Supabase/entorno local y revisar logs de uso indebido.
3. Purgar el historial con `scripts/purge-env-history.sh`: crea un respaldo espejo, reescribe en un clon separado, verifica que `.env` ya no aparezca y **no hace push**. Requiere `git-filter-repo` (`brew install git-filter-repo` o `python3 -m pip install --user git-filter-repo`). El propio script imprime los comandos de push forzado para ejecutar tras revisarlos.
4. Confirmar: `git log --all -p -- .env` no devuelve valores y las credenciales antiguas ya no autentican.
5. `.gitignore` ya ignora `.env`/`.env*` (no fue necesario cambiarlo).

---

## 7. Estado de ejecución del P1 (2026-11-24)

### P1.1 Capa base — ⚠️ documentado, requiere recuperación en Supabase

- No se inventó un esquema: se crearon `supabase/CONTRATO_BASE.md` (contrato esperado de RLS, Storage, RPC y columnas) y `supabase/VERIFICACION_SEGURIDAD.sql` (auditoría de solo lectura para ejecutar en el SQL Editor).
- `supabase/README.md` referencia ambos documentos.
- **Pendiente manual:** restaurar la migración base y el cuerpo de `create_order` desde el historial de Supabase, guardarlos en `supabase/migrations/` y archivar la salida de la consulta de verificación.

### P1.2 IDOR de productos — ✅ implementado

- `lib/validation.js` con `isUuid` y validaciones de dirección/idempotencia reutilizables.
- `.eq("user_id", user.id)` en lectura y escritura de `product/update/[id]`, `product/delete/[id]`, `product/seller-list/[id]` y en el listado `product/seller-list`.
- UUID validado en esas rutas.
- `product/reorder`: verifica que todos los IDs enviados pertenezcan al seller antes de llamar al RPC (403 si no).
- **Pendiente manual:** reforzar lo mismo en RLS (`using/with check user_id = auth.uid()`).

### P1.3 Órdenes — ✅ implementado (RPC pendiente de verificar)

- `order/create`: valida dirección (longitudes, email, celular `09xxxxxxxx`, cédula/RUC), UUID de producto, 1-20 ítems y cantidad 1-99.
- Prevalidación de `is_active` y stock leyendo `products`; la autoridad final sigue siendo `create_order` en transacción.
- Idempotencia: cabecera `Idempotency-Key` generada en `OrderSummary`, búsqueda previa de orden existente y escritura de `orders.idempotency_key` con índice único por usuario. Degrada sin romper si la columna aún no existe.
- **Pendiente manual:** aplicar `20261124140000_order_idempotency.sql` y confirmar que `create_order` deriva precios y descuenta stock atómicamente.

### P1.4 Órdenes del panel — ✅ implementado

- `order/seller-orders`: columnas explícitas (ya no `select("*")`), paginación `limit`/`offset` (máx. 100), filtros `status=paid|pending` y búsqueda por cliente, `count` total y respuesta con `total`.
- `SELLER_ORDER_SCOPE=own` limita las órdenes a las del seller autenticado; por defecto `all` (administrador único).
- Panel `orders`/`pagos` y dashboard piden `limit=100` y muestran el total real.
- `order/list`: paginación, columnas explícitas y fallback si falta `status`.
- Corregido el doble ordenamiento en `my-orders` (las órdenes recientes vuelven a aparecer primero).

### P1.5 Pagos — ✅ implementado

- `order/update-payment/[id]`: valida UUID, bloquea la confirmación duplicada (409), actualiza con `eq("is_paid", false)` y registra `paid_at`, `paid_by`, `payment_ref` y `status = 'paid'`.
- Bitácora `order_payment_events` con RLS para sellers (inserción best-effort; no bloquea la confirmación).
- La Edge Function envía la confirmación al `address.email` de la orden (con fallback al correo del perfil) y usa `address.fullName` en el saludo.
- **Pendiente manual:** aplicar `20261124150000_order_payment_audit.sql`.

### Verificación P1

- `npm test`: 13 suites, 84 tests en verde (nuevo `__tests__/validation.test.ts`).
- `npm run build`: OK. `npm run lint`: sin errores (advertencias preexistentes).

---

## 8. Estado de ejecución del P2 (2026-11-24)

### P2.1 Panel seller con autorización server-side — ✅ implementado

- `lib/supabase/serverSession.js`: `createServerClient` + `await cookies()`, valida con `auth.getUser()` y consulta `profiles.role`. Nunca usa `service_role`.
- `components/seller/SellerShell.jsx`: wrapper cliente con el markup original.
- `app/seller/layout.jsx`: Server Component que redirige a `/sign-in` si no hay sesión de seller. Las APIs mantienen su comprobación como segunda capa.
- Las rutas `/seller/**` pasan a renderizarse en servidor (esperado).

### P2.2 Validación, anti-abuso y headers — ✅ implementado

- `lib/csrf.js`: comprueba `Origin` / `Sec-Fetch-Site` en mutaciones públicas (403 si el origen no es de confianza).
- Aplicado a `/api/visits`, `/api/chat`, `/api/chat/lead`, `/api/chat/feedback` y `/api/chat/events`.
- `/api/visits`: esquema Zod para `path`/`referrer`, rate limit compartido 60/min con `Retry-After` (best-effort).
- `/api/popup`: `isValidLink` aplicado también a `image_url` y `audio_url`; volumen validado con Zod.
- `lib/schemas.js` con `visitBodySchema` y `popupBodySchema`; `zod@^4.6.7` añadido como dependencia directa.
- `next.config.mjs`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, HSTS, `Permissions-Policy` y CSP.
- **Limitación conocida:** el CSP usa `'unsafe-inline'` en `script-src` porque `app/layout.js` tiene un script inline y `@next/third-parties/google` inyecta otro. El nonce queda pendiente de migrar Analytics.
- `media-src` incluye `'self'`, `blob:`, `data:` y `https://*.supabase.co` para no bloquear los videos de producto (corrección aplicada tras detectar que el CSP inicial impedía reproducirlos).

### P2.3 Logs y dependencias — ✅ implementado

- `lib/logger.js` con redacción de PII; reemplaza los `console.error` que imprimían cuerpos/objetos completos en `AppContext`, `product/add`, `banner`, `order/create` y `update-payment`.
- `"lint": "eslint ."` y `eslint.config.mjs` adaptado a `eslint-config-next` 15 (FlatCompat + ignores de `coverage/.next`).
- Versiones alineadas: `next`, `@next/third-parties` y `eslint-config-next` en `^15.5.29`.
- `npm audit --omit=dev`: **0 vulnerabilidades** en producción. Las 18 alertas moderadas restantes son del ecosistema de Jest (dev).

### P2.4 Tests de API — ✅ implementado

- `jest.config.ts` añade `moduleNameMapper` para el alias `@/`.
- `__tests__/apiRoutes.test.ts`: 4 pruebas con Supabase mockeado — IDOR de producto (404 y sin update), dirección inválida (400 sin RPC), idempotencia (devuelve la orden existente sin crear otra) y pago duplicado (409 sin update).

### Verificación P2

- `npm test`: 14 suites, 88 tests en verde.
- `npm run build`: OK. `npm run lint`: 0 errores, 0 advertencias.

### Sigue pendiente de fases posteriores / manual

- Rotar credenciales filtradas y purgar historial de Git (P0.1).
- Restaurar migración base y verificar RLS en Supabase (P1.1).
- CSP con nonce tras migrar Google Analytics.
- Tests cross-usuario reales contra Supabase local (RLS), no solo mocks.

---

## 9. Estado de ejecución del P3 (2026-11-24)

### P3.1 SEO — ✅ implementado

- `lib/seo.js` con `siteMetadata` y `buildPageMetadata` (canonical, Open Graph `es_EC`, Twitter, `metadataBase` desde `NEXT_PUBLIC_SITE_URL`).
- `app/layout.js` usa el metadata global; `app/robots.ts` y `app/sitemap.ts` generan `/robots.txt` y `/sitemap.xml` (visibles en el build).
- Títulos/descripciones/canonical únicos por ruta mediante `layout.js` de segmento (Next no permite exportar metadata desde componentes con `"use client"`).
- PDP con `generateMetadata` en `app/(shop)/product/[id]/layout.js` (RPC `storefront_product`, fallback seguro). `openGraph.type` usa `"website"` porque Next.js 15 no admite `"product"` en ese campo y lanzaba un runtime error.
- Redirects 308 de rutas heredadas resueltos en `middleware.js` (comparación exacta): `/Acerca` → `/acerca`, `/Contactos` → `/acerca#contacto`, `/Productos` → `/all-products?category=rfid`.
- **Nota:** las `redirects` de `next.config.mjs` ignoran mayúsculas, así que `/Acerca → /acerca` también capturaba `/acerca` y generaba un bucle infinito (`ERR_TOO_MANY_REDIRECTS`). Por eso el canonicalizado vive en middleware con comparación sensible a mayúsculas; además se unificaron todos los enlaces internos a `/acerca`. En macOS (FS insensible a mayúsculas) el directorio quedó como `app/(shop)/acerca`.

### P3.2 Flujo de compra — ✅ implementado

- `/all-products`: la URL es la fuente de verdad (`useSearchParams` + `router.replace` con debounce). La búsqueda del navbar filtra aunque ya estés en el catálogo; categoría, precio y orden se comparten por query string. Envuelto en `Suspense`.
- `OrderSummary`: `<form onSubmit>` con `noValidate`, errores inline (`role="alert"`, `aria-invalid`, foco al primer inválido) y enlace visible a `/add-address`.
- Direcciones guardadas completas: nueva migración `20261124160000_address_contact_fields.sql`, API y UI persisten/leen `email` e `idNumber`; `/add-address` valida celular, correo y cédula, usa `<h1>` y `alt` descriptivo.
- `WhatsappFloat` usa `COMPANY_INFO.whatsapp_url` (número completo).
- `AuthForm`: respeta `?next=...` (validado como ruta relativa) en login, registro, OAuth y confirmación por correo.
- Newsletter real: `app/api/newsletter/route.js` + `20261124170000_newsletter.sql` (tabla con RLS de solo inserción, honeypot, rate limit 5/h). El footer ya no muestra éxito falso.

### P3.3 Contenido y accesibilidad — ✅ implementado

- Popup desactivado por defecto en el código (se activa desde el panel), **apertura inmediata al cargar la página** (el propietario lo pidió así; antes era diferido), sin autoplay de audio, focus trap, retorno de foco, Escape y `prefers-reduced-motion`. Mantiene el «no volver a mostrar en esta sesión» mediante `sessionStorage`.
- Hero: un solo `<h1>`, botón de pausa y respeto a movimiento reducido en el `setInterval`.
- `Loading` con `role="status"`; `:focus-visible` global; eliminado el border-radius global que rompía los pills.
- Bandeja de chat seller con `aria-controls`/`role="tabpanel"`.
- Modal de privacidad del footer con Escape y retorno de foco.

### P3.4 Performance y consistencia — ✅ implementado

- `AppContext`: sondeo silencioso, `visibilitychange` + intervalo de 5 min, `value` memoizado y funciones estabilizadas con `useCallback`.
- `Navbar`: `useMemo` en listas calculadas y copys corregidos.
- Previews del panel: `URL.createObjectURL` con limpieza y `next/image` para blobs.
- Animaciones `seller-fade-in`, `seller-drawer-in` y `scale-in` definidas en Tailwind.

### Incidencias resueltas durante P3

- El CSP inicial bloqueaba los videos: `media-src` añadido en `next.config.mjs`.
- Las miniaturas del inventario del panel mostraban el icono de imagen rota cuando el optimizador de Next (`/_next/image`) no está disponible en el hosting o falla con PNG pesados. Nuevo `components/seller/ProductThumb.jsx`: carga la URL pública de Supabase directamente, con `onError` que muestra un icono de paquete en vez de una imagen rota.
- El mismo fallo aparecía en categorías, carrusel y ventana emergente del panel (todas usan imágenes remotas de Supabase). Se añadió `images.unoptimized: true` en `next.config.mjs`: las imágenes se sirven directas desde Supabase (que ya guarda WebP redimensionado al subir), sin depender del optimizador. `remotePatterns` se conserva para poder reactivar la optimización en un host que la soporte.
- Las subcategorías personalizadas del menú (p. ej. RFID → Lectores RFID y Kioscos → Impresoras de punto de venta) mostraban un 404 prematuro porque la página validaba contra las categorías por defecto antes de recibir las de Supabase. `app/(shop)/categoria/[...slug]/page.jsx` ahora espera a `categoriesLoaded` y se recalcula con `categoriesVersion`; test de regresión en `__tests__/categoryRoute.test.jsx`.
- Next generó `tsconfig.json`; al coexistir con `jsconfig.json`, el alias `@/*` se perdió y Turbopack falló. Se añadieron `baseUrl`/`paths` al `tsconfig.json` y se excluyó `supabase/functions` del chequeo de tipos. El middleware usa imports relativos como refuerzo.
- Metadata exportada desde Client Components rompía el build: se movió a `layout.js` de segmento.

### Verificación P3

- `npm run build`: OK (incluye `/robots.txt` y `/sitemap.xml`).
- `npm test`: 14 suites, 88 tests en verde.
- `npm run lint`: 0 errores, 0 advertencias.
- `next dev` (Turbopack): middleware compila sin errores de alias.

### Pendiente tras P3

- Solo acciones manuales: rotar `GEMINI_API_KEY`/`RESEND_API_KEY`, purgar historial con `scripts/purge-env-history.sh`, restaurar migración base y verificar RLS en Supabase, aplicar las 5 migraciones nuevas y definir `IP_SOURCE_HEADER` / `SELLER_ORDER_SCOPE` si aplica.
