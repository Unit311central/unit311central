-- Internal client directory records

create table if not exists public.internal_clients (
  id text primary key,
  company_name text not null,
  industry text not null,
  primary_contact text not null default '',
  email text not null default '',
  phone text not null default '',
  region text not null,
  account_status text not null,
  contract_type text not null,
  tax_id text not null default '',
  billing_address text not null default '',
  active_projects integer not null default 0,
  notes text not null default '',
  platform_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_clients_company_name_idx
  on public.internal_clients (company_name);

create index if not exists internal_clients_status_idx
  on public.internal_clients (account_status);

alter table public.internal_clients enable row level security;

drop policy if exists "internal_clients_all" on public.internal_clients;
create policy "internal_clients_all" on public.internal_clients
  for all using (true) with check (true);

insert into public.internal_clients (
  id, company_name, industry, primary_contact, email, phone, region,
  account_status, contract_type, tax_id, billing_address, active_projects, notes, platform_url
) values
  (
    'client-venturi',
    'Venturi Aeronautical',
    'Other',
    'Eduard Gómez',
    'e.gomez@venturi.aero',
    '+34 93 200 4500',
    'Catalonia, Spain',
    'Active',
    'Framework Agreement',
    'ES-B65432109',
    'Parc Tecnològic Barcelona, 08034 Barcelona, Spain',
    5,
    'Electric VTOL platform manufacturer — feasibility, R&D, regulatory compliance, certification support, and operational test site services.',
    '/client/venturi'
  ),
  (
    'client-1',
    'Catalonia Energy Partners',
    'Energy & Utilities',
    'Elena Morales',
    'e.morales@cataloniaenergy.es',
    '+34 93 412 8800',
    'Catalonia, Spain',
    'Active',
    'Framework Agreement',
    'ES-B66233441',
    'Av. Diagonal 211, 08018 Barcelona, Spain',
    3,
    'Solar corridor and substation inspection programme.',
    null
  ),
  (
    'client-2',
    'Douro Maritime Logistics',
    'Logistics & Ports',
    'Rui Ferreira',
    'rui.ferreira@dourologistics.pt',
    '+351 22 340 1200',
    'Porto, Portugal',
    'Active',
    'Project-based',
    'PT509876543',
    'Terminal Intermodal, 4450-208 Matosinhos, Portugal',
    2,
    'Quarterly berth and stockpile volumetrics.',
    null
  ),
  (
    'client-3',
    'Oxford Heritage Survey Ltd',
    'Property & Heritage',
    'James Whitfield',
    'j.whitfield@oxfordheritage.co.uk',
    '+44 1865 742 900',
    'Oxfordshire, UK',
    'Active',
    'Retainer',
    'GB123456789',
    '24 Beaumont Street, Oxford OX1 2NP, UK',
    4,
    'Listed building envelope and campus mapping.',
    null
  ),
  (
    'client-4',
    'Iberia Infrastructure Group',
    'Infrastructure',
    'Sofia Alvarez',
    'sofia.alvarez@iberiainfra.com',
    '+34 91 555 0142',
    'Iberia',
    'Prospect',
    'Trial',
    'ES-A80192736',
    'Paseo de la Castellana 95, 28046 Madrid, Spain',
    0,
    'Pilot corridor mapping — awaiting Q3 mobilisation.',
    null
  ),
  (
    'client-westport',
    'Westport Logistics Hub',
    'Logistics & Ports',
    'Marcus Chen',
    'm.chen@terrabuild.com.au',
    '+61 8 9432 8800',
    'Western Australia',
    'Active',
    'Framework Agreement',
    'AU 51 824 753 556',
    'TerraBuild Infrastructure, Perth WA 6000, Australia',
    1,
    'TerraBuild Infrastructure — 240ha industrial logistics precinct.',
    '/test1'
  )
on conflict (id) do nothing;
