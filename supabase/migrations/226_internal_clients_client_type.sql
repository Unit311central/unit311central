-- Client Directory classification for internal.unit311central.com.
-- Additive column on the existing public.internal_clients table.
-- Existing rows, ids, foreign keys, and other columns are preserved.
-- Existing clients are classified as unit311central.
-- The default covers Unit311Central writers outside this directory
-- (CRM conversion, signup, sales) that do not send client_type.
-- Client Directory creates must send an explicit value; the API rejects omission.

alter table public.internal_clients
  add column if not exists client_type text;

update public.internal_clients
set client_type = 'unit311central'
where client_type is null;

alter table public.internal_clients
  alter column client_type set default 'unit311central';

alter table public.internal_clients
  alter column client_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'internal_clients_client_type_check'
      and conrelid = 'public.internal_clients'::regclass
  ) then
    alter table public.internal_clients
      add constraint internal_clients_client_type_check
      check (client_type in ('unit311central', 'wolf'));
  end if;
end $$;
