alter table public.products
  add column catalog_pdf text not null default '',
  add column specifications jsonb not null default '[]'::jsonb,
  add column model_3d_url text not null default '' check (char_length(model_3d_url) <= 500),
  add column printer_type text not null default ''
    check (printer_type in ('', 'portatil', 'escritorio', 'industrial'));

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf'
]
where id = 'product-media';
