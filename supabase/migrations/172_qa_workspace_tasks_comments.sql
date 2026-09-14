-- QA task reviewer comments (separate from capture description).

alter table public.qa_workspace_tasks
  add column if not exists comments text not null default '';

comment on column public.qa_workspace_tasks.comments is
  'Reviewer follow-up comments on the QA task. Distinct from the original capture description.';
