-- Optional free-text description for project tasks
alter table public.internal_project_tasks
  add column if not exists description text not null default '';
