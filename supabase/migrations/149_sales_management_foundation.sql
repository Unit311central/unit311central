-- Sales Management foundation: ownership, teams, targets, commission structure.
-- Reuses platform_users + hr_employees — no duplicate employee master.

alter table public.crm_leads
  add column if not exists owner_user_id uuid references public.platform_users (id) on delete set null;

create index if not exists crm_leads_owner_user_id_idx
  on public.crm_leads (workspace_id, owner_user_id)
  where owner_user_id is not null;

create table if not exists public.sales_teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  manager_user_id uuid references public.platform_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.sales_team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  team_id uuid not null references public.sales_teams (id) on delete cascade,
  user_id uuid not null references public.platform_users (id) on delete cascade,
  hr_employee_id text references public.hr_employees (id) on delete set null,
  role text not null default 'member'
    check (role in ('member', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists public.sales_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid references public.platform_users (id) on delete set null,
  team_id uuid references public.sales_teams (id) on delete set null,
  period_type text not null default 'quarter'
    check (period_type in ('month', 'quarter', 'year')),
  period_start date not null,
  period_end date not null,
  target_value numeric(14, 2) not null check (target_value >= 0),
  currency text not null default 'GBP',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_user_id is not null or team_id is not null)
);

create table if not exists public.sales_commission_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  rate_pct numeric(6, 2) not null check (rate_pct >= 0 and rate_pct <= 100),
  applies_to text not null default 'won_deal'
    check (applies_to in ('won_deal', 'accepted_quote', 'invoice_paid')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_commissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.platform_users (id) on delete cascade,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  quote_id uuid references public.sales_quotes (id) on delete set null,
  rule_id uuid references public.sales_commission_rules (id) on delete set null,
  commissionable_value numeric(14, 2) not null default 0 check (commissionable_value >= 0),
  rate_pct numeric(6, 2) not null default 0 check (rate_pct >= 0 and rate_pct <= 100),
  earned_amount numeric(14, 2) not null default 0 check (earned_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_teams_workspace_idx on public.sales_teams (workspace_id);
create index if not exists sales_team_members_workspace_idx on public.sales_team_members (workspace_id);
create index if not exists sales_team_members_user_idx on public.sales_team_members (user_id);
create index if not exists sales_targets_workspace_period_idx on public.sales_targets (workspace_id, period_start, period_end);
create index if not exists sales_commission_rules_workspace_idx on public.sales_commission_rules (workspace_id);
create index if not exists sales_commissions_workspace_user_idx on public.sales_commissions (workspace_id, user_id);

alter table public.sales_teams enable row level security;
alter table public.sales_team_members enable row level security;
alter table public.sales_targets enable row level security;
alter table public.sales_commission_rules enable row level security;
alter table public.sales_commissions enable row level security;

-- Idempotent for partial prior applies: policies may already exist without a runner-confirmed ledger row.
drop policy if exists "sales_teams_all" on public.sales_teams;
create policy "sales_teams_all" on public.sales_teams for all using (true) with check (true);

drop policy if exists "sales_team_members_all" on public.sales_team_members;
create policy "sales_team_members_all" on public.sales_team_members for all using (true) with check (true);

drop policy if exists "sales_targets_all" on public.sales_targets;
create policy "sales_targets_all" on public.sales_targets for all using (true) with check (true);

drop policy if exists "sales_commission_rules_all" on public.sales_commission_rules;
create policy "sales_commission_rules_all" on public.sales_commission_rules for all using (true) with check (true);

drop policy if exists "sales_commissions_all" on public.sales_commissions;
create policy "sales_commissions_all" on public.sales_commissions for all using (true) with check (true);
