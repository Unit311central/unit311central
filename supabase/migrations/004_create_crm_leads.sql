-- Internal CRM leads pipeline
-- Run in Supabase SQL Editor or via supabase db push

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text,
  phone text,
  status text not null default 'Cold',
  source text,
  next_action text,
  next_action_date date,
  estimated_value numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_leads_status_idx on public.crm_leads (status);
create index crm_leads_next_action_date_idx on public.crm_leads (next_action_date);

alter table public.crm_leads enable row level security;

create policy "crm_leads_all" on public.crm_leads
  for all using (true) with check (true);
