-- Phase 1 (step 4a): Add workspace_uuid FK columns for HR child tables (text workspace_id retained).
-- Validates/backfills from parent hr_employees.workspace_id (uuid) before any type swap.

alter table public.hr_employee_compensation_history
  add column if not exists workspace_uuid uuid references public.workspaces (id) on delete restrict;

alter table public.hr_employee_documents
  add column if not exists workspace_uuid uuid references public.workspaces (id) on delete restrict;

alter table public.hr_employee_notes
  add column if not exists workspace_uuid uuid references public.workspaces (id) on delete restrict;

alter table public.hr_employee_timeline_events
  add column if not exists workspace_uuid uuid references public.workspaces (id) on delete restrict;

alter table public.hr_employee_employment_history
  add column if not exists workspace_uuid uuid references public.workspaces (id) on delete restrict;

-- Backfill from employee parent row (authoritative uuid workspace_id).
update public.hr_employee_compensation_history child
set workspace_uuid = e.workspace_id
from public.hr_employees e
where child.employee_id = e.id
  and child.workspace_uuid is null
  and e.workspace_id is not null;

update public.hr_employee_documents child
set workspace_uuid = e.workspace_id
from public.hr_employees e
where child.employee_id = e.id
  and child.workspace_uuid is null
  and e.workspace_id is not null;

update public.hr_employee_notes child
set workspace_uuid = e.workspace_id
from public.hr_employees e
where child.employee_id = e.id
  and child.workspace_uuid is null
  and e.workspace_id is not null;

update public.hr_employee_timeline_events child
set workspace_uuid = e.workspace_id
from public.hr_employees e
where child.employee_id = e.id
  and child.workspace_uuid is null
  and e.workspace_id is not null;

update public.hr_employee_employment_history child
set workspace_uuid = e.workspace_id
from public.hr_employees e
where child.employee_id = e.id
  and child.workspace_uuid is null
  and e.workspace_id is not null;

-- Fallback: map text workspace_id slug/uuid string to workspaces.id where employee link missing.
update public.hr_employee_compensation_history child
set workspace_uuid = w.id
from public.workspaces w
where child.workspace_uuid is null
  and (
    lower(child.workspace_id) = lower(w.slug)
    or child.workspace_id ~* '^[0-9a-f-]{36}$'
      and child.workspace_id::uuid = w.id
  );

update public.hr_employee_documents child
set workspace_uuid = w.id
from public.workspaces w
where child.workspace_uuid is null
  and (
    lower(child.workspace_id) = lower(w.slug)
    or child.workspace_id ~* '^[0-9a-f-]{36}$'
      and child.workspace_id::uuid = w.id
  );

update public.hr_employee_notes child
set workspace_uuid = w.id
from public.workspaces w
where child.workspace_uuid is null
  and (
    lower(child.workspace_id) = lower(w.slug)
    or child.workspace_id ~* '^[0-9a-f-]{36}$'
      and child.workspace_id::uuid = w.id
  );

update public.hr_employee_timeline_events child
set workspace_uuid = w.id
from public.workspaces w
where child.workspace_uuid is null
  and (
    lower(child.workspace_id) = lower(w.slug)
    or child.workspace_id ~* '^[0-9a-f-]{36}$'
      and child.workspace_id::uuid = w.id
  );

update public.hr_employee_employment_history child
set workspace_uuid = w.id
from public.workspaces w
where child.workspace_uuid is null
  and (
    lower(child.workspace_id) = lower(w.slug)
    or child.workspace_id ~* '^[0-9a-f-]{36}$'
      and child.workspace_id::uuid = w.id
  );

create index if not exists hr_employee_compensation_history_workspace_uuid_idx
  on public.hr_employee_compensation_history (workspace_uuid);
create index if not exists hr_employee_documents_workspace_uuid_idx
  on public.hr_employee_documents (workspace_uuid);
create index if not exists hr_employee_notes_workspace_uuid_idx
  on public.hr_employee_notes (workspace_uuid);
create index if not exists hr_employee_timeline_events_workspace_uuid_idx
  on public.hr_employee_timeline_events (workspace_uuid);
create index if not exists hr_employee_employment_history_workspace_uuid_idx
  on public.hr_employee_employment_history (workspace_uuid);

-- Report unresolved rows (non-blocking; surfaced for Phase 2).
do $$
declare
  orphan_count integer;
begin
  select
    (
      select count(*) from public.hr_employee_compensation_history where workspace_uuid is null
    ) +
    (
      select count(*) from public.hr_employee_documents where workspace_uuid is null
    ) +
    (
      select count(*) from public.hr_employee_notes where workspace_uuid is null
    ) +
    (
      select count(*) from public.hr_employee_timeline_events where workspace_uuid is null
    ) +
    (
      select count(*) from public.hr_employee_employment_history where workspace_uuid is null
    )
  into orphan_count;

  if orphan_count > 0 then
    raise warning 'HR child tables: % row(s) still missing workspace_uuid after backfill', orphan_count;
  end if;
end $$;
