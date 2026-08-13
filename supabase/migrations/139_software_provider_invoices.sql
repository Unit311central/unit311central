-- Generic provider billing invoices — accounting-backed Software & SaaS spend.
-- Links to financial_expenses once paid. Idempotent on (workspace_id, provider_slug, provider_invoice_key).

create table if not exists public.software_provider_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  provider_slug text not null,
  software_asset_id uuid references public.software_assets (id) on delete set null,
  /** Stable idempotency key, e.g. vercel:{teamId}:period:{iso-start} */
  provider_invoice_key text not null,
  /** Provider-native invoice / transaction id when exposed by API */
  provider_transaction_id text,
  invoice_number text,
  invoice_status text not null default 'upcoming'
    check (invoice_status in ('upcoming', 'paid', 'void', 'refunded', 'partially_paid')),
  invoice_date date,
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  payment_date date,
  scheduled_payment_date date,
  amount numeric(14, 4) not null default 0,
  currency text not null default 'USD',
  tax_amount numeric(14, 4),
  description text not null default '',
  category text not null default 'Software',
  payment_method text not null default 'personally_paid',
  /** Storage key / URL when provider exposes invoice PDF */
  source_document_ref text,
  source_document_status text not null default 'unavailable'
    check (source_document_status in ('available', 'unavailable', 'pending')),
  financial_expense_id uuid references public.financial_expenses (id) on delete set null,
  raw_summary jsonb not null default '{}'::jsonb,
  source text not null default 'provider_api',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint software_provider_invoices_idempotency_key
    unique (workspace_id, provider_slug, provider_invoice_key)
);

create index if not exists software_provider_invoices_workspace_provider_idx
  on public.software_provider_invoices (workspace_id, provider_slug, billing_period_start desc);

create index if not exists software_provider_invoices_status_idx
  on public.software_provider_invoices (workspace_id, provider_slug, invoice_status);

create index if not exists software_provider_invoices_expense_idx
  on public.software_provider_invoices (financial_expense_id)
  where financial_expense_id is not null;

alter table public.financial_expenses
  add column if not exists software_asset_id uuid references public.software_assets (id) on delete set null,
  add column if not exists provider_slug text,
  add column if not exists provider_invoice_key text;

create index if not exists financial_expenses_provider_invoice_key_idx
  on public.financial_expenses (workspace_id, provider_slug, provider_invoice_key)
  where provider_invoice_key is not null and provider_invoice_key <> '';

alter table public.financial_expenses
  drop constraint if exists financial_expenses_payment_method_check;

alter table public.financial_expenses
  add constraint financial_expenses_payment_method_check
  check (payment_method is null or payment_method in ('wise', 'stripe', 'personally_paid'));

alter table public.software_provider_invoices enable row level security;

drop policy if exists "software_provider_invoices_all" on public.software_provider_invoices;
create policy "software_provider_invoices_all" on public.software_provider_invoices
  for all using (true) with check (true);

comment on table public.software_provider_invoices is
  'Confirmed provider invoices/charges. Paid rows link to financial_expenses. Upcoming rows are not spend-to-date.';
