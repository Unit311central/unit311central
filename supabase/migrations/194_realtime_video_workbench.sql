-- Real-Time Video & AI Engineering Workbench expansion (internal Unit311).

alter table public.realtime_video_scenarios
  add column if not exists scenario_kind text not null default 'pipeline'
    check (scenario_kind in ('pipeline', 'flight')),
  add column if not exists parent_scenario_id uuid references public.realtime_video_scenarios (id) on delete set null,
  add column if not exists pipeline_scenario_id uuid references public.realtime_video_scenarios (id) on delete set null,
  add column if not exists workbench_config jsonb not null default '{}'::jsonb;

create index if not exists realtime_video_scenarios_kind_idx
  on public.realtime_video_scenarios (workspace_id, scenario_kind, updated_at desc);

create index if not exists realtime_video_scenarios_parent_idx
  on public.realtime_video_scenarios (parent_scenario_id);

-- Assumptions / reference data register (workspace-scoped).
create table if not exists public.realtime_video_assumptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  scenario_id uuid references public.realtime_video_scenarios (id) on delete cascade,
  parameter text not null,
  value text not null default '',
  unit text not null default '',
  source text not null default '',
  source_url text,
  source_date text not null default '',
  status text not null default 'TBD'
    check (status in (
      'Verified Specification',
      'Reference Assumption',
      'Calculated',
      'Measured',
      'User Input',
      'TBD'
    )),
  confidence text not null default 'Unknown'
    check (confidence in ('High', 'Medium', 'Low', 'Unknown')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists realtime_video_assumptions_workspace_idx
  on public.realtime_video_assumptions (workspace_id, updated_at desc);

create index if not exists realtime_video_assumptions_scenario_idx
  on public.realtime_video_assumptions (scenario_id);

-- Reusable mission processing profiles (workspace-scoped).
create table if not exists public.realtime_video_mission_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists realtime_video_mission_profiles_workspace_idx
  on public.realtime_video_mission_profiles (workspace_id, name asc);

-- Expand test runs for measured telemetry.
alter table public.realtime_video_test_runs
  add column if not exists run_config jsonb not null default '{}'::jsonb,
  add column if not exists results jsonb not null default '{}'::jsonb;

alter table public.realtime_video_assumptions enable row level security;
alter table public.realtime_video_mission_profiles enable row level security;

drop policy if exists "realtime_video_assumptions_all" on public.realtime_video_assumptions;
create policy "realtime_video_assumptions_all" on public.realtime_video_assumptions
  for all using (true) with check (true);

drop policy if exists "realtime_video_mission_profiles_all" on public.realtime_video_mission_profiles;
create policy "realtime_video_mission_profiles_all" on public.realtime_video_mission_profiles
  for all using (true) with check (true);
