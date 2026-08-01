-- Durable Talanton / multi-tenant portfolio companies (Portfolio Companies Directory).
-- Scoped by workspace_id. Client Directory continues to hide ti-cli-* investment rows.

create extension if not exists pgcrypto;

create table if not exists public.portfolio_companies (
  id text primary key,
  workspace_id uuid not null,
  client_id text not null,
  name text not null,
  country text not null default '',
  sector text not null default '',
  region text not null default '',
  city text not null default '',
  employee_count integer not null default 0,
  investment_amount_usd numeric not null default 0,
  ownership_pct numeric not null default 0,
  annual_revenue_usd numeric not null default 0,
  revenue_growth_pct numeric not null default 0,
  burn_rate_usd_monthly numeric not null default 0,
  compliance_pct integer not null default 0,
  risk_rating text not null default 'Medium',
  roi_moic numeric not null default 1,
  last_quarterly_report_date text not null default '',
  outstanding_training integer not null default 0,
  users_enrolled integer not null default 0,
  courses_assigned integer not null default 0,
  overview text not null default '',
  primary_contact text not null default '',
  email text not null default '',
  phone text not null default '',
  last_review text not null default '',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, client_id)
);

create index if not exists portfolio_companies_workspace_idx
  on public.portfolio_companies (workspace_id, sort_order, name);

alter table public.portfolio_companies enable row level security;

drop policy if exists "portfolio_companies_service" on public.portfolio_companies;
create policy "portfolio_companies_service"
  on public.portfolio_companies
  for all
  using (true)
  with check (true);
