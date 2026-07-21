-- Executive Assistant conversation memory (Operating Assistant foundation)
-- Numbered after Unit311 100_mod900_list_query_indexes.sql
--
-- Security review:
-- - RLS enabled with NO permissive policies for anon/authenticated.
-- - Access is intended via the Next.js server using the Supabase service role
--   (service_role bypasses RLS). Do not expose these tables to the browser client.

create table if not exists public.executive_assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New conversation',
  user_id text not null,
  workspace_id text null,
  organisation_id text null,
  messages jsonb not null default '[]'::jsonb,
  workspace_context jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists executive_assistant_conversations_user_updated_idx
  on public.executive_assistant_conversations (user_id, updated_at desc);

create index if not exists executive_assistant_conversations_workspace_idx
  on public.executive_assistant_conversations (workspace_id, updated_at desc);

alter table public.executive_assistant_conversations enable row level security;

drop policy if exists "executive_assistant_conversations_all" on public.executive_assistant_conversations;
-- Intentionally no open policies: service-role server access only.
