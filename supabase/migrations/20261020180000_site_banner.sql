create table public.site_banner (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default true,
  message text not null default '' check (char_length(message) <= 160),
  message_url text not null default '' check (char_length(message_url) <= 300),
  left_label text not null default '' check (char_length(left_label) <= 40),
  left_url text not null default '' check (char_length(left_url) <= 300),
  right_label text not null default '' check (char_length(right_label) <= 40),
  right_url text not null default '' check (char_length(right_url) <= 300),
  bg_color text not null default '#0b1b2b' check (bg_color ~ '^#[0-9a-fA-F]{6}$'),
  text_color text not null default '#ffffff' check (text_color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now()
);

alter table public.site_banner enable row level security;

revoke all on public.site_banner from public, anon, authenticated;
grant select on public.site_banner to anon, authenticated;
grant insert, update on public.site_banner to authenticated;

create policy "Banner is public"
on public.site_banner for select to anon, authenticated
using (true);

create policy "Sellers insert banner"
on public.site_banner for insert to authenticated
with check ((select public.is_seller()));

create policy "Sellers update banner"
on public.site_banner for update to authenticated
using ((select public.is_seller()))
with check ((select public.is_seller()));

insert into public.site_banner (id, message, left_label, left_url, right_label, right_url)
values (1, 'Envíos a todo el Ecuador · Soporte especializado B2B',
  '¿Necesitas ayuda?', '/Contactos', 'Contáctanos', '/Contactos');

notify pgrst, 'reload schema';
