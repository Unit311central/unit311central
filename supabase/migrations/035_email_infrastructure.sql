-- Zoho mailbox credentials + WhatsApp notification tables for live email

create table if not exists public.email_mailbox_credentials (
  account_id text primary key check (account_id in ('info', 'paul')),
  email text not null,
  password text not null,
  updated_at timestamptz not null default now()
);

alter table public.email_mailbox_credentials enable row level security;

drop policy if exists "email_mailbox_credentials_all" on public.email_mailbox_credentials;
create policy "email_mailbox_credentials_all" on public.email_mailbox_credentials
  for all using (true) with check (true);

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
values ('info', true, '34657106176')
on conflict (account_id) do nothing;
