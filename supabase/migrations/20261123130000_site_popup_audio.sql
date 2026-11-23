-- Música de fondo opcional para la ventana emergente.
-- La pista se guarda en storage "product-media" bajo /popup-audio y es un MP3
-- de máximo 3 minutos. El volumen va de 0 (silencioso) a 100.

alter table public.site_popup
  add column if not exists audio_url text not null default '',
  add column if not exists audio_enabled boolean not null default false,
  add column if not exists audio_volume integer not null default 50;

alter table public.site_popup
  drop constraint if exists site_popup_audio_volume_range;

alter table public.site_popup
  add constraint site_popup_audio_volume_range check (audio_volume between 0 and 100);
