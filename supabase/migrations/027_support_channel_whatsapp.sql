-- Support messaging channel + WhatsApp notification settings

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

drop policy if exists "internal_message_read_state_all" on public.internal_message_read_state;
create policy "internal_message_read_state_all" on public.internal_message_read_state
  for all using (true) with check (true);

create index if not exists internal_message_read_state_viewer_idx
  on public.internal_message_read_state (viewer_key);

create table if not exists public.email_whatsapp_settings (
  account_id text primary key,
  enabled boolean not null default true,
  notify_phone text not null default '34657106176',
  updated_at timestamptz not null default now()
);

create table if not exists public.email_whatsapp_notification_log (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,
  message_uid bigint not null,
  message_id text,
  from_name text not null default '',
  subject text not null default '',
  notified_at timestamptz not null default now(),
  unique (account_id, message_uid)
);

create index if not exists email_whatsapp_notification_log_account_idx
  on public.email_whatsapp_notification_log (account_id, notified_at desc);

alter table public.email_whatsapp_settings enable row level security;
alter table public.email_whatsapp_notification_log enable row level security;

drop policy if exists "email_whatsapp_settings_all" on public.email_whatsapp_settings;
create policy "email_whatsapp_settings_all" on public.email_whatsapp_settings
  for all using (true) with check (true);

drop policy if exists "email_whatsapp_notification_log_all" on public.email_whatsapp_notification_log;
create policy "email_whatsapp_notification_log_all" on public.email_whatsapp_notification_log
  for all using (true) with check (true);

insert into public.email_whatsapp_settings (account_id, enabled, notify_phone)
values
  ('info', true, '34657106176'),
  ('support-tickets', true, '34657106176')
on conflict (account_id) do nothing;

insert into public.internal_message_channels (
  room,
  name,
  channel_type,
  client_key,
  created_by_operator_id,
  created_by_operator_name,
  member_operator_ids,
  member_client_usernames
)
select
  'support-desk',
  'Support',
  'internal',
  null,
  'user-1',
  'Paul Fotheringham',
  array['user-1', 'user-2', 'user-3'],
  '{}'::text[]
where not exists (
  select 1 from public.internal_message_channels where room = 'support-desk'
);

insert into public.internal_messages (
  room,
  operator_id,
  operator_name,
  username,
  content,
  message_type
)
select
  'support-desk',
  'system',
  'BCN Support',
  'system',
  'Support desk channel — WhatsApp tickets and operator claims appear here.',
  'system'
where not exists (
  select 1 from public.internal_messages where room = 'support-desk'
);
