-- Track C: CRM opportunity → sales quote → accept → client invoice

create table if not exists public.sales_quotes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  quote_number text not null,
  crm_lead_id uuid references public.crm_leads (id) on delete set null,
  client_id text references public.internal_clients (id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text,
  title text not null default 'Sales quote',
  currency text not null default 'GBP',
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  valid_until date,
  pdf_path text,
  invoice_id uuid references public.invoices (id) on delete set null,
  stripe_payment_link_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, quote_number)
);

create table if not exists public.sales_quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.sales_quotes (id) on delete cascade,
  line_number integer not null check (line_number > 0),
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists sales_quotes_workspace_idx on public.sales_quotes (workspace_id);
create index if not exists sales_quotes_status_idx on public.sales_quotes (workspace_id, status);
create index if not exists sales_quotes_lead_idx on public.sales_quotes (crm_lead_id);
create index if not exists sales_quote_line_items_quote_idx on public.sales_quote_line_items (quote_id);

alter table public.sales_quotes enable row level security;
alter table public.sales_quote_line_items enable row level security;

create policy "sales_quotes_all" on public.sales_quotes for all using (true) with check (true);
create policy "sales_quote_line_items_all" on public.sales_quote_line_items for all using (true) with check (true);
