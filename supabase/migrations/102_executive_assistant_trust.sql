-- Explainability / trust: anonymous feedback + AI quality events
-- Numbered after 101_executive_assistant_conversations.sql
--
-- Security review:
-- - RLS enabled with NO permissive policies for anon/authenticated.
-- - Writes occur from authenticated API routes using the service role.
-- - Feedback is anonymous by design (anonymous_session_id); do not store PII here.

create table if not exists public.executive_assistant_feedback (
  id text primary key,
  verdict text not null check (verdict in ('helpful', 'not_helpful', 'incorrect', 'missing_data')),
  target_type text not null,
  target_id text not null,
  comment text null,
  anonymous_session_id text not null,
  context_view text null,
  created_at timestamptz not null default now()
);

create index if not exists executive_assistant_feedback_created_idx
  on public.executive_assistant_feedback (created_at desc);

create index if not exists executive_assistant_feedback_verdict_idx
  on public.executive_assistant_feedback (verdict, created_at desc);

alter table public.executive_assistant_feedback enable row level security;

drop policy if exists "executive_assistant_feedback_all" on public.executive_assistant_feedback;

create table if not exists public.executive_assistant_quality_events (
  id text primary key,
  kind text not null,
  tool_name text null,
  duration_ms integer null,
  success boolean null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists executive_assistant_quality_events_created_idx
  on public.executive_assistant_quality_events (created_at desc);

create index if not exists executive_assistant_quality_events_kind_idx
  on public.executive_assistant_quality_events (kind, created_at desc);

alter table public.executive_assistant_quality_events enable row level security;

drop policy if exists "executive_assistant_quality_events_all" on public.executive_assistant_quality_events;
-- Intentionally no open policies: service-role server access only.
