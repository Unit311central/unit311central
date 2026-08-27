-- WOLF Central estate registry (additive; WOLF Central workspace only).

create table if not exists public.wolf_reserves (
  id text primary key,
  central_workspace_id uuid not null,
  slug text not null,
  name text not null,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_demo boolean not null default true,
  deployment_status text not null default 'Demo deployment',
  large_drone_count integer not null default 0,
  small_drone_count integer not null default 0,
  dock_count integer not null default 0,
  fleet_operational integer not null default 0,
  fleet_total integer not null default 0,
  animals_summary jsonb not null default '{}'::jsonb,
  containment_summary jsonb not null default '{}'::jsonb,
  environment_summary jsonb not null default '{}'::jsonb,
  drone_operations_summary jsonb not null default '{}'::jsonb,
  attention_status text not null default 'normal' check (attention_status in ('normal', 'attention')),
  future_workspace_slug text,
  has_customer_workspace boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (central_workspace_id, slug)
);

create index if not exists wolf_reserves_central_workspace_idx
  on public.wolf_reserves (central_workspace_id);

create table if not exists public.wolf_estate_alerts (
  id text primary key,
  central_workspace_id uuid not null,
  reserve_id text not null references public.wolf_reserves (id) on delete cascade,
  reserve_name text not null,
  title text not null,
  detail text not null default '',
  severity text not null default 'attention' check (severity in ('normal', 'attention')),
  created_at timestamptz not null default now()
);

create index if not exists wolf_estate_alerts_central_workspace_idx
  on public.wolf_estate_alerts (central_workspace_id, created_at desc);

alter table public.wolf_reserves enable row level security;
alter table public.wolf_estate_alerts enable row level security;

drop policy if exists "wolf_reserves_deny_all" on public.wolf_reserves;
create policy "wolf_reserves_deny_all" on public.wolf_reserves
  for all using (false) with check (false);

drop policy if exists "wolf_estate_alerts_deny_all" on public.wolf_estate_alerts;
create policy "wolf_estate_alerts_deny_all" on public.wolf_estate_alerts
  for all using (false) with check (false);

comment on table public.wolf_reserves is
  'WOLF Central estate deployment registry — summary records for demo and future customer reserves.';
comment on table public.wolf_estate_alerts is
  'WOLF Watch operational intelligence alerts for WOLF Central estate view.';
