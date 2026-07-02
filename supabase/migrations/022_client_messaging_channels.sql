-- Shared internal + external client messaging channels

alter table public.internal_message_channels
  add column if not exists channel_type text not null default 'internal',
  add column if not exists client_key text,
  add column if not exists member_client_usernames text[] not null default '{}';

alter table public.internal_message_channels
  drop constraint if exists internal_message_channels_channel_type_check;

alter table public.internal_message_channels
  add constraint internal_message_channels_channel_type_check
  check (channel_type in ('internal', 'client'));

create table if not exists public.internal_message_read_state (
  viewer_key text not null,
  room text not null,
  last_read_at timestamptz not null default now(),
  primary key (viewer_key, room)
);

alter table public.internal_message_read_state enable row level security;

create policy "internal_message_read_state_all" on public.internal_message_read_state
  for all using (true) with check (true);

create index if not exists internal_message_read_state_viewer_idx
  on public.internal_message_read_state (viewer_key);
