-- Fase 2 del asistente: conversaciones, leads, feedback y analítica.
-- Ejecutar en Supabase antes de usar el formulario de asesoría, el feedback
-- o la bandeja /seller/chat.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique check (session_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  user_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  message_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '90 days')
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  products jsonb not null default '[]'::jsonb check (jsonb_typeof(products) = 'array'),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text check (session_id is null or session_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  name text not null check (char_length(name) between 1 and 80),
  company text check (company is null or char_length(company) <= 100),
  email text check (email is null or char_length(email) <= 160),
  phone text check (phone is null or char_length(phone) <= 40),
  interest text check (interest is null or char_length(interest) <= 200),
  volume text check (volume is null or char_length(volume) <= 100),
  message text check (message is null or char_length(message) <= 1000),
  consent boolean not null default false check (consent = true),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text check (session_id is null or session_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  rating text not null check (rating in ('up', 'down')),
  comment text check (comment is null or char_length(comment) <= 500),
  message_excerpt text check (message_excerpt is null or char_length(message_excerpt) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text check (session_id is null or session_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  event_type text not null check (
    event_type in (
      'chat_open',
      'chat_close',
      'message_sent',
      'product_impression',
      'product_click',
      'add_to_cart',
      'handoff',
      'lead_submitted',
      'feedback_submitted',
      'chat_error'
    )
  ),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_idx on public.chat_conversations (user_id);
create index if not exists chat_conversations_last_message_idx on public.chat_conversations (last_message_at desc);
create index if not exists chat_messages_conversation_idx on public.chat_messages (conversation_id, created_at);
create index if not exists chat_leads_created_idx on public.chat_leads (created_at desc);
create index if not exists chat_leads_status_idx on public.chat_leads (status);
create index if not exists chat_feedback_created_idx on public.chat_feedback (created_at desc);
create index if not exists chat_events_type_idx on public.chat_events (event_type, created_at desc);
create index if not exists chat_events_session_idx on public.chat_events (session_id);

-- Conversaciones, eventos y feedback tienen una retención máxima de 90 días.
create or replace function public.purge_expired_chat_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.chat_conversations where expires_at <= now();
  delete from public.chat_events where created_at < now() - interval '90 days';
  delete from public.chat_feedback where created_at < now() - interval '90 days';
end;
$$;

revoke all on function public.purge_expired_chat_data() from public, anon, authenticated;

do $$
declare
  v_job_id bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute 'select jobid from cron.job where jobname = $1 order by jobid desc limit 1'
      into v_job_id
      using 'purge-expired-chat-data';

    if v_job_id is not null then
      perform cron.unschedule(v_job_id);
    end if;

    perform cron.schedule(
      'purge-expired-chat-data',
      '17 3 * * *',
      'select public.purge_expired_chat_data()'
    );
  else
    raise notice 'Enable pg_cron to schedule automatic cleanup of expired chat data.';
  end if;
end;
$$;

-- Escritura de conversaciones mediante RPC: evita exponer inserts directos
-- y permite que usuarios invitados guarden su sesión con una clave aleatoria.
create or replace function public.chat_append_message(
  p_session_id text,
  p_user_id uuid,
  p_role text,
  p_content text,
  p_products jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_message_id uuid;
  v_owner uuid;
begin
  if p_session_id is null or p_session_id !~ '^[A-Za-z0-9_-]{8,64}$' then
    raise exception 'Invalid session id';
  end if;
  if p_role not in ('user', 'assistant') then
    raise exception 'Invalid role';
  end if;
  if p_content is null or char_length(btrim(p_content)) = 0 or char_length(p_content) > 4000 then
    raise exception 'Invalid content';
  end if;
  if p_products is null or jsonb_typeof(p_products) <> 'array' then
    raise exception 'Invalid products';
  end if;
  if jsonb_array_length(p_products) > 8 then
    raise exception 'Too many products';
  end if;
  if p_user_id is not null and (auth.uid() is null or p_user_id <> auth.uid()) then
    raise exception 'Invalid user';
  end if;

  select user_id into v_owner
    from public.chat_conversations
    where session_id = p_session_id;

  if found and v_owner is not null and v_owner is distinct from p_user_id then
    raise exception 'Session belongs to another user';
  end if;

  insert into public.chat_conversations (session_id, user_id)
  values (p_session_id, p_user_id)
  on conflict (session_id) do update
    set user_id = coalesce(public.chat_conversations.user_id, excluded.user_id),
        last_message_at = now(),
        expires_at = now() + interval '90 days'
  returning id into v_conversation_id;

  insert into public.chat_messages (conversation_id, role, content, products)
  values (v_conversation_id, p_role, btrim(p_content), p_products)
  returning id into v_message_id;

  update public.chat_conversations
    set message_count = message_count + 1,
        last_message_at = now()
    where id = v_conversation_id;

  return v_message_id;
end;
$$;

revoke all on function public.chat_append_message(text, uuid, text, text, jsonb) from public;
grant execute on function public.chat_append_message(text, uuid, text, text, jsonb) to anon, authenticated;

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_leads enable row level security;
alter table public.chat_feedback enable row level security;
alter table public.chat_events enable row level security;

drop policy if exists "Owners and sellers can read chat conversations" on public.chat_conversations;
create policy "Owners and sellers can read chat conversations"
  on public.chat_conversations for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'seller'
    )
  );

drop policy if exists "Owners and sellers can read chat messages" on public.chat_messages;
create policy "Owners and sellers can read chat messages"
  on public.chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.chat_conversations c
      where c.id = chat_messages.conversation_id
        and (
          c.user_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'seller'
          )
        )
    )
  );

drop policy if exists "Anyone can submit a lead" on public.chat_leads;
create policy "Anyone can submit a lead"
  on public.chat_leads for insert to anon, authenticated
  with check (
    consent = true
    and (email is not null or phone is not null)
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Sellers can read leads" on public.chat_leads;
create policy "Sellers can read leads"
  on public.chat_leads for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'seller'
    )
  );

drop policy if exists "Sellers can update leads" on public.chat_leads;
create policy "Sellers can update leads"
  on public.chat_leads for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'seller'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'seller'
    )
  );

drop policy if exists "Anyone can submit feedback" on public.chat_feedback;
create policy "Anyone can submit feedback"
  on public.chat_feedback for insert to anon, authenticated
  with check (
    rating in ('up', 'down')
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Sellers can read feedback" on public.chat_feedback;
create policy "Sellers can read feedback"
  on public.chat_feedback for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'seller'
    )
  );

drop policy if exists "Anyone can record chat events" on public.chat_events;
create policy "Anyone can record chat events"
  on public.chat_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "Sellers can read chat events" on public.chat_events;
create policy "Sellers can read chat events"
  on public.chat_events for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'seller'
    )
  );

grant insert on public.chat_leads, public.chat_feedback, public.chat_events to anon, authenticated;
grant select on public.chat_conversations, public.chat_messages, public.chat_leads,
  public.chat_feedback, public.chat_events to authenticated;
grant update on public.chat_leads to authenticated;

create or replace function public.chat_event_counts()
returns table(event_type text, event_count bigint)
language sql
stable
set search_path = public
as $$
  select events.event_type, count(*) as event_count
  from public.chat_events events
  where events.event_type in (
    'message_sent',
    'product_impression',
    'product_click',
    'add_to_cart',
    'handoff',
    'lead_submitted'
  )
    and events.created_at >= now() - interval '90 days'
  group by events.event_type;
$$;

revoke all on function public.chat_event_counts() from public, anon;
grant execute on function public.chat_event_counts() to authenticated;
