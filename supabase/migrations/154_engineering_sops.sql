-- Engineering SOP management & execution (workspace-scoped central product capability).

create table if not exists public.engineering_sops (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sop_number text not null,
  title text not null,
  version text not null default '1.0',
  status text not null default 'Draft'
    check (status in ('Draft', 'In Review', 'Approved', 'Retired')),
  category text,
  description text not null default '',
  owner_name text not null,
  approver_name text not null,
  audience text not null default 'internal'
    check (audience in ('internal', 'client', 'both')),
  effective_date date,
  review_date date,
  is_template boolean not null default false,
  template_source_id uuid references public.engineering_sops (id) on delete set null,
  supersedes_id uuid references public.engineering_sops (id) on delete set null,
  sections jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  workflow jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.platform_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists engineering_sops_workspace_idx on public.engineering_sops (workspace_id, updated_at desc);
create index if not exists engineering_sops_workspace_status_idx on public.engineering_sops (workspace_id, status);

create table if not exists public.engineering_sop_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sop_id uuid not null references public.engineering_sops (id) on delete restrict,
  sop_version text not null,
  started_by text not null,
  started_by_user_id uuid references public.platform_users (id) on delete set null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'paused', 'completed', 'failed', 'abandoned')),
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  completed_at timestamptz,
  sign_off jsonb,
  last_activity_at timestamptz not null default now()
);

create index if not exists engineering_sop_runs_workspace_idx on public.engineering_sop_runs (workspace_id, started_at desc);

create table if not exists public.engineering_sop_run_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  run_id uuid not null references public.engineering_sop_runs (id) on delete cascade,
  step_id text not null,
  step_order integer not null,
  section_title text not null default '',
  title text not null,
  instructions text not null default '',
  assigned_to text,
  due_at timestamptz,
  required boolean not null default true,
  requires_evidence boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'skipped')),
  outcome text check (outcome in ('pass', 'fail', 'na')),
  notes text not null default '',
  evidence_refs text[] not null default '{}',
  completed_by text,
  completed_at timestamptz,
  comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, step_id)
);

create index if not exists engineering_sop_run_steps_run_idx on public.engineering_sop_run_steps (run_id, step_order);

create table if not exists public.engineering_sop_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sop_id uuid references public.engineering_sops (id) on delete set null,
  run_id uuid references public.engineering_sop_runs (id) on delete set null,
  event_type text not null,
  actor_name text not null,
  actor_user_id uuid references public.platform_users (id) on delete set null,
  comment text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists engineering_sop_events_workspace_idx on public.engineering_sop_events (workspace_id, created_at desc);

alter table public.engineering_sops enable row level security;
alter table public.engineering_sop_runs enable row level security;
alter table public.engineering_sop_run_steps enable row level security;
alter table public.engineering_sop_events enable row level security;

drop policy if exists "engineering_sops_all" on public.engineering_sops;
create policy "engineering_sops_all" on public.engineering_sops for all using (true) with check (true);
drop policy if exists "engineering_sop_runs_all" on public.engineering_sop_runs;
create policy "engineering_sop_runs_all" on public.engineering_sop_runs for all using (true) with check (true);
drop policy if exists "engineering_sop_run_steps_all" on public.engineering_sop_run_steps;
create policy "engineering_sop_run_steps_all" on public.engineering_sop_run_steps for all using (true) with check (true);
drop policy if exists "engineering_sop_events_all" on public.engineering_sop_events;
create policy "engineering_sop_events_all" on public.engineering_sop_events for all using (true) with check (true);
