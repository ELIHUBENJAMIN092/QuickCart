-- Portada editable por categoría: video o solo imagen.
-- Ejecutar en Supabase SQL Editor. Es seguro volver a ejecutarlo.

alter table public.categories
  add column if not exists hero jsonb not null default '{}'::jsonb;

-- Contenido inicial de las portadas existentes.
update public.categories
set
  hero = $json${
    "eyebrow": "Código de barras",
    "title": "Etiquetas, códigos y suministros para operar sin pausas.",
    "description": "Impresión y lectura de códigos de barras para retail, logística e industria, con equipos y suministros para cada volumen de trabajo.",
    "video_url": "/videos/codigo-de-barras.mp4",
    "primary_label": "Solicitar asesoría",
    "primary_url": "/Contactos",
    "secondary_label": "Ver productos",
    "secondary_url": "#productos"
  }$json$::jsonb,
  updated_at = now()
where slug = 'codigo-de-barras'
  and (hero is null or hero = '{}'::jsonb);

update public.categories
set
  hero = $json${
    "eyebrow": "Cómputo móvil",
    "title": "Movilidad profesional para trabajar sin detenerte.",
    "description": "Equipos portátiles y tabletas profesionales para campo, almacén y punto de venta, listos para integrarse con tu operación.",
    "video_url": "/videos/computo-movil.mp4",
    "primary_label": "Solicitar asesoría",
    "primary_url": "/Contactos",
    "secondary_label": "Ver productos",
    "secondary_url": "#productos"
  }$json$::jsonb,
  updated_at = now()
where slug = 'computo-movil'
  and (hero is null or hero = '{}'::jsonb);

update public.categories
set
  hero = $json${
    "eyebrow": "RFID",
    "title": "Visibilidad en tiempo real para tu operación.",
    "description": "Antenas, impresoras, tags y portales RFID para controlar inventario, activos y trazabilidad con tecnología de radiofrecuencia.",
    "video_url": "/videos/rfid.mp4",
    "primary_label": "Solicitar asesoría",
    "primary_url": "/Contactos",
    "secondary_label": "Ver productos",
    "secondary_url": "#productos"
  }$json$::jsonb,
  updated_at = now()
where slug = 'rfid'
  and (hero is null or hero = '{}'::jsonb);

update public.categories
set
  hero = $json${
    "eyebrow": "Identificación PVC",
    "title": "Credenciales que proyectan una imagen profesional.",
    "description": "Impresoras, suministros y tarjetas PVC para credenciales, membresías y control de acceso con acabados de alta calidad.",
    "video_url": "/videos/identificacion-pvc.mp4",
    "primary_label": "Solicitar asesoría",
    "primary_url": "/Contactos",
    "secondary_label": "Ver productos",
    "secondary_url": "#productos"
  }$json$::jsonb,
  updated_at = now()
where slug = 'identificacion-pvc'
  and (hero is null or hero = '{}'::jsonb);

-- Categoría Kioscos y POS.
insert into public.categories (slug, name, description, image_url, subcategories, position, hero)
values (
  'kioscos-y-pos',
  'Kioscos y POS',
  'Estaciones de autoservicio y punto de venta para pedidos, pagos y consulta.',
  '',
  $json$[
    {"name": "Kioscos de autoservicio", "slug": "kioscos-de-autoservicio"},
    {"name": "Terminales punto de venta", "slug": "terminales-punto-de-venta"},
    {"name": "Accesorios", "slug": "accesorios"}
  ]$json$::jsonb,
  5,
  $json${
    "eyebrow": "Kioscos y POS",
    "title": "Autoservicio que simplifica cada interacción.",
    "description": "Estaciones interactivas para pedidos, pagos, check-in y consulta de información. Diseñamos e integramos la solución completa para tu operación.",
    "video_url": "/videos/kiosk-hero.mp4",
    "primary_label": "Solicitar asesoría",
    "primary_url": "/Contactos",
    "secondary_label": "Conoce la solución",
    "secondary_url": "/kioscos-punto-de-venta"
  }$json$::jsonb
)
on conflict (slug) do nothing;

-- Completa la portada de Kioscos si la fila ya existía sin hero.
update public.categories
set
  position = 5,
  hero = case
    when hero is null or hero = '{}'::jsonb then $json${
      "eyebrow": "Kioscos y POS",
      "title": "Autoservicio que simplifica cada interacción.",
      "description": "Estaciones interactivas para pedidos, pagos, check-in y consulta de información. Diseñamos e integramos la solución completa para tu operación.",
      "video_url": "/videos/kiosk-hero.mp4",
      "primary_label": "Solicitar asesoría",
      "primary_url": "/Contactos",
      "secondary_label": "Conoce la solución",
      "secondary_url": "/kioscos-punto-de-venta"
    }$json$::jsonb
    else hero
  end,
  updated_at = now()
where slug = 'kioscos-y-pos';

-- Orden fijo de las categorías principales.
update public.categories set position = 1, updated_at = now() where slug = 'codigo-de-barras';
update public.categories set position = 2, updated_at = now() where slug = 'computo-movil';
update public.categories set position = 3, updated_at = now() where slug = 'rfid';
update public.categories set position = 4, updated_at = now() where slug = 'identificacion-pvc';
update public.categories set position = 5, updated_at = now() where slug = 'kioscos-y-pos';
