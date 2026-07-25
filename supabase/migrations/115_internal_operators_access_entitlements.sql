-- Access tier expansion + per-user module/dashboard entitlements

alter table public.internal_operators
  add column if not exists department text not null default 'Corporate';

alter table public.internal_operators
  add column if not exists allowed_views jsonb;

alter table public.internal_operators
  add column if not exists dashboard_prefs jsonb;

-- Migrate legacy role labels to access tiers
update public.internal_operators
set role = case
  when role in ('Staff', 'Drone Operator') then 'Associate'
  when role in ('Senior Drone Operator', 'Survey Lead') then 'Manager'
  when role in ('Mission Coordinator') then 'Admin'
  when role = 'Staff' then 'Associate'
  else role
end
where role in (
  'Staff',
  'Drone Operator',
  'Senior Drone Operator',
  'Survey Lead',
  'Mission Coordinator'
);

update public.internal_operators
set department = coalesce(nullif(trim(department), ''), 'Corporate')
where department is null or trim(department) = '';
