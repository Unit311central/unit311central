-- Demo workspace attendance module.
-- Additive only. Every row is constrained to the verified demo workspace
-- (slug = demo, id = 9f555e68-6430-4c9a-889b-b135f2acf8bf).
-- Existing tables, policies, and other workspaces are not modified.

create table if not exists public.attendance_employees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  employee_number text not null,
  first_name text not null,
  last_name text not null,
  department text not null default '',
  job_title text not null default '',
  email text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_employees_demo_workspace_check
    check (workspace_id = '9f555e68-6430-4c9a-889b-b135f2acf8bf'::uuid),
  constraint attendance_employees_number_not_blank
    check (length(btrim(employee_number)) > 0),
  constraint attendance_employees_name_not_blank
    check (length(btrim(first_name)) > 0 and length(btrim(last_name)) > 0),
  constraint attendance_employees_workspace_number_key
    unique (workspace_id, employee_number),
  constraint attendance_employees_id_workspace_key
    unique (id, workspace_id)
);

create table if not exists public.attendance_badges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  employee_id uuid not null,
  nfc_uid text not null,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  constraint attendance_badges_demo_workspace_check
    check (workspace_id = '9f555e68-6430-4c9a-889b-b135f2acf8bf'::uuid),
  constraint attendance_badges_uid_not_blank
    check (length(btrim(nfc_uid)) > 0),
  constraint attendance_badges_employee_fkey
    foreign key (employee_id)
    references public.attendance_employees (id)
    on delete cascade,
  constraint attendance_badges_id_workspace_key
    unique (id, workspace_id)
);

create unique index if not exists attendance_badges_active_uid_key
  on public.attendance_badges (workspace_id, nfc_uid)
  where active;

create table if not exists public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  employee_id uuid not null,
  badge_id uuid,
  event_type text not null,
  event_timestamp timestamptz not null,
  source text not null,
  simulation_id uuid,
  created_at timestamptz not null default now(),
  constraint attendance_events_demo_workspace_check
    check (workspace_id = '9f555e68-6430-4c9a-889b-b135f2acf8bf'::uuid),
  constraint attendance_events_type_check
    check (event_type in ('IN', 'OUT')),
  constraint attendance_events_source_check
    check (source in ('SIMULATED', 'NFC')),
  constraint attendance_events_source_simulation_check
    check (
      (source = 'SIMULATED' and simulation_id is not null)
      or (source = 'NFC' and simulation_id is null)
    ),
  constraint attendance_events_employee_fkey
    foreign key (employee_id)
    references public.attendance_employees (id)
    on delete cascade,
  constraint attendance_events_badge_fkey
    foreign key (badge_id)
    references public.attendance_badges (id)
    on delete restrict
);

create unique index if not exists attendance_events_simulation_idempotency_idx
  on public.attendance_events (workspace_id, simulation_id, employee_id, event_type, event_timestamp)
  where simulation_id is not null;

create index if not exists attendance_events_workspace_time_idx
  on public.attendance_events (workspace_id, event_timestamp desc);

create index if not exists attendance_events_employee_time_idx
  on public.attendance_events (workspace_id, employee_id, event_timestamp desc);

create index if not exists attendance_events_simulation_idx
  on public.attendance_events (workspace_id, simulation_id)
  where simulation_id is not null;

create table if not exists public.attendance_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  employee_id uuid not null,
  day_of_week smallint not null,
  expected_start time not null,
  expected_end time not null,
  created_at timestamptz not null default now(),
  constraint attendance_schedules_demo_workspace_check
    check (workspace_id = '9f555e68-6430-4c9a-889b-b135f2acf8bf'::uuid),
  constraint attendance_schedules_day_check
    check (day_of_week between 1 and 7),
  constraint attendance_schedules_window_check
    check (expected_end > expected_start),
  constraint attendance_schedules_employee_day_key
    unique (workspace_id, employee_id, day_of_week),
  constraint attendance_schedules_employee_fkey
    foreign key (employee_id)
    references public.attendance_employees (id)
    on delete cascade
);

create index if not exists attendance_employees_workspace_active_idx
  on public.attendance_employees (workspace_id, active);

create index if not exists attendance_badges_employee_idx
  on public.attendance_badges (workspace_id, employee_id);

create index if not exists attendance_schedules_employee_idx
  on public.attendance_schedules (workspace_id, employee_id);

alter table public.attendance_employees enable row level security;
alter table public.attendance_badges enable row level security;
alter table public.attendance_events enable row level security;
alter table public.attendance_schedules enable row level security;

alter table public.attendance_employees force row level security;
alter table public.attendance_badges force row level security;
alter table public.attendance_events force row level security;
alter table public.attendance_schedules force row level security;

drop policy if exists attendance_employees_deny_all on public.attendance_employees;
create policy attendance_employees_deny_all
  on public.attendance_employees
  for all
  using (false);

drop policy if exists attendance_badges_deny_all on public.attendance_badges;
create policy attendance_badges_deny_all
  on public.attendance_badges
  for all
  using (false);

drop policy if exists attendance_events_deny_all on public.attendance_events;
create policy attendance_events_deny_all
  on public.attendance_events
  for all
  using (false);

drop policy if exists attendance_schedules_deny_all on public.attendance_schedules;
create policy attendance_schedules_deny_all
  on public.attendance_schedules
  for all
  using (false);

revoke all on table public.attendance_employees from anon, authenticated;
revoke all on table public.attendance_badges from anon, authenticated;
revoke all on table public.attendance_events from anon, authenticated;
revoke all on table public.attendance_schedules from anon, authenticated;

comment on table public.attendance_employees is
  'Demo-workspace attendance roster. Isolated from HR employees. Service-role API only.';
comment on table public.attendance_badges is
  'NFC badge assignments for the demo attendance module. Service-role API only.';
comment on table public.attendance_events is
  'Clock-in and clock-out events for the demo attendance module. Simulated rows carry simulation_id.';
comment on table public.attendance_schedules is
  'Expected working windows used to classify late, early, and absent attendance.';
