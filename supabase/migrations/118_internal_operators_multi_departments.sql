-- Multi-department support for internal operators

alter table public.internal_operators
  add column if not exists departments jsonb;

update public.internal_operators
set departments = jsonb_build_array(department)
where departments is null and department is not null and trim(department) <> '';

update public.internal_operators
set departments = '["Corporate"]'::jsonb
where departments is null;
