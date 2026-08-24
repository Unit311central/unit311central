-- Central Technology Management — telecommunications register (workspace-scoped).

create table if not exists public.technology_telecom_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  service text not null,
  carrier text not null,
  number_or_circuit text not null default '',
  assigned_to text not null default '',
  location text,
  monthly_cost_minor integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'Active',
  manufacturer text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technology_telecom_services_workspace_idx
  on public.technology_telecom_services (workspace_id, updated_at desc);

alter table public.technology_telecom_services enable row level security;

drop policy if exists "technology_telecom_services_all" on public.technology_telecom_services;
create policy "technology_telecom_services_all" on public.technology_telecom_services
  for all using (true) with check (true);
