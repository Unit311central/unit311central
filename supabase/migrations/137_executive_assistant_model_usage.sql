-- Executive Assistant OpenAI model usage telemetry (Responses API).
-- Service-role writes only; instrumentation failures must never block EA turns.

create table if not exists public.executive_assistant_model_usage (
  id text primary key,
  correlation_id text not null,
  conversation_id text null,
  user_id text null,
  workspace_id text null,
  call_site text not null,
  model text not null,
  input_tokens integer null,
  output_tokens integer null,
  total_tokens integer null,
  duration_ms integer not null,
  response_id text null,
  stream boolean not null default false,
  success boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists executive_assistant_model_usage_correlation_idx
  on public.executive_assistant_model_usage (correlation_id, created_at desc);

create index if not exists executive_assistant_model_usage_created_idx
  on public.executive_assistant_model_usage (created_at desc);

create index if not exists executive_assistant_model_usage_workspace_created_idx
  on public.executive_assistant_model_usage (workspace_id, created_at desc);

alter table public.executive_assistant_model_usage enable row level security;

drop policy if exists "executive_assistant_model_usage_all" on public.executive_assistant_model_usage;
-- Intentionally no open policies: service-role server access only.
