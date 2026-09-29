-- Optional board meeting invitation / join URL (Talanton Board Meetings).

alter table public.workspace_governance_meetings
  add column if not exists meeting_invite_url text not null default '';
