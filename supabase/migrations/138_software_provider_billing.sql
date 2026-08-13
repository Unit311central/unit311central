-- Software provider billing (Vercel first) — workspace-scoped cost snapshots.

alter table public.software_assets
  add column if not exists provider_slug text;

create index if not exists software_assets_workspace_provider_slug_idx
  on public.software_assets (workspace_id, provider_slug)
  where provider_slug is not null and provider_slug <> '';

create table if not exists public.software_provider_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  provider_slug text not null,
  software_asset_id uuid references public.software_assets (id) on delete set null,
  external_team_id text not null default '',
  external_team_slug text not null default '',
  currency text not null default 'USD',
  is_enabled boolean not null default true,
  last_successful_sync_at timestamptz,
  last_sync_status text not null default 'never',
  last_sync_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint software_provider_connections_workspace_provider_key
    unique (workspace_id, provider_slug)
);

create index if not exists software_provider_connections_workspace_idx
  on public.software_provider_connections (workspace_id);

create table if not exists public.software_provider_sync_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  provider_slug text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'failed')),
  records_fetched integer not null default 0,
  error_message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists software_provider_sync_runs_workspace_provider_idx
  on public.software_provider_sync_runs (workspace_id, provider_slug, started_at desc);

create table if not exists public.software_provider_period_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  provider_slug text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  period_kind text not null
    check (period_kind in ('completed', 'in_progress')),
  currency text not null default 'USD',
  base_subscription_amount numeric(14, 4) not null default 0,
  usage_effective_amount numeric(14, 4) not null default 0,
  usage_billed_amount numeric(14, 4) not null default 0,
  credits_applied_amount numeric(14, 4) not null default 0,
  additional_purchases_amount numeric(14, 4) not null default 0,
  tax_amount numeric(14, 4) not null default 0,
  adjustments_amount numeric(14, 4) not null default 0,
  billed_amount numeric(14, 4) not null default 0,
  projected_amount numeric(14, 4),
  charge_line_count integer not null default 0,
  plan_name text not null default '',
  plan_iteration text not null default '',
  seat_count integer,
  raw_summary jsonb not null default '{}'::jsonb,
  source text not null default 'vercel_api',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint software_provider_period_snapshots_period_key
    unique (workspace_id, provider_slug, period_start, period_kind)
);

create index if not exists software_provider_period_snapshots_workspace_provider_idx
  on public.software_provider_period_snapshots (workspace_id, provider_slug, period_start desc);

create table if not exists public.software_provider_charge_facts (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null
    references public.software_provider_period_snapshots (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  provider_slug text not null,
  charge_date date not null,
  service_name text not null default '',
  charge_category text not null default '',
  effective_cost numeric(14, 4) not null default 0,
  billed_cost numeric(14, 4) not null default 0,
  pricing_quantity numeric(14, 4),
  tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint software_provider_charge_facts_daily_key
    unique (snapshot_id, charge_date, service_name, charge_category)
);

create index if not exists software_provider_charge_facts_snapshot_idx
  on public.software_provider_charge_facts (snapshot_id, charge_date);

alter table public.software_provider_connections enable row level security;
alter table public.software_provider_sync_runs enable row level security;
alter table public.software_provider_period_snapshots enable row level security;
alter table public.software_provider_charge_facts enable row level security;

drop policy if exists "software_provider_connections_all" on public.software_provider_connections;
create policy "software_provider_connections_all" on public.software_provider_connections
  for all using (true) with check (true);

drop policy if exists "software_provider_sync_runs_all" on public.software_provider_sync_runs;
create policy "software_provider_sync_runs_all" on public.software_provider_sync_runs
  for all using (true) with check (true);

drop policy if exists "software_provider_period_snapshots_all" on public.software_provider_period_snapshots;
create policy "software_provider_period_snapshots_all" on public.software_provider_period_snapshots
  for all using (true) with check (true);

drop policy if exists "software_provider_charge_facts_all" on public.software_provider_charge_facts;
create policy "software_provider_charge_facts_all" on public.software_provider_charge_facts
  for all using (true) with check (true);

comment on table public.software_provider_period_snapshots is
  'Immutable completed monthly/billing-period actuals; in_progress rows hold projections only.';
