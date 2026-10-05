-- Stage 1: canonical optional Employee → Platform User link on hr_employees.platform_user_id.
-- Additive / safe: invalid or orphan text values are nulled before type conversion (logged via comment).
-- Does NOT delete employees or platform users. ON DELETE SET NULL preserves HR when login is removed.

comment on column public.hr_employees.platform_user_id is
  'Optional link to public.platform_users.id for this workspace employee. '
  'NULL = employee has no platform login. Canonical 1:1 per workspace when set.';

comment on column public.hr_employees.operator_id is
  'Legacy link to internal_operators.id for Unit311 internal messaging entitlements. '
  'Not the canonical tenant Employee ↔ Platform User relationship.';

-- Null non-UUID and dangling references before FK (explicit data hygiene, not silent app-side).
update public.hr_employees e
set platform_user_id = null,
    updated_at = now()
where e.platform_user_id is not null
  and (
    e.platform_user_id !~* '^[0-9a-f-]{36}$'
    or not exists (
      select 1 from public.platform_users pu
      where pu.id::text = e.platform_user_id
    )
  );

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hr_employees'
      and column_name = 'platform_user_id'
      and data_type = 'text'
  ) then
    alter table public.hr_employees
      alter column platform_user_id type uuid
      using platform_user_id::uuid;
  end if;
end $$;

alter table public.hr_employees
  drop constraint if exists hr_employees_platform_user_id_fkey;

alter table public.hr_employees
  add constraint hr_employees_platform_user_id_fkey
  foreign key (platform_user_id)
  references public.platform_users (id)
  on delete set null;

create unique index if not exists hr_employees_workspace_platform_user_uidx
  on public.hr_employees (workspace_id, platform_user_id)
  where platform_user_id is not null;

create index if not exists hr_employees_platform_user_id_idx
  on public.hr_employees (platform_user_id)
  where platform_user_id is not null;
