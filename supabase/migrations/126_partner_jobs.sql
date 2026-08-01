-- Partner jobs, commission rates, and AP/AR linkage.

create table if not exists public.partner_commission_rates (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  label text not null,
  rate_pct numeric(8, 4) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_commission_rates_partner_idx
  on public.partner_commission_rates (partner_id, created_at desc);

create table if not exists public.partner_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  partner_id uuid not null references public.partners (id) on delete cascade,
  job_date date not null,
  description text not null,
  location text,
  client_id text,
  client_name text,
  invoice_id uuid,
  invoice_number text,
  base_amount numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  commission_rate_id uuid references public.partner_commission_rates (id) on delete set null,
  commission_rate_pct numeric(8, 4) not null default 0,
  commission_amount numeric(14, 2) not null default 0,
  payment_due_date date,
  expense_id uuid,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_jobs_partner_idx
  on public.partner_jobs (partner_id, job_date desc);

alter table public.partner_commission_rates enable row level security;
alter table public.partner_jobs enable row level security;

drop policy if exists "partner_commission_rates_all" on public.partner_commission_rates;
create policy "partner_commission_rates_all" on public.partner_commission_rates
  for all using (true) with check (true);

drop policy if exists "partner_jobs_all" on public.partner_jobs;
create policy "partner_jobs_all" on public.partner_jobs
  for all using (true) with check (true);

alter table public.partner_invoices
  add column if not exists partner_job_id uuid references public.partner_jobs (id) on delete set null;
