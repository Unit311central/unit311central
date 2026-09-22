-- Scope-style quotes, line detail text, PDF options, bank details, attached terms PDF.

alter table public.sales_quotes
  add column if not exists line_column_visibility jsonb not null default jsonb_build_object(
    'showQuantity', true,
    'showUnit', true,
    'showRate', true,
    'showDiscount', true,
    'showTax', true
  ),
  add column if not exists pricing_style text not null default 'detailed'
    check (pricing_style in ('detailed', 'scope_total')),
  add column if not exists bank_details jsonb,
  add column if not exists terms_pdf_storage_path text,
  add column if not exists terms_pdf_filename text;

alter table public.sales_quote_line_items
  add column if not exists detail_text text;
