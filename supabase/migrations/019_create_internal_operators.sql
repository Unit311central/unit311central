create table if not exists public.internal_operators (
  id text primary key,
  operator_label text not null,
  full_name text not null,
  username text not null,
  email text,
  phone text,
  role text not null,
  status text not null,
  region text not null,
  license_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_operators_username_unique unique (username)
);

create index if not exists internal_operators_status_idx on public.internal_operators (status);
create index if not exists internal_operators_region_idx on public.internal_operators (region);

alter table public.internal_operators enable row level security;

drop policy if exists "internal_operators_all" on public.internal_operators;
create policy "internal_operators_all" on public.internal_operators
  for all using (true) with check (true);

insert into public.internal_operators (
  id, operator_label, full_name, username, email, phone, role, status, region, license_id, notes
) values
  (
    'user-bcndrone',
    'BCN Admin',
    'BCN Operations',
    'bcndrone',
    'info@barcelonadronecenter.com',
    '+34 93 200 4500',
    'Mission Coordinator',
    'Active',
    'Multi-site',
    'EASA A2 · BCN-OPS-001',
    'Primary internal operations account for the BCN Drone Center workspace.'
  ),
  (
    'user-1',
    'User 1',
    'User 1',
    'user1',
    'user1@barcelonadronecenter.com',
    '+34 600 100 001',
    'Senior Drone Operator',
    'Active',
    'Barcelona',
    'EASA A2 · BCN-001',
    'Barcelona test site operator.'
  ),
  (
    'user-2',
    'User 2',
    'User 2',
    'user2',
    'user2@barcelonadronecenter.com',
    '+44 7700 900 002',
    'Survey Lead',
    'Active',
    'Oxford',
    'CAA A2CofC · BCN-002',
    'Oxford survey programmes.'
  ),
  (
    'user-3',
    'User 3',
    'User 3',
    'user3',
    'user3@barcelonadronecenter.com',
    '+351 912 445 003',
    'Drone Operator',
    'Active',
    'Porto',
    'ANAC A2 · BCN-003',
    'Porto operations and berth surveys.'
  ),
  (
    'user-4',
    'User 4',
    'User 4',
    'user4',
    'user4@barcelonadronecenter.com',
    '+34 600 100 004',
    'Drone Operator',
    'Active',
    'Barcelona',
    'EASA A2 · BCN-004',
    'Training and certification support.'
  ),
  (
    'user-5',
    'User 5',
    'User 5',
    'user5',
    'user5@barcelonadronecenter.com',
    '+34 600 100 005',
    'Mission Coordinator',
    'Active',
    'Multi-site',
    'EASA A2 · BCN-005',
    'Client programme coordination.'
  )
on conflict (id) do nothing;
