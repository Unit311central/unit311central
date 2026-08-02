-- Website Analytics: Clarity snapshot cache + first-party marketing events.
-- RLS deny-all; service-role access from Next.js only.

create table if not exists public.website_clarity_snapshots (
  id text primary key,
  fetched_at timestamptz not null default now(),
  num_of_days integer not null default 3,
  payload jsonb not null default '[]'::jsonb,
  error text null
);

create index if not exists website_clarity_snapshots_fetched_idx
  on public.website_clarity_snapshots (fetched_at desc);

alter table public.website_clarity_snapshots enable row level security;
drop policy if exists "website_clarity_snapshots_all" on public.website_clarity_snapshots;

create table if not exists public.website_marketing_events (
  id text primary key,
  event_type text not null,
  path text not null default '/',
  label text null,
  meta jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists website_marketing_events_type_occurred_idx
  on public.website_marketing_events (event_type, occurred_at desc);

create index if not exists website_marketing_events_path_occurred_idx
  on public.website_marketing_events (path, occurred_at desc);

alter table public.website_marketing_events enable row level security;
drop policy if exists "website_marketing_events_all" on public.website_marketing_events;
