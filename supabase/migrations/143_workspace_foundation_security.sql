-- Phase 1 (step 2): Secure workspace foundation tables + seed canonical membership.
-- RLS: deny-all for anon/authenticated; server uses service_role (bypasses RLS).
-- workspace_users becomes the authoritative workspace membership table (backfilled from platform_users).

comment on table public.workspace_users is
  'Canonical workspace membership. Authoritative for tenant access after Supabase Phase 1. '
  'platform_users.workspace_id remains for primary-workspace compatibility during transition.';

-- ---------------------------------------------------------------------------
-- Backfill workspace_users from platform_users (idempotent)
-- ---------------------------------------------------------------------------
insert into public.workspace_users (workspace_id, user_id, role, is_owner)
select distinct
  pu.workspace_id,
  pu.id,
  case
    when lower(coalesce(pu.user_type, '')) = 'internal' then 'member'
    else 'member'
  end,
  false
from public.platform_users pu
where pu.workspace_id is not null
  and coalesce(pu.is_active, true)
  and not exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = pu.workspace_id
      and wu.user_id = pu.id
  );

-- Preserve demo owner flag when provision_workspace already set it.
update public.workspace_users wu
set
  role = 'owner',
  is_owner = true,
  updated_at = now()
from public.platform_users pu
join public.workspaces w on w.id = pu.workspace_id
where wu.workspace_id = pu.workspace_id
  and wu.user_id = pu.id
  and w.slug = 'demo'
  and lower(coalesce(pu.username, '')) like '%demo%'
  and wu.is_owner is distinct from true;

-- ---------------------------------------------------------------------------
-- Enable RLS + deny-all on foundation tables
-- ---------------------------------------------------------------------------
alter table public.workspaces enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.workspace_modules enable row level security;
alter table public.workspace_users enable row level security;
alter table public.workspace_audit_log enable row level security;

drop policy if exists workspaces_deny_all on public.workspaces;
create policy workspaces_deny_all on public.workspaces for all using (false);

drop policy if exists workspace_settings_deny_all on public.workspace_settings;
create policy workspace_settings_deny_all on public.workspace_settings for all using (false);

drop policy if exists workspace_modules_deny_all on public.workspace_modules;
create policy workspace_modules_deny_all on public.workspace_modules for all using (false);

drop policy if exists workspace_users_deny_all on public.workspace_users;
create policy workspace_users_deny_all on public.workspace_users for all using (false);

drop policy if exists workspace_audit_log_deny_all on public.workspace_audit_log;
create policy workspace_audit_log_deny_all on public.workspace_audit_log for all using (false);

-- Audit entry for this migration (service-role writes only after RLS).
insert into public.workspace_audit_log (
  workspace_id,
  event_type,
  entity_type,
  description
)
select
  w.id,
  'phase1_foundation_secured',
  'workspace',
  'Supabase Phase 1: foundation RLS enabled; workspace_users backfilled from platform_users.'
from public.workspaces w
where w.slug = 'unit311'
  and not exists (
    select 1
    from public.workspace_audit_log a
    where a.workspace_id = w.id
      and a.event_type = 'phase1_foundation_secured'
  );
