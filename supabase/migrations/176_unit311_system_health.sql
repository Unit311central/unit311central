-- Unit311 platform system health — operational incidents and external probe metadata.
-- Not workspace-scoped; no customer tenancy.

create table if not exists public.unit311_system_health_incidents (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  severity text not null check (severity in ('critical', 'warning')),
  status text not null check (status in ('open', 'resolved')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists unit311_system_health_incidents_started_idx
  on public.unit311_system_health_incidents (started_at desc);

create table if not exists public.unit311_system_health_probe_meta (
  id text primary key,
  last_probe_at timestamptz,
  last_probe_ok boolean,
  last_probe_http_status integer,
  last_failure_at timestamptz,
  last_recovery_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.unit311_system_health_probe_meta (id)
values ('default')
on conflict (id) do nothing;

alter table public.unit311_system_health_incidents enable row level security;
alter table public.unit311_system_health_probe_meta enable row level security;
