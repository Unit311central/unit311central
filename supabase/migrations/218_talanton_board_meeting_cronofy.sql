-- Talanton Board Meetings: invite URL, schedule times, Cronofy event metadata.
-- Idempotent with 217_workspace_governance_meeting_invite.sql.

alter table public.workspace_governance_meetings
  add column if not exists meeting_invite_url text not null default '';

alter table public.workspace_governance_meetings
  add column if not exists meeting_start_at timestamptz;

alter table public.workspace_governance_meetings
  add column if not exists meeting_end_at timestamptz;

alter table public.workspace_governance_meetings
  add column if not exists cronofy_calendar_id text not null default '';

alter table public.workspace_governance_meetings
  add column if not exists cronofy_event_id text not null default '';

alter table public.workspace_governance_meetings
  add column if not exists conferencing_provider text not null default '';

alter table public.workspace_governance_meetings
  add column if not exists connected_calendar_provider text not null default '';

-- Per-user Cronofy OAuth (Talanton board meeting scheduling).
create table if not exists public.platform_user_cronofy_accounts (
  platform_user_id uuid not null references public.platform_users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  cronofy_sub text not null default '',
  access_token text not null default '',
  refresh_token text not null default '',
  token_expires_at timestamptz,
  linked_profile_name text not null default '',
  linked_provider_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (platform_user_id, workspace_id)
);

create index if not exists platform_user_cronofy_accounts_workspace_idx
  on public.platform_user_cronofy_accounts (workspace_id);

alter table public.platform_user_cronofy_accounts enable row level security;

drop policy if exists "platform_user_cronofy_accounts_service" on public.platform_user_cronofy_accounts;
create policy "platform_user_cronofy_accounts_service"
  on public.platform_user_cronofy_accounts
  for all
  using (true)
  with check (true);
