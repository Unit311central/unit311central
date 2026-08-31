-- SAEC Discovery questionnaire drafts (working state, one active draft per user per workspace).
-- RLS enabled with no open policies — service-role server access only.

create table if not exists public.saec_discovery_drafts (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  platform_user_id text not null,
  owner_email text null,
  responses jsonb not null default '{}'::jsonb,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saec_discovery_drafts_workspace_user_unique unique (workspace_id, platform_user_id)
);

create index if not exists saec_discovery_drafts_workspace_last_saved_idx
  on public.saec_discovery_drafts (workspace_id, last_saved_at desc);

alter table public.saec_discovery_drafts enable row level security;

drop policy if exists "saec_discovery_drafts_all" on public.saec_discovery_drafts;
-- Intentionally no open policies: service-role server access only.
