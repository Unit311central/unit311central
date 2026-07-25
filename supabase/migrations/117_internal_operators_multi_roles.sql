-- Multi-role support for internal operators

alter table public.internal_operators
  add column if not exists roles jsonb;

-- Backfill from single role column
update public.internal_operators
set roles = jsonb_build_array(role)
where roles is null and role is not null and trim(role) <> '';

update public.internal_operators
set roles = '["Associate"]'::jsonb
where roles is null;
