-- Extend QA tasks with explicit capture scope (workspace / module / page / element).

alter table public.qa_workspace_tasks
  add column if not exists scope text not null default 'element'
  check (scope in ('workspace', 'module', 'page', 'element'));

update public.qa_workspace_tasks
set scope = 'page'
where scope = 'element'
  and (element_label = 'Page-level' or element_type = 'page');

create index if not exists qa_workspace_tasks_workspace_scope_idx
  on public.qa_workspace_tasks (workspace_id, scope);

comment on column public.qa_workspace_tasks.scope is
  'QA capture scope: workspace, module, page, or element. Test workspace only.';
