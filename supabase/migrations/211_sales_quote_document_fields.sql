-- Extend sales quotes for document-style quotes (line units, discounts, tax, terms).

alter table public.sales_quotes
  add column if not exists issue_date date,
  add column if not exists reference text,
  add column if not exists payment_terms text,
  add column if not exists terms_and_conditions text,
  add column if not exists discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0);

update public.sales_quotes
set issue_date = coalesce(issue_date, created_at::date)
where issue_date is null;

alter table public.sales_quote_line_items
  add column if not exists unit text,
  add column if not exists discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  add column if not exists tax_rate numeric(8, 4),
  add column if not exists tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0);

-- Remove known internal test quotes (opportunity/client records are untouched).
delete from public.sales_quote_line_items
where quote_id in (
  select id from public.sales_quotes where quote_number in ('Q-2026-421277', 'Q-2026-815428')
);

delete from public.sales_quotes
where quote_number in ('Q-2026-421277', 'Q-2026-815428');
