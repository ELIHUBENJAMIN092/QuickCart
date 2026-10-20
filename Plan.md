# Plan de Rediseño: Estilo Wonder Theme para COMPEL

**Fecha:** 20 de octubre de 2026  
**Referencia:** https://wonder-theme-interior.myshopify.com/  
**Objetivo:** Aplicar la estética premium del tema Wonder (tipografía serif, paleta neutra cálida, heroes grandes, grid editorial, secciones storytelling y CRO) al storefront de COMPEL manteniendo el catálogo tech B2B.

---

## 1. Design System (base de todo)

### Tokens de color — `tailwind.config.mjs` + `app/globals.css`

Reemplazar los `blue-600/700/900` dispersos por una paleta premium:

| Token | Valor | Uso |
|-------|-------|-----|
| `brand-cream` | `#F7F4EF` | fondos de página/secciones |
| `brand-sand` | `#EDE6DB` | paneles, cards highlight |
| `brand-ink` | `#1C1B1A` | texto principal, headings |
| `brand-charcoal` | `#3D3A36` | cuerpo de texto |
| `brand-muted` | `#8A847A` | metadatos, breadcrumbs |
| `brand-accent` | `#1A3A5B` (navy profundo) | CTAs primarios, links |
| `brand-accent-hover` | `#0F2740` | hover de CTAs |
| `brand-line` | `#E0D9CE` | bordes sutiles |
| `brand-sale` | `#9B3B2E` | badges de oferta |
| `brand-success` | `#3D6B4F` | stock disponible |

### Tipografía

- **Display/Headings:** `Playfair Display` (serif elegante) vía `next/font/google` — para h1/h2 de secciones y nombres de producto en PDP
- **Body:** `Inter` o `Manrope` (sans limpia) — reemplazar Montserrat para un look más editorial
- Escala de tipo consistente: `text-display` (clamp), `text-h1` … `text-caption`, con `tracking-tight` en serif y `tracking-wide uppercase text-xs` para eyebrows/labels

### Componentes base — `components/ui/`

Crear variantes reutilizables (evitar el caos de clases inline):

- `Button.jsx` — `primary` (navy solid), `secondary` (outline ink), `ghost`, `link` (underline animation)
- `Badge.jsx` — `sale`, `trending`, `new`, `sold-out`, `limited`
- `SectionHeading.jsx` — eyebrow + título serif + descripción opcional + link
- `Container.jsx` — ancho estándar `max-w-7xl mx-auto px-4 md:px-8 lg:px-12`
- `Price.jsx` — precio, tachado, % descuento, currency formateada

---

## 2. Estructura de Categorías de COMPEL

Categorías madres (4) con sus subcategorías. Esta estructura alimenta el mega menu del navbar, el sidebar de filtros del catálogo, la sección "Shop by Department" del home y los breadcrumbs.

### 2.1 Código de Barras

Slug sugerido: `codigo-de-barras`

Subcategorías:
- Impresoras de etiquetas → `codigo-de-barras/impresoras-etiquetas`
- Impresoras de brazaletes → `codigo-de-barras/impresoras-brazaletes`
- Impresoras de punto de venta → `codigo-de-barras/impresoras-punto-venta`
- Lectores → `codigo-de-barras/lectores`
- Suministros (etiquetas) → `codigo-de-barras/suministros`

### 2.2 Computo Móvil

Slug sugerido: `computo-movil`

Subcategorías:
- Computadores de mano → `computo-movil/computadores-de-mano`
- Tabletas → `computo-movil/tabletas`
- Lectores → `computo-movil/lectores`

### 2.3 RFID

Slug sugerido: `rfid`

Subcategorías:
- Antenas → `rfid/antenas`
- Impresoras → `rfid/impresoras`
- Tags → `rfid/tags`
- Portales → `rfid/portales`

### 2.4 Identificación PVC

Slug sugerido: `identificacion-pvc`

Subcategorías:
- Impresoras → `identificacion-pvc/impresoras`
- Suministros → `identificacion-pvc/suministros`
- Accesorios → `identificacion-pvc/accesorios`
- Tarjetas con Chip → `identificacion-pvc/tarjetas-con-chip`

### 2.5 Implementación del árbol de categorías

Crear `lib/categories.js` como fuente única de verdad:

```js
export const categories = [
  {
    name: 'Código de Barras',
    slug: 'codigo-de-barras',
    image: '/images/categories/codigo-barras.jpg', // placeholder o foto real
    description: 'Impresión y lectura de códigos de barras para retail e industria',
    subcategories: [
      { name: 'Impresoras de etiquetas', slug: 'impresoras-etiquetas' },
      { name: 'Impresoras de brazaletes', slug: 'impresoras-brazaletes' },
      { name: 'Impresoras de punto de venta', slug: 'impresoras-punto-venta' },
      { name: 'Lectores', slug: 'lectores' },
      { name: 'Suministros', slug: 'suministros' },
    ],
  },
  {
    name: 'Computo Móvil',
    slug: 'computo-movil',
    image: '/images/categories/computo-movil.jpg',
    description: 'Equipos portátiles y tablets para trabajo en campo',
    subcategories: [
      { name: 'Computadores de mano', slug: 'computadores-de-mano' },
      { name: 'Tabletas', slug: 'tabletas' },
      { name: 'Lectores', slug: 'lectores' },
    ],
  },
  {
    name: 'RFID',
    slug: 'rfid',
    image: '/images/categories/rfid.jpg',
    description: 'Identificación por radiofrecuencia: antenas, impresoras, tags y portales',
    subcategories: [
      { name: 'Antenas', slug: 'antenas' },
      { name: 'Impresoras', slug: 'impresoras' },
      { name: 'Tags', slug: 'tags' },
      { name: 'Portales', slug: 'portales' },
    ],
  },
  {
    name: 'Identificación PVC',
    slug: 'identificacion-pvc',
    image: '/images/categories/identificacion-pvc.jpg',
    description: 'Impresoras, suministros y tarjetas para credenciales y membresías',
    subcategories: [
      { name: 'Impresoras', slug: 'impresoras' },
      { name: 'Suministros', slug: 'suministros' },
      { name: 'Accesorios', slug: 'accesorios' },
      { name: 'Tarjetas con Chip', slug: 'tarjetas-con-chip' },
    ],
  },
];
```

**Notas de implementación:**
- El campo `category` del modelo Product debe usar el path completo o un par `{ parent, sub }` para poder filtrar correctamente. Opción recomendada: migrar a `category` (madre) + `subcategory` (hija) como strings, y actualizar el formulario del seller para un select jerárquico (madre → sub).
- Mientras se hace la migración, se puede derivar la subcategoría del string actual de `category` si es necesario.
- El mega menu del navbar se genera iterando `categories` con sus `subcategories`.
- La sección "Shop by Department" del home muestra las 4 madres con imagen.
- Los filtros del catálogo permiten seleccionar madre y drill-down a sub.

---

## 3. Estructura de rutas

Crear route group para el storefront (deduplicar Navbar/Footer):

```
app/(shop)/layout.jsx     → Navbar + BannerOferta + children + Footer + floats
app/(shop)/page.jsx       → Home
app/(shop)/all-products/  → catálogo (mover de app/all-products)
app/(shop)/product/[id]/  → PDP
app/(shop)/cart/
app/(shop)/my-orders/
app/(shop)/order-placed/
app/(shop)/add-address/
app/(shop)/Acerca/
app/(shop)/Contactos/
app/(shop)/Productos/     → landing RFID estática (o eliminar si ya no aplica)
app/seller/…              → sin cambios de layout (se mantiene fuera del group)
```

`app/layout.js` global se queda con providers (Clerk, AppContext, Toaster, fonts).

---

## 4. Navbar (estilo Wonder)

`components/Navbar.jsx` rediseñado:

- **Barra superior** (reemplaza/rediseña `BannerOferta`): texto centrado, fondo `brand-ink`, `text-brand-cream`, mensajes rotativos o estático ("Envíos a todo el Ecuador · Soporte B2B")
- **Barra principal sticky** (`sticky top-0 z-50 bg-brand-cream/95 backdrop-blur border-b border-brand-line`):
  - Logo izquierda
  - Nav central: **Inicio, Catálogo (mega menu), Soluciones, Nosotros, Contacto**
  - Derecha: búsqueda (icono → drawer), carrito (drawer), cuenta
- **Mega menu** para Catálogo: se genera desde `lib/categories.js`. Columnas por categoría madre con sus subcategorías + imagen destacada de la categoría (como Wonder hace con Living room / Dining room…). Al hacer hover o click en la madre se despliega el panel completo.
- **Cart drawer** en lugar de solo icono: lista de items, subtotal, "Ver carrito" / "Checkout"
- Mobile: hamburger → full-screen slide con acordeones de las 4 madres y sus subcategorías

---

## 5. Homepage — secciones estilo Wonder

`app/(shop)/page.jsx` composición:

1. **Hero fullscreen** (reemplaza `HeaderSlider`): 3 slides, imagen a pantalla completa con overlay gradiente sutil, eyebrow uppercase, título serif grande, 1-2 CTAs ("Explorar catálogo" / "Ver soluciones RFID"). Auto-play más lento (6s), pause on hover, barra de progreso
2. **Shop by Department** — grid de las **4 categorías madres** (Código de Barras, Computo Móvil, RFID, Identificación PVC) con imagen + nombre serif debajo + link a `/all-products?category={slug}`. Datos desde `lib/categories.js`
3. **Featured Collection / "Selección destacada"** — tabs ("Más vendidos" / "Novedades" / "Ofertas") + grid de products reales de MongoDB con ProductCards premium
4. **Banner storytelling** — imagen lifestyle ancha + texto centrado ("Tecnología que identifica tu negocio") + CTA, fondo `brand-sand`
5. **Product Benefits** — sección tipo Wonder: imagen central de producto destacado (ej: una impresora Zebra o lector RFID) + 4 benefits con iconos a los lados:
   - Impresión industrial de alto volumen
   - Certificación y soporte local en Ecuador
   - Integración con sistemas existentes
   - Garantía y repuestos originales
6. **Sale banner** — fondo `brand-ink`, texto cream, CTA a ofertas / catálogo
7. **Testimonios marquee** — carrusel infinito de testimonios B2B (empresas o placeholder) con nombre, empresa, quote
8. **Brand logos** — refinar `BrandLogos.jsx` (marquee se mantiene, fondo cream, logos en grayscale/color al hover). Marcas: Zebra, TSC, Swiftpro, Magicard, Epson, HID, Bartender, Unitech (logos ya en `/public/logos`)
9. **Newsletter** — integrado en Footer (como Wonder) en vez de sección separada

---

## 6. ProductCard premium

`components/ProductCard.jsx` rediseñado:

- Container fluido (quitar `max-w-[200px]`)
- Imagen aspect-square, hover: **swap a segunda imagen** si existe (`product.image[1]`) + scale suave
- Badges absolutos: Oferta (% calc), Agotado, Nuevo
- Categoría/subcategoría uppercase muted arriba del nombre
- Nombre en font-medium (no serif en grid para legibilidad)
- Precio con `Price.jsx` (tachado + % off)
- **Quick Add** en hover (bottom overlay): botón "Añadir" que llama `addToCart` sin salir del grid
- Quitar: rating falso, corazón decorativo, `ScrollToTopFloat` por card, "Comprar ahora" muerto

---

## 7. Página de Producto (PDP)

`app/(shop)/product/[id]/page.jsx` rediseñado:

- **Breadcrumbs**: Inicio / Categoría madre / Subcategoría / Producto
- **Galería**: imagen principal grande + thumbnails verticales (móvil: horizontal)
- **Info column**: categoría uppercase, nombre serif, precio `Price`, badge stock real (`product.stock > 0`), cantidad selector, botones "Añadir al carrito" (primary) + "Comprar ahora" (secondary)
- **Trust icons row**: Envío, Garantía, Soporte (estilo Wonder)
- **Accordions**: Descripción, Especificaciones, Envío y devoluciones
- **Video** si `product.video` existe
- **Related products**: "También te puede interesar" — filtrar por misma categoría madre o sub, max 4-8

---

## 8. Catálogo / All Products

`app/(shop)/all-products/page.jsx`:

- Header editorial: título serif + contador de productos + breadcrumbs
- **URL params**: `?category=codigo-de-barras` o `?category=codigo-de-barras/impresoras-etiquetas` para drill-down
- **Sidebar filtros** (desktop) / bottom sheet (mobile):
  - Árbol de categorías (4 madres expandibles con sus subcategorías) desde `lib/categories.js`
  - Rango de precio
  - Búsqueda
- **Sort dropdown**: Recomendados, Precio ↑↓, Más recientes
- Grid responsivo 2/3/4 cols con ProductCards
- "Cargar más" (load more) en vez de paginación

---

## 9. Carrito y Checkout

- **Carrito**: layout más limpio (imagen, nombre, precio, qty stepper moderno, remove), OrderSummary redesignado con tokens, empty state elegante con CTA
- **OrderSummary**: fondo `brand-sand`, inputs estilo Wonder (bottom border o soft fill), botón full-width primary
- **Order-placed**: confirmación elegante (checkmark animado, mensaje, auto-redirect)

---

## 10. Footer

`components/Footer.jsx` rediseñado 4 columnas (estilo Wonder):

1. Logo + blurb COMPEL + redes
2. **Categorías** — las 4 madres con sus subcategorías como links
3. Empresa / Soporte (About, Contacto, FAQ, Privacidad PDF)
4. Newsletter (input + checkbox) + payment icons (placeholders)

Bottom bar: copyright + mención Ecuador

---

## 11. Páginas secundarias

- **Acerca** (`Acerca/page.jsx`): layout editorial, hero imagen, misión/visión en cards, stats
- **Contactos**: cards de contacto, mapa, formulario simple (o mantener estructura actual con nuevo estilo)
- **Productos (landing RFID)**: reestilizar o eliminar/redirigir a `/all-products?category=rfid`

---

## 12. Modelo de datos — ajustes para categorías

### Product actual
```js
{ name, description, price, offerPrice, stock, image[], category, video, userId, date }
```

### Cambio recomendado
```js
{ 
  name, description, price, offerPrice, stock, image[], 
  category,        // categoría madre: 'codigo-de-barras' | 'computo-movil' | 'rfid' | 'identificacion-pvc'
  subcategory,     // subcategoría: 'impresoras-etiquetas' | 'lectores' | etc.
  video, userId, date 
}
```

### Impacto
- `app/seller/page.jsx` y `app/seller/edit-product/[id]/page.jsx`: select jerárquico (madre → sub)
- `app/api/product/add/route.js` y `update`: guardar ambos campos
- Filtros del catálogo y mega menu: usar `lib/categories.js`
- Productos existentes: script de migración o mapeo temporal desde el string actual de `category`

---

## 13. Fixes incluidos en el plan

- Quitar `ScrollToTopFloat` de dentro de ProductCard (solo 1 global en layout)
- Eliminar WhatsApp duplicado en FeaturedProduct
- Conectar FeaturedProduct y Shop by Department a `lib/categories.js` en vez de hardcoded disabled
- HeaderSlider/hero botones con `onClick` reales
- NewsLetter: mover a footer, handler de submit con toast
- Quitar `--background`/`--foreground` dangling o definirlos
- Seller: select de categorías jerárquico + refrescar colores a tokens

---

## 14. Orden de implementación

| # | Tarea | Archivos principales |
|---|-------|---------------------|
| 1 | Design tokens + fonts + Button/Badge/SectionHeading | `tailwind.config.mjs`, `globals.css`, `layout.js`, `components/ui/*` |
| 2 | `lib/categories.js` con el árbol real de COMPEL | `lib/categories.js` |
| 3 | Ajuste de modelo Product (category + subcategory) + form seller | `models/Product.js`, seller pages, API |
| 4 | Route group `(shop)` + mover páginas | `app/(shop)/…` |
| 5 | Navbar + mega menu + cart drawer | `Navbar.jsx`, `CartDrawer.jsx` |
| 6 | ProductCard + Price + Badge | `ProductCard.jsx` |
| 7 | Homepage completa | `page.jsx`, nuevos `components/home/*` |
| 8 | PDP | `product/[id]/page.jsx` |
| 9 | Catálogo con filtros jerárquicos | `all-products/page.jsx` |
| 10 | Carrito + OrderSummary + order-placed | `cart/`, `OrderSummary.jsx` |
| 11 | Footer + Newsletter | `Footer.jsx` |
| 12 | Acerca / Contactos / landing RFID | páginas secundarias |
| 13 | Limpieza (duplicates, dead buttons) + build | múltiples |

---

## 15. Assets e imágenes

- **No copiar imágenes del tema Wonder** (son de demo Shopify). Usar:
  - Fotos actuales de productos COMPEL (Cloudinary)
  - Placeholders con gradientes `brand-sand` + icono para heroes/categorías si faltan fotos
  - Logo actual de COMPEL
  - Logos de marcas en `/public/logos` para el marquee
- Iconos: lucide-react (ya instalado) para benefits, trust, UI

---

## 16. Lo que NO se incluye en esta fase

- Shoppable image hotspots, quiz, bundles, wishlist, compare products
- Pasarela de pago real (se mantiene COD + confirmación manual)
- Backend de newsletter (solo UI + toast)
- Rediseño profundo del panel seller (solo tokens de color + select categorías)
- Migración masiva de datos existentes (se deja script opcional)

---

## Resumen de categorías (referencia rápida)

```
COMPEL
├── Código de Barras
│   ├── Impresoras de etiquetas
│   ├── Impresoras de brazaletes
│   ├── Impresoras de punto de venta
│   ├── Lectores
│   └── Suministros (etiquetas)
├── Computo Móvil
│   ├── Computadores de mano
│   ├── Tabletas
│   └── Lectores
├── RFID
│   ├── Antenas
│   ├── Impresoras
│   ├── Tags
│   └── Portales
└── Identificación PVC
    ├── Impresoras
    ├── Suministros
    ├── Accesorios
    └── Tarjetas con Chip
```
