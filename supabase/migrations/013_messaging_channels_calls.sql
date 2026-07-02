-- Messaging channels, attachments, and scheduled calls
-- Run in Supabase SQL Editor or via scripts/seed-messaging.mjs

alter table public.internal_messages
  add column if not exists message_type text not null default 'text',
  add column if not exists attachment_name text,
  add column if not exists attachment_url text,
  add column if not exists attachment_mime text,
  add column if not exists call_link text;

create table if not exists public.internal_message_channels (
  id uuid primary key default gen_random_uuid(),
  room text not null unique,
  name text not null,
  created_by_operator_id text not null,
  created_by_operator_name text not null,
  member_operator_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists internal_message_channels_created_idx
  on public.internal_message_channels (created_at desc);

alter table public.internal_message_channels enable row level security;

create policy "internal_message_channels_all" on public.internal_message_channels
  for all using (true) with check (true);

alter table public.internal_message_channels replica identity full;

create table if not exists public.internal_scheduled_calls (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  title text not null,
  scheduled_at timestamptz not null,
  participant_operator_ids text[] not null default '{}',
  call_link text not null,
  call_type text not null default 'video',
  created_by_operator_id text not null,
  created_by_operator_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists internal_scheduled_calls_room_idx
  on public.internal_scheduled_calls (room, scheduled_at asc);

alter table public.internal_scheduled_calls enable row level security;

create policy "internal_scheduled_calls_all" on public.internal_scheduled_calls
  for all using (true) with check (true);

alter table public.internal_scheduled_calls replica identity full;

insert into public.internal_message_channels (
  room,
  name,
  created_by_operator_id,
  created_by_operator_name,
  member_operator_ids
)
select
  'internal-ops',
  'Internal Operations Room',
  'user-1',
  'Paul Fotheringham',
  array['user-1', 'user-2', 'user-3']
where not exists (
  select 1 from public.internal_message_channels where room = 'internal-ops'
);
