-- WOLF Real-Time Video & AI Pipeline engineering model (internal Unit311 analytics).

create table if not exists public.realtime_video_scenarios (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  is_default boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  sync_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists realtime_video_scenarios_workspace_idx
  on public.realtime_video_scenarios (workspace_id, updated_at desc);

create table if not exists public.realtime_video_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  scenario_id uuid not null references public.realtime_video_scenarios (id) on delete cascade,
  stage_order integer not null,
  enabled boolean not null default true,
  pipeline_section text not null,
  component text not null,
  what_happens text not null default '',
  detailed_description text not null default '',
  processing_ms numeric,
  transmission_ms numeric,
  buffer_ms numeric,
  queue_ms numeric,
  ai_inference_ms numeric,
  processing_min_ms numeric,
  processing_typical_ms numeric,
  processing_max_ms numeric,
  measurement_status text not null default 'TBD'
    check (measurement_status in (
      'Measured',
      'Manufacturer Specification',
      'Calculated',
      'Engineering Estimate',
      'Assumed',
      'TBD'
    )),
  source text not null default '',
  source_url text,
  source_type text not null default ''
    check (source_type in (
      '',
      'Manufacturer',
      'Cloud Provider',
      'Protocol Specification',
      'Measured',
      'Calculated',
      'Engineering Estimate',
      'Internal Test'
    )),
  confidence text not null default 'Unknown'
    check (confidence in ('High', 'Medium', 'Low', 'Unknown')),
  parallel boolean not null default false,
  branch_group text,
  path_kind text check (path_kind in ('shared', 'video', 'ai', 'overlay', 'control', 'metadata')),
  milestone text check (milestone in (
    'capture',
    'raw_video_visible',
    'ai_detection',
    'ai_identification',
    'ai_annotated',
    'operator_visible'
  )),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_id, stage_order)
);

create index if not exists realtime_video_pipeline_stages_scenario_idx
  on public.realtime_video_pipeline_stages (scenario_id, stage_order asc);

create index if not exists realtime_video_pipeline_stages_workspace_idx
  on public.realtime_video_pipeline_stages (workspace_id);

-- Future test runs / measured telemetry (structure only for now).
create table if not exists public.realtime_video_test_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  scenario_id uuid not null references public.realtime_video_scenarios (id) on delete cascade,
  label text not null,
  status text not null default 'draft'
    check (status in ('draft', 'running', 'completed', 'failed')),
  notes text not null default '',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists realtime_video_test_runs_scenario_idx
  on public.realtime_video_test_runs (scenario_id, created_at desc);

create table if not exists public.realtime_video_measurements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  test_run_id uuid not null references public.realtime_video_test_runs (id) on delete cascade,
  stage_id uuid references public.realtime_video_pipeline_stages (id) on delete set null,
  measured_processing_ms numeric,
  measured_transmission_ms numeric,
  measured_buffer_ms numeric,
  measured_queue_ms numeric,
  measured_ai_inference_ms numeric,
  timestamps jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists realtime_video_measurements_run_idx
  on public.realtime_video_measurements (test_run_id);

alter table public.realtime_video_scenarios enable row level security;
alter table public.realtime_video_pipeline_stages enable row level security;
alter table public.realtime_video_test_runs enable row level security;
alter table public.realtime_video_measurements enable row level security;

drop policy if exists "realtime_video_scenarios_all" on public.realtime_video_scenarios;
create policy "realtime_video_scenarios_all" on public.realtime_video_scenarios
  for all using (true) with check (true);

drop policy if exists "realtime_video_pipeline_stages_all" on public.realtime_video_pipeline_stages;
create policy "realtime_video_pipeline_stages_all" on public.realtime_video_pipeline_stages
  for all using (true) with check (true);

drop policy if exists "realtime_video_test_runs_all" on public.realtime_video_test_runs;
create policy "realtime_video_test_runs_all" on public.realtime_video_test_runs
  for all using (true) with check (true);

drop policy if exists "realtime_video_measurements_all" on public.realtime_video_measurements;
create policy "realtime_video_measurements_all" on public.realtime_video_measurements
  for all using (true) with check (true);
