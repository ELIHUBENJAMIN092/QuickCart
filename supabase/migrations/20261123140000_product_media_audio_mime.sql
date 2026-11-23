-- Habilita la subida de MP3 al bucket "product-media" (música de fondo de la
-- ventana emergente). El bucket restringe los tipos MIME permitidos; aquí se
-- agregan los de audio MP3 sin tocar los de imagen existentes.

update storage.buckets
set allowed_mime_types = case
  -- Si está en NULL, no hay restricción: se deja igual (ya permite todo).
  when allowed_mime_types is null then allowed_mime_types
  else array_cat(
    allowed_mime_types,
    array['audio/mpeg', 'audio/mp3', 'audio/x-mpeg', 'audio/mpeg3', 'audio/x-mp3']
  )
end
where id = 'product-media';
