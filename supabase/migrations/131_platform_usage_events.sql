-- Platform Analytics: first-party usage facts (Internal dashboard source of truth).
-- RLS deny-all; service-role access from Next.js only.

create table if not exists public.platform_usage_events (
  id text primary key,
  workspace_id text null,
  workspace_key text not null,
  module_key text not null,
  page_key text not null,
  user_role text not null default 'anonymous',
  user_hash text null,
  source text not null default 'nav',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists platform_usage_events_workspace_occurred_idx
  on public.platform_usage_events (workspace_key, occurred_at desc);

create index if not exists platform_usage_events_module_page_occurred_idx
  on public.platform_usage_events (module_key, page_key, occurred_at desc);

create index if not exists platform_usage_events_occurred_idx
  on public.platform_usage_events (occurred_at desc);

alter table public.platform_usage_events enable row level security;
drop policy if exists "platform_usage_events_all" on public.platform_usage_events;
-- Intentionally no open policies: service-role server access only.
