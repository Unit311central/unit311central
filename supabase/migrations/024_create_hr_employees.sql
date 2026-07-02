create table if not exists public.hr_employees (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null default '',
  date_joined date not null,
  salary_current numeric(12, 2) not null default 0,
  salary_previous numeric(12, 2) not null default 0,
  salary_increase_date date,
  documents jsonb not null default '{"resume":{"fileName":null,"uploadedAt":null},"contract":{"fileName":null,"uploadedAt":null},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_employees_name_idx on public.hr_employees (full_name);

alter table public.hr_employees enable row level security;

drop policy if exists "hr_employees_all" on public.hr_employees;
create policy "hr_employees_all" on public.hr_employees
  for all using (true) with check (true);

insert into public.hr_employees (
  id, full_name, email, phone, date_joined, salary_current, salary_previous, salary_increase_date, documents
) values
  (
    'hr-1', 'María García', 'maria.garcia@barcelonadronecenter.com', '+34 600 201 001',
    '2019-03-12', 72000, 68000, '2025-01-15',
    '{"resume":{"fileName":"maria_garcia_cv.pdf","uploadedAt":"2019-03-10"},"contract":{"fileName":"contract_mgarcia_2024.pdf","uploadedAt":"2024-01-08"},"shareOptions":{"fileName":"share_options_mgarcia_2023.pdf","uploadedAt":"2023-06-01"}}'::jsonb
  ),
  (
    'hr-2', 'Carlos Mendoza', 'carlos.mendoza@barcelonadronecenter.com', '+34 600 201 002',
    '2020-06-01', 58000, 54000, '2025-01-15',
    '{"resume":{"fileName":"carlos_mendoza_cv.pdf","uploadedAt":"2020-05-28"},"contract":{"fileName":"contract_cmendoza_2024.pdf","uploadedAt":"2024-01-08"},"shareOptions":{"fileName":"share_options_cmendoza_2024.pdf","uploadedAt":"2024-03-15"}}'::jsonb
  ),
  (
    'hr-3', 'Elena Ruiz', 'elena.ruiz@barcelonadronecenter.com', '+34 600 201 003',
    '2021-01-18', 52000, 48000, '2024-07-01',
    '{"resume":{"fileName":"elena_ruiz_cv.pdf","uploadedAt":"2021-01-12"},"contract":{"fileName":"contract_eruiz_2024.pdf","uploadedAt":"2024-01-08"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-4', 'Jordi Vila', 'jordi.vila@barcelonadronecenter.com', '+34 600 201 004',
    '2021-09-06', 49000, 46000, '2024-07-01',
    '{"resume":{"fileName":"jordi_vila_cv.pdf","uploadedAt":"2021-09-01"},"contract":{"fileName":"contract_jvila_2023.pdf","uploadedAt":"2023-09-06"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-5', 'Ana Torres', 'ana.torres@barcelonadronecenter.com', '+34 600 201 005',
    '2022-02-14', 55000, 51000, '2025-01-15',
    '{"resume":{"fileName":"ana_torres_cv.pdf","uploadedAt":"2022-02-10"},"contract":{"fileName":"contract_atorres_2024.pdf","uploadedAt":"2024-01-08"},"shareOptions":{"fileName":"share_options_atorres_2025.pdf","uploadedAt":"2025-01-20"}}'::jsonb
  ),
  (
    'hr-6', 'Pablo Serrano', 'pablo.serrano@barcelonadronecenter.com', '+34 600 201 006',
    '2022-05-03', 42000, 40000, '2024-07-01',
    '{"resume":{"fileName":"pablo_serrano_cv.pdf","uploadedAt":"2022-04-28"},"contract":{"fileName":"contract_pserrano_2024.pdf","uploadedAt":"2024-05-03"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-7', 'Lucía Fernández', 'lucia.fernandez@barcelonadronecenter.com', '+34 600 201 007',
    '2022-08-22', 44000, 42000, '2024-07-01',
    '{"resume":{"fileName":"lucia_fernandez_cv.pdf","uploadedAt":"2022-08-18"},"contract":{"fileName":"contract_lfernandez_2024.pdf","uploadedAt":"2024-08-22"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-8', 'Miguel Santos', 'miguel.santos@barcelonadronecenter.com', '+34 600 201 008',
    '2023-01-09', 38000, 36000, '2024-07-01',
    '{"resume":{"fileName":"miguel_santos_cv.pdf","uploadedAt":"2023-01-05"},"contract":{"fileName":"contract_msantos_2023.pdf","uploadedAt":"2023-01-09"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-9', 'Sofía Costa', 'sofia.costa@barcelonadronecenter.com', '+34 600 201 009',
    '2023-04-17', 41000, 39000, '2024-07-01',
    '{"resume":{"fileName":"sofia_costa_cv.pdf","uploadedAt":"2023-04-12"},"contract":{"fileName":"contract_scosta_2024.pdf","uploadedAt":"2024-04-17"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-10', 'David Llorens', 'david.llorens@barcelonadronecenter.com', '+34 600 201 010',
    '2023-07-24', 47000, 45000, '2025-01-15',
    '{"resume":{"fileName":"david_llorens_cv.pdf","uploadedAt":"2023-07-20"},"contract":{"fileName":"contract_dllorens_2024.pdf","uploadedAt":"2024-07-24"},"shareOptions":{"fileName":"share_options_dllorens_2025.pdf","uploadedAt":"2025-02-01"}}'::jsonb
  ),
  (
    'hr-11', 'Carmen Ibáñez', 'carmen.ibanez@barcelonadronecenter.com', '+34 600 201 011',
    '2024-01-15', 43000, 43000, null,
    '{"resume":{"fileName":"carmen_ibanez_cv.pdf","uploadedAt":"2024-01-10"},"contract":{"fileName":"contract_cibanez_2024.pdf","uploadedAt":"2024-01-15"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-12', 'Hugo Navarro', 'hugo.navarro@barcelonadronecenter.com', '+34 600 201 012',
    '2024-06-03', 36000, 36000, null,
    '{"resume":{"fileName":"hugo_navarro_cv.pdf","uploadedAt":"2024-05-28"},"contract":{"fileName":"contract_hnavarro_2024.pdf","uploadedAt":"2024-06-03"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  ),
  (
    'hr-13', 'Isabel Ramos', 'isabel.ramos@barcelonadronecenter.com', '+34 600 201 013',
    '2024-09-16', 40000, 40000, null,
    '{"resume":{"fileName":"isabel_ramos_cv.pdf","uploadedAt":"2024-09-10"},"contract":{"fileName":"contract_iramos_2024.pdf","uploadedAt":"2024-09-16"},"shareOptions":{"fileName":null,"uploadedAt":null}}'::jsonb
  )
on conflict (id) do nothing;
