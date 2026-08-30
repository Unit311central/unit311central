-- SAEC Discovery questionnaire submissions (Current Systems)
-- One submitted record per SAEC workspace; upserted on final submit.
-- RLS enabled with no open policies — service-role server access only.

create table if not exists public.saec_discovery_submissions (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  status text not null default 'submitted' check (status = 'submitted'),
  responses jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  submitted_by_email text null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saec_discovery_submissions_workspace_unique unique (workspace_id)
);

create index if not exists saec_discovery_submissions_submitted_at_idx
  on public.saec_discovery_submissions (submitted_at desc);

alter table public.saec_discovery_submissions enable row level security;

drop policy if exists "saec_discovery_submissions_all" on public.saec_discovery_submissions;
-- Intentionally no open policies: service-role server access only.
