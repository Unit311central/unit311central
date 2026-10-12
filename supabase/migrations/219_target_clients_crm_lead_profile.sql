-- Target Clients (Sales Management): optional company website and sector on shared crm_leads rows.

alter table public.crm_leads
  add column if not exists company_website text,
  add column if not exists industry text;
