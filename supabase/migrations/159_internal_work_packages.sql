-- Internal Work Packages — lightweight workspace-scoped task bundles (Business Productivity).

create table if not exists internal_work_packages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  package_code text not null,
  name text not null,
  description text not null default '',
  status text not null default 'Not Started',
  priority text not null default 'Normal',
  owner_user_id uuid,
  owner_name text not null default '',
  created_by_user_id uuid,
  created_by_name text not null default '',
  start_date date,
  expected_completion_date date,
  actual_completion_date date,
  progress_pct numeric(5, 2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, package_code)
);

create index if not exists internal_work_packages_workspace_idx
  on internal_work_packages (workspace_id, updated_at desc);

create table if not exists internal_work_package_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  work_package_id uuid not null references internal_work_packages(id) on delete cascade,
  user_id uuid,
  display_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists internal_work_package_members_pkg_idx
  on internal_work_package_members (work_package_id);

create table if not exists internal_work_package_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  work_package_id uuid not null references internal_work_packages(id) on delete cascade,
  task_code text not null,
  category text not null default '',
  description text not null,
  assigned_to_user_id uuid,
  assigned_to_name text not null default '',
  start_date date,
  expected_completion_date date,
  finished boolean not null default false,
  finished_at timestamptz,
  status text not null default 'Not Started',
  priority text not null default 'Normal',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_package_id, task_code)
);

create index if not exists internal_work_package_tasks_pkg_idx
  on internal_work_package_tasks (work_package_id, created_at);

alter table public.internal_work_packages enable row level security;
alter table public.internal_work_package_members enable row level security;
alter table public.internal_work_package_tasks enable row level security;

drop policy if exists "internal_work_packages_all" on public.internal_work_packages;
create policy "internal_work_packages_all" on public.internal_work_packages for all using (true) with check (true);

drop policy if exists "internal_work_package_members_all" on public.internal_work_package_members;
create policy "internal_work_package_members_all" on public.internal_work_package_members for all using (true) with check (true);

drop policy if exists "internal_work_package_tasks_all" on public.internal_work_package_tasks;
create policy "internal_work_package_tasks_all" on public.internal_work_package_tasks for all using (true) with check (true);
