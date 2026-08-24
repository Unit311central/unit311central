-- Central employee expense management: workflow, categories, billing codes,
-- mileage rates, expense runs (separate from payroll), approvals, payment details.

-- ---------------------------------------------------------------------------
-- Expense categories (workspace-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  code text not null default '',
  gl_account_code text not null default '5090',
  active boolean not null default true,
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create index if not exists expense_categories_workspace_idx
  on public.expense_categories (workspace_id, active, sort_order);

-- ---------------------------------------------------------------------------
-- Billing codes (workspace-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.expense_billing_codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create index if not exists expense_billing_codes_workspace_idx
  on public.expense_billing_codes (workspace_id, active, sort_order);

-- ---------------------------------------------------------------------------
-- Mileage rates (workspace-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.expense_mileage_rates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  country_code text not null default 'GB',
  vehicle_type text not null default 'car',
  rate_per_unit numeric(12, 4) not null default 0,
  distance_unit text not null default 'miles'
    check (distance_unit in ('miles', 'kilometres')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expense_mileage_rates_workspace_idx
  on public.expense_mileage_rates (workspace_id, active);

-- ---------------------------------------------------------------------------
-- Expense payment schedule (one row per workspace)
-- ---------------------------------------------------------------------------
create table if not exists public.expense_payment_schedules (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  frequency text not null default 'monthly'
    check (frequency in ('weekly', 'fortnightly', 'monthly', 'custom')),
  cutoff_day integer not null default 25
    check (cutoff_day >= 1 and cutoff_day <= 31),
  approval_deadline_day integer not null default 27
    check (approval_deadline_day >= 1 and approval_deadline_day <= 31),
  payment_day integer not null default 31
    check (payment_day >= 1 and payment_day <= 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Expense runs (separate from payroll_runs)
-- ---------------------------------------------------------------------------
create table if not exists public.expense_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  label text not null,
  period_start date not null,
  period_end date not null,
  cutoff_date date not null,
  payment_date date not null,
  status text not null default 'open'
    check (status in ('open', 'review', 'approved', 'payment_scheduled', 'paid')),
  total_amount numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  expense_count integer not null default 0,
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expense_runs_workspace_idx
  on public.expense_runs (workspace_id, payment_date desc);

-- ---------------------------------------------------------------------------
-- Expense approval history
-- ---------------------------------------------------------------------------
create table if not exists public.expense_approval_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  expense_id uuid not null references public.financial_expenses (id) on delete cascade,
  actor_user_id text not null,
  actor_name text not null default '',
  action text not null
    check (action in ('submitted', 'approved', 'rejected', 'changes_requested', 'resubmitted', 'scheduled', 'paid')),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists expense_approval_events_expense_idx
  on public.expense_approval_events (expense_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Employee payment / bank details (HR-linked, workspace-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.hr_employee_payment_details (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  employee_id text not null,
  country_code text not null default 'GB',
  account_holder_name text not null default '',
  bank_name text not null default '',
  bank_address text not null default '',
  sort_code text,
  account_number text,
  routing_number text,
  iban text,
  swift_bic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, employee_id)
);

create index if not exists hr_employee_payment_details_workspace_idx
  on public.hr_employee_payment_details (workspace_id);

-- ---------------------------------------------------------------------------
-- In-workspace expense notifications
-- ---------------------------------------------------------------------------
create table if not exists public.expense_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  recipient_user_id text not null,
  expense_id uuid references public.financial_expenses (id) on delete set null,
  kind text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists expense_notifications_recipient_idx
  on public.expense_notifications (workspace_id, recipient_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Expense number sequence per workspace
-- ---------------------------------------------------------------------------
create table if not exists public.expense_number_seq (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  next_value integer not null default 1
);

-- ---------------------------------------------------------------------------
-- Extend financial_expenses
-- ---------------------------------------------------------------------------
alter table public.financial_expenses
  add column if not exists workflow_status text not null default 'draft';

alter table public.financial_expenses
  drop constraint if exists financial_expenses_workflow_status_check;

alter table public.financial_expenses
  add constraint financial_expenses_workflow_status_check
  check (
    workflow_status in (
      'draft',
      'submitted',
      'changes_requested',
      'approved',
      'rejected',
      'scheduled',
      'paid',
      'cancelled'
    )
  );

alter table public.financial_expenses
  add column if not exists description text;

alter table public.financial_expenses
  add column if not exists claimant_employee_id text;

alter table public.financial_expenses
  add column if not exists expense_category_id uuid references public.expense_categories (id) on delete set null;

alter table public.financial_expenses
  add column if not exists billing_code_id uuid references public.expense_billing_codes (id) on delete set null;

alter table public.financial_expenses
  add column if not exists expense_run_id uuid references public.expense_runs (id) on delete set null;

alter table public.financial_expenses
  add column if not exists expense_number text;

alter table public.financial_expenses
  add column if not exists submitted_at timestamptz;

alter table public.financial_expenses
  add column if not exists approved_at timestamptz;

alter table public.financial_expenses
  add column if not exists paid_at timestamptz;

alter table public.financial_expenses
  add column if not exists expected_payment_date date;

alter table public.financial_expenses
  add column if not exists expense_type text not null default 'standard'
    check (expense_type in ('standard', 'mileage'));

alter table public.financial_expenses
  add column if not exists mileage_from text;

alter table public.financial_expenses
  add column if not exists mileage_to text;

alter table public.financial_expenses
  add column if not exists mileage_distance numeric(12, 2);

alter table public.financial_expenses
  add column if not exists mileage_distance_unit text
    check (mileage_distance_unit is null or mileage_distance_unit in ('miles', 'kilometres'));

alter table public.financial_expenses
  add column if not exists mileage_rate numeric(12, 4);

alter table public.financial_expenses
  add column if not exists mileage_calculated_amount numeric(12, 2);

update public.financial_expenses
set description = purpose_description
where description is null or description = '';

update public.financial_expenses
set workflow_status = case
  when record_status = 'draft' then 'draft'
  when paid = true then 'paid'
  else 'approved'
end
where workflow_status is null or workflow_status = 'draft'
  and record_status = 'finalized';

create index if not exists financial_expenses_workflow_status_idx
  on public.financial_expenses (workspace_id, workflow_status);

create index if not exists financial_expenses_claimant_idx
  on public.financial_expenses (workspace_id, claimant_employee_id);

create unique index if not exists financial_expenses_number_uidx
  on public.financial_expenses (workspace_id, expense_number)
  where expense_number is not null and expense_number <> '';

-- ---------------------------------------------------------------------------
-- RLS (tenant isolation via workspace_id)
-- ---------------------------------------------------------------------------
alter table public.expense_categories enable row level security;
alter table public.expense_billing_codes enable row level security;
alter table public.expense_mileage_rates enable row level security;
alter table public.expense_payment_schedules enable row level security;
alter table public.expense_runs enable row level security;
alter table public.expense_approval_events enable row level security;
alter table public.hr_employee_payment_details enable row level security;
alter table public.expense_notifications enable row level security;

do $$ begin
  create policy expense_categories_tenant on public.expense_categories
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expense_billing_codes_tenant on public.expense_billing_codes
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expense_mileage_rates_tenant on public.expense_mileage_rates
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expense_payment_schedules_tenant on public.expense_payment_schedules
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expense_runs_tenant on public.expense_runs
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expense_approval_events_tenant on public.expense_approval_events
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy hr_employee_payment_details_tenant on public.hr_employee_payment_details
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expense_notifications_tenant on public.expense_notifications
    for all using (true) with check (true);
exception when duplicate_object then null;
end $$;
