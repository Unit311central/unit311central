-- Public Partners (distributors / representatives) signup + portal.

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  first_name text not null,
  last_name text not null,
  company_name text not null,
  email text not null,
  email_verified_at timestamptz,
  address_line1 text,
  address_line2 text,
  city text,
  district text,
  country text,
  postcode text,
  phone_country_code text,
  phone_number text,
  account_holder text,
  bank_name text,
  bank_address text,
  account_number text,
  sort_code text,
  swift text,
  iban text,
  bic text,
  routing text,
  portal_token text not null unique,
  portal_url text,
  status text not null default 'onboarding',
  intake_step text not null default 'identity',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists partners_email_uidx
  on public.partners (lower(email));

create index if not exists partners_workspace_idx
  on public.partners (workspace_id, created_at desc);

create table if not exists public.partner_otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  first_name text,
  last_name text,
  company_name text,
  created_at timestamptz not null default now()
);

create index if not exists partner_otp_email_idx
  on public.partner_otp_codes (lower(email), created_at desc);

create table if not exists public.partner_invoices (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  job_reference text not null,
  description text,
  amount numeric(14, 2),
  currency text not null default 'USD',
  status text not null default 'job_not_started',
  file_name text,
  file_url text,
  mime_type text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_invoices_partner_idx
  on public.partner_invoices (partner_id, submitted_at desc);

alter table public.partners enable row level security;
alter table public.partner_otp_codes enable row level security;
alter table public.partner_invoices enable row level security;

drop policy if exists "partners_all" on public.partners;
create policy "partners_all" on public.partners for all using (true) with check (true);

drop policy if exists "partner_otp_all" on public.partner_otp_codes;
create policy "partner_otp_all" on public.partner_otp_codes for all using (true) with check (true);

drop policy if exists "partner_invoices_all" on public.partner_invoices;
create policy "partner_invoices_all" on public.partner_invoices for all using (true) with check (true);
