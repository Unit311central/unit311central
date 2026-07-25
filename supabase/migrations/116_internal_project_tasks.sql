-- Per-project tasks that drive Internal Project progress / dashboard KPIs
-- project_id is text so both API UUID projects and legacy portfolio ids work.

create table if not exists public.internal_project_tasks (
  id text primary key,
  project_id text not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  start_date date not null,
  due_date date not null,
  progress numeric(5, 2) not null default 0,
  resource text not null default '',
  milestone boolean not null default false,
  critical boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_project_tasks_project_idx
  on public.internal_project_tasks (project_id, sort_order asc);

create index if not exists internal_project_tasks_workspace_idx
  on public.internal_project_tasks (workspace_id);

alter table public.internal_project_tasks enable row level security;

drop policy if exists "internal_project_tasks_all" on public.internal_project_tasks;
create policy "internal_project_tasks_all" on public.internal_project_tasks
  for all using (true) with check (true);
