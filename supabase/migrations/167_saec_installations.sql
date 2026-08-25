-- SAEC bespoke Installations operational assets (workspace-scoped; SAEC workspace only).

create table if not exists public.saec_installation_assets (
  id text primary key,
  workspace_id text not null,
  asset_type text not null check (asset_type in ('elevator', 'escalator')),
  asset_code text not null,
  model text not null,
  site_name text not null,
  customer_name text not null default '',
  city_id text not null,
  city_label text not null,
  level_label text not null default 'L1',
  status text not null default 'online',
  maintenance_status text not null default 'ok',
  contract_status text not null default 'active',
  assigned_engineer_id text,
  assigned_engineer_name text,
  engineer_field_status text,
  next_maintenance_date date,
  last_maintenance_date date,
  maintenance_frequency_months integer not null default 3,
  installed_date date not null,
  faults jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, asset_code)
);

create index if not exists saec_installation_assets_workspace_idx
  on public.saec_installation_assets (workspace_id, asset_type);
create index if not exists saec_installation_assets_city_idx
  on public.saec_installation_assets (workspace_id, city_id);
create index if not exists saec_installation_assets_search_idx
  on public.saec_installation_assets (workspace_id, site_name, model, asset_code);

create table if not exists public.saec_installation_maintenance (
  id text primary key,
  workspace_id text not null,
  asset_id text not null references public.saec_installation_assets (id) on delete cascade,
  date date not null,
  engineer_name text not null default '',
  maintenance_type text not null default '',
  result text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists saec_installation_maintenance_workspace_idx
  on public.saec_installation_maintenance (workspace_id, asset_id, date desc);

alter table public.saec_installation_assets enable row level security;
alter table public.saec_installation_maintenance enable row level security;

drop policy if exists "saec_installation_assets_all" on public.saec_installation_assets;
create policy "saec_installation_assets_all" on public.saec_installation_assets
  for all using (true) with check (true);

drop policy if exists "saec_installation_maintenance_all" on public.saec_installation_maintenance;
create policy "saec_installation_maintenance_all" on public.saec_installation_maintenance
  for all using (true) with check (true);
