-- Extend QA task statuses for beta feedback workflows (InterfaceWorx + Test workspace).
-- Workspace isolation remains on workspace_id; no cross-tenant data changes.

alter table public.qa_workspace_tasks
  drop constraint if exists qa_workspace_tasks_status_check;

alter table public.qa_workspace_tasks
  add constraint qa_workspace_tasks_status_check
  check (status in ('open', 'in_progress', 'done', 'wont_fix', 'completed'));

update public.qa_workspace_tasks
set status = 'done'
where status = 'completed';

comment on table public.qa_workspace_tasks is
  'QA capture backlog scoped by workspace_id (Test workspace and InterfaceWorx beta). Not a product module.';
