-- Internal financial expenses

create table if not exists public.financial_expenses (
  id uuid primary key default gen_random_uuid(),
  submitter_user_id text not null,
  submitter_name text not null,
  purpose_description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'EUR',
  date_submitted date not null,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_expenses_date_submitted_idx
  on public.financial_expenses (date_submitted desc);

create index if not exists financial_expenses_submitter_idx
  on public.financial_expenses (submitter_user_id);

alter table public.financial_expenses enable row level security;

create policy "financial_expenses_all" on public.financial_expenses
  for all using (true) with check (true);
