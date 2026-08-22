-- Dedicated QA task backlog for the Test workspace tenant only.
-- Server paths use service_role + explicit workspace_id filters (deny-all RLS).

create table if not exists public.qa_workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'completed')),
  scope text not null default 'element' check (scope in ('workspace', 'module', 'page', 'element')),
  completed boolean not null default false,
  module_label text not null,
  module_id text,
  page_label text not null,
  page_view_id text,
  route_path text,
  element_label text not null,
  element_type text,
  element_id text,
  description text not null,
  created_by uuid references public.platform_users (id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qa_workspace_tasks_workspace_id_idx
  on public.qa_workspace_tasks (workspace_id);

create index if not exists qa_workspace_tasks_workspace_status_idx
  on public.qa_workspace_tasks (workspace_id, status);

create index if not exists qa_workspace_tasks_workspace_module_idx
  on public.qa_workspace_tasks (workspace_id, module_label);

create index if not exists qa_workspace_tasks_workspace_page_idx
  on public.qa_workspace_tasks (workspace_id, page_label);

create index if not exists qa_workspace_tasks_workspace_created_at_idx
  on public.qa_workspace_tasks (workspace_id, created_at desc);

create index if not exists qa_workspace_tasks_workspace_scope_idx
  on public.qa_workspace_tasks (workspace_id, scope);

alter table public.qa_workspace_tasks enable row level security;

drop policy if exists qa_workspace_tasks_deny_all on public.qa_workspace_tasks;
create policy qa_workspace_tasks_deny_all on public.qa_workspace_tasks
  for all
  using (false);

comment on table public.qa_workspace_tasks is
  'QA capture backlog for the dedicated Test workspace (test.unit311central.com) only. Not a product module.';
