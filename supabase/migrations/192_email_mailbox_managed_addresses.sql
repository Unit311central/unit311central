-- Reusable mailbox profiles + managed addresses (primary + aliases) per workspace.

create table if not exists public.email_mailbox_profiles (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id text not null,
  display_name text not null,
  provider text not null default 'zoho' check (provider in ('zoho')),
  imap_host text,
  smtp_host text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, account_id)
);

create table if not exists public.email_mailbox_addresses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id text not null,
  address text not null,
  kind text not null check (kind in ('primary', 'alias')),
  created_at timestamptz not null default now(),
  unique (workspace_id, account_id, address)
);

create unique index if not exists email_mailbox_addresses_one_primary_uidx
  on public.email_mailbox_addresses (workspace_id, account_id)
  where kind = 'primary';

create index if not exists email_mailbox_addresses_workspace_account_idx
  on public.email_mailbox_addresses (workspace_id, account_id);

alter table public.email_mailbox_profiles enable row level security;
alter table public.email_mailbox_addresses enable row level security;

drop policy if exists "email_mailbox_profiles_all" on public.email_mailbox_profiles;
create policy "email_mailbox_profiles_all" on public.email_mailbox_profiles
  for all using (true) with check (true);

drop policy if exists "email_mailbox_addresses_all" on public.email_mailbox_addresses;
create policy "email_mailbox_addresses_all" on public.email_mailbox_addresses
  for all using (true) with check (true);

-- InterfaceWorx: Tom mailbox with info@ alias (credentials entered separately in Email UI).
insert into public.email_mailbox_profiles (workspace_id, account_id, display_name, provider, imap_host, smtp_host)
select w.id, 'tom', 'Tom', 'zoho', 'imap.zoho.com', 'smtp.zoho.com'
from public.workspaces w
where w.slug = 'interfaceworx'
on conflict (workspace_id, account_id) do update
set
  display_name = excluded.display_name,
  provider = excluded.provider,
  imap_host = excluded.imap_host,
  smtp_host = excluded.smtp_host,
  updated_at = now();

insert into public.email_mailbox_addresses (workspace_id, account_id, address, kind)
select w.id, 'tom', 'tom@interfaceworx.com', 'primary'
from public.workspaces w
where w.slug = 'interfaceworx'
on conflict (workspace_id, account_id, address) do nothing;

insert into public.email_mailbox_addresses (workspace_id, account_id, address, kind)
select w.id, 'tom', 'info@interfaceworx.com', 'alias'
from public.workspaces w
where w.slug = 'interfaceworx'
on conflict (workspace_id, account_id, address) do nothing;
