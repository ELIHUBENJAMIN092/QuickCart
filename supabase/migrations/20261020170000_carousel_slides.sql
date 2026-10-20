create table public.carousel_slides (
  position smallint primary key check (position between 1 and 4),
  category text not null,
  eyebrow text not null default '' check (char_length(eyebrow) <= 80),
  title text not null default '' check (char_length(title) <= 140),
  description text not null default '' check (char_length(description) <= 300),
  primary_label text not null default '' check (char_length(primary_label) <= 40),
  secondary_label text not null default '' check (char_length(secondary_label) <= 40),
  image_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.carousel_slides enable row level security;

revoke all on public.carousel_slides from public, anon, authenticated;
grant select on public.carousel_slides to anon, authenticated;
grant insert, update on public.carousel_slides to authenticated;

create policy "Carousel is public"
on public.carousel_slides for select to anon, authenticated
using (true);

create policy "Sellers insert carousel"
on public.carousel_slides for insert to authenticated
with check ((select public.is_seller()));

create policy "Sellers update carousel"
on public.carousel_slides for update to authenticated
using ((select public.is_seller()))
with check ((select public.is_seller()));

-- Una diapositiva por categoría madre, en este orden.
insert into public.carousel_slides
  (position, category, eyebrow, title, description, primary_label, secondary_label)
values
  (1, 'codigo-de-barras', 'Impresión profesional', 'Cada etiqueta, una operación más eficiente.',
   'Impresoras y suministros confiables para acompañar el crecimiento de tu empresa.',
   'Ver código de barras', 'Hablar con un asesor'),
  (2, 'computo-movil', 'Movilidad empresarial', 'Datos en la mano de tu equipo.',
   'Computadores de mano y tabletas robustas para trabajo en campo, bodega y retail.',
   'Ver cómputo móvil', 'Hablar con un asesor'),
  (3, 'rfid', 'Identificación inteligente', 'Control y trazabilidad en tiempo real.',
   'Antenas, impresoras y tags RFID pensados para entornos exigentes.',
   'Descubrir RFID', 'Hablar con un asesor'),
  (4, 'identificacion-pvc', 'Credenciales y tarjetas', 'Identidad segura para cada persona.',
   'Impresoras, suministros y tarjetas PVC para credenciales y membresías.',
   'Ver identificación PVC', 'Hablar con un asesor');
