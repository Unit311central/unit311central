-- Dual permanent workspaces: ensure Demo company + idempotent config foundation.
-- Does NOT copy business data (clients, invoices, employees, messages, etc.).

---------------------------------------------------------
-- 1) Ensure Demo workspace identity
---------------------------------------------------------
insert into public.workspaces (name, slug, workspace_type, status)
select 'Unit311 Central Demo', 'demo', 'Internal', 'Active'
where not exists (
  select 1 from public.workspaces where slug = 'demo'
);

update public.workspaces
set
  name = 'Unit311 Central Demo',
  workspace_type = coalesce(nullif(workspace_type, ''), 'Internal'),
  status = coalesce(nullif(status, ''), 'Active'),
  updated_at = now()
where slug = 'demo'
  and (
    name is distinct from 'Unit311 Central Demo'
    or workspace_type is distinct from 'Internal'
  );

---------------------------------------------------------
-- 2) ensure_workspace_foundation(): clone config only from unit311
---------------------------------------------------------
create or replace function public.ensure_workspace_foundation(
  p_workspace_id uuid,
  p_source_slug text default 'unit311'
)
returns uuid
language plpgsql
as $$
declare
  v_source_workspace_id uuid;
  v_enabled_module_count integer;
begin
  if p_workspace_id is null then
    raise exception 'ensure_workspace_foundation: workspace_id is required';
  end if;

  select w.id
  into v_source_workspace_id
  from public.workspaces w
  where w.slug = lower(trim(p_source_slug))
  limit 1;

  if v_source_workspace_id is null then
    raise exception
      'ensure_workspace_foundation: source workspace slug % not found',
      p_source_slug;
  end if;

  if v_source_workspace_id = p_workspace_id then
    return p_workspace_id;
  end if;

  -- Settings (insert only when missing — never overwrite live Demo branding edits)
  insert into public.workspace_settings (
    workspace_id,
    timezone,
    currency,
    language,
    date_format,
    time_format,
    logo_url,
    primary_colour,
    secondary_colour
  )
  select
    p_workspace_id,
    coalesce(s.timezone, 'Europe/London'),
    coalesce(s.currency, 'USD'),
    coalesce(s.language, 'en-GB'),
    coalesce(s.date_format, 'DD/MM/YYYY'),
    coalesce(s.time_format, '24h'),
    null,
    coalesce(s.primary_colour, '#0b2d63'),
    coalesce(s.secondary_colour, '#2563eb')
  from (select 1) as _
  left join public.workspace_settings s
    on s.workspace_id = v_source_workspace_id
  where not exists (
    select 1 from public.workspace_settings existing
    where existing.workspace_id = p_workspace_id
  );

  -- Modules: copy enabled keys from source when Demo has none yet;
  -- otherwise fill any missing keys as enabled (do not disable existing).
  insert into public.workspace_modules (workspace_id, module_key, enabled)
  select
    p_workspace_id,
    m.module_key,
    true
  from public.workspace_modules m
  where m.workspace_id = v_source_workspace_id
    and m.enabled = true
    and not exists (
      select 1
      from public.workspace_modules existing
      where existing.workspace_id = p_workspace_id
        and existing.module_key = m.module_key
    );

  get diagnostics v_enabled_module_count = row_count;

  -- Fallback module catalogue if Internal has no rows yet
  if v_enabled_module_count = 0
     and not exists (
       select 1 from public.workspace_modules where workspace_id = p_workspace_id
     )
  then
    insert into public.workspace_modules (workspace_id, module_key, enabled)
    select p_workspace_id, m.module_key, true
    from (
      values
        ('clients'),
        ('crm'),
        ('projects'),
        ('financials'),
        ('quality-management'),
        ('hr'),
        ('assets-inventory'),
        ('file-explorer'),
        ('email-calendar-messaging'),
        ('executive-assistant'),
        ('logistics'),
        ('social'),
        ('careers'),
        ('support'),
        ('engineering-rnd'),
        ('strategy'),
        ('training'),
        ('users'),
        ('testing'),
        ('website-management'),
        ('profiles')
    ) as m(module_key)
    where not exists (
      select 1
      from public.workspace_modules existing
      where existing.workspace_id = p_workspace_id
        and existing.module_key = m.module_key
    );
  end if;

  -- Empty file categories (structural only) when target has none
  if not exists (
    select 1 from public.file_categories where workspace_id = p_workspace_id
  ) then
    insert into public.file_categories (name, color, workspace_id)
    select c.name, c.color, p_workspace_id
    from public.file_categories c
    where c.workspace_id = v_source_workspace_id
    order by c.name;
  end if;

  if not exists (
    select 1 from public.file_folders where workspace_id = p_workspace_id
  ) then
    insert into public.file_folders (
      name,
      parent_id,
      category_id,
      external_scope,
      workspace_id
    )
    values
      ('External Files', null, null, true, p_workspace_id),
      ('Client Invoices', null, null, false, p_workspace_id);
  end if;

  return p_workspace_id;
end;
$$;

comment on function public.ensure_workspace_foundation(uuid, text) is
  'Clone application configuration (settings, modules, empty file structure) from a source workspace. Never copies business records.';

---------------------------------------------------------
-- 3) ensure_demo_workspace(): idempotent Demo provisioner
---------------------------------------------------------
create or replace function public.ensure_demo_workspace()
returns uuid
language plpgsql
as $$
declare
  v_demo_id uuid;
begin
  insert into public.workspaces (name, slug, workspace_type, status)
  select 'Unit311 Central Demo', 'demo', 'Internal', 'Active'
  where not exists (select 1 from public.workspaces where slug = 'demo');

  update public.workspaces
  set
    name = 'Unit311 Central Demo',
    updated_at = now()
  where slug = 'demo'
    and name is distinct from 'Unit311 Central Demo';

  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;

  perform public.ensure_workspace_foundation(v_demo_id, 'unit311');

  insert into public.workspace_audit_log (
    workspace_id,
    event_type,
    entity_type,
    entity_id,
    description
  )
  values (
    v_demo_id,
    'workspace_ensured',
    'workspace',
    v_demo_id,
    'Demo workspace configuration ensured from unit311 (config only; no business data).'
  );

  return v_demo_id;
end;
$$;

comment on function public.ensure_demo_workspace() is
  'Idempotent Demo workspace ensure: Unit311 Central Demo + config clone from unit311. No business data.';

select public.ensure_demo_workspace();

---------------------------------------------------------
-- 4) provision_workspace: reserved slug demo → ensure, not fail
---------------------------------------------------------
create or replace function public.provision_workspace(
  company_name text,
  workspace_slug text
)
returns uuid
language plpgsql
as $$
declare
  v_company_name text;
  v_workspace_slug text;
  v_source_workspace_id uuid;
  v_new_workspace_id uuid;
  v_enabled_module_count integer;
  v_existing_id uuid;
begin
  v_company_name := nullif(trim(company_name), '');
  v_workspace_slug := nullif(lower(trim(workspace_slug)), '');

  if v_company_name is null then
    raise exception 'provision_workspace: company_name is required';
  end if;

  if v_workspace_slug is null then
    raise exception 'provision_workspace: workspace_slug is required';
  end if;

  if v_workspace_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception
      'provision_workspace: workspace_slug must be lowercase alphanumeric with optional hyphens (got %)',
      workspace_slug;
  end if;

  -- Reserved Demo slug: ensure foundation instead of failing on exists.
  if v_workspace_slug = 'demo' then
    return public.ensure_demo_workspace();
  end if;

  select w.id into v_existing_id
  from public.workspaces w
  where w.slug = v_workspace_slug
  limit 1;

  if v_existing_id is not null then
    raise exception
      'provision_workspace: workspace_slug already exists (got %)',
      workspace_slug;
  end if;

  select w.id
  into v_source_workspace_id
  from public.workspaces w
  where w.slug = 'unit311'
  limit 1;

  if v_source_workspace_id is null then
    raise exception
      'provision_workspace: Unit311 Central workspace (slug=unit311) not found';
  end if;

  insert into public.workspaces (name, slug, workspace_type, status)
  values (v_company_name, v_workspace_slug, 'Customer', 'Active')
  returning id into v_new_workspace_id;

  perform public.ensure_workspace_foundation(v_new_workspace_id, 'unit311');

  insert into public.workspace_audit_log (
    workspace_id,
    event_type,
    entity_type,
    entity_id,
    description
  )
  values (
    v_new_workspace_id,
    'workspace_created',
    'workspace',
    v_new_workspace_id,
    format(
      'Workspace provisioned for company "%s" with slug "%s".',
      v_company_name,
      v_workspace_slug
    )
  );

  return v_new_workspace_id;
end;
$$;

comment on function public.provision_workspace(text, text) is
  'Transactional workspace provisioning from unit311 config. Reserved slug demo is idempotent ensure. Never copies business records.';

---------------------------------------------------------
-- 5) Demo Owner login (hashed password only)
-- username/email: demo@unit311central.com
-- password hashed with hashPlatformPasswordForUser (scrypt)
---------------------------------------------------------
do $$
declare
  v_demo_id uuid;
  v_user_id uuid;
  v_username text := 'demo@unit311central.com';
  v_password_hash text := 'demo@unit311central.com-salt-v1:16cb06600c6e28ea97e23fb311c0f5618bc082a451306265c523cfb5c8c953c5bdb503d4efe1abaa374943ef939aed34c23effe62af76407bf8fc8b2739708cc';
  v_operator_id text := 'user-demo-owner';
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise exception 'Demo workspace missing after ensure_demo_workspace()';
  end if;

  -- Prefer existing user by email or username
  select id into v_user_id
  from public.platform_users
  where lower(username) = v_username
     or lower(coalesce(email, '')) = v_username
  order by created_at asc
  limit 1;

  if v_user_id is null then
    insert into public.platform_users (
      username,
      display_name,
      email,
      password_hash,
      user_type,
      redirect_path,
      client_name,
      is_active,
      workspace_id,
      updated_at
    )
    values (
      v_username,
      'Demo Owner',
      v_username,
      v_password_hash,
      'internal',
      '/',
      null,
      true,
      v_demo_id,
      now()
    )
    returning id into v_user_id;
  else
    update public.platform_users
    set
      username = v_username,
      display_name = coalesce(nullif(display_name, ''), 'Demo Owner'),
      email = v_username,
      password_hash = v_password_hash,
      user_type = 'internal',
      is_active = true,
      workspace_id = v_demo_id,
      redirect_path = coalesce(nullif(redirect_path, ''), '/'),
      updated_at = now()
    where id = v_user_id;
  end if;

  insert into public.workspace_users (
    workspace_id,
    user_id,
    role,
    is_owner
  )
  select v_demo_id, v_user_id, 'owner', true
  where not exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = v_demo_id
      and wu.user_id = v_user_id
  );

  update public.workspace_users
  set
    role = 'owner',
    is_owner = true,
    updated_at = now()
  where workspace_id = v_demo_id
    and user_id = v_user_id;

  -- Ops entitlements (shared operator model; unrestricted views)
  if to_regclass('public.internal_operators') is not null then
    insert into public.internal_operators (
      id,
      operator_label,
      full_name,
      username,
      email,
      role,
      roles,
      status,
      region,
      department,
      departments,
      allowed_views,
      notes,
      created_at,
      updated_at
    )
    select
      v_operator_id,
      'Demo',
      'Demo Owner',
      v_username,
      v_username,
      'Admin',
      '["Admin"]'::jsonb,
      'Active',
      'Multi-site',
      'Corporate',
      '["Corporate"]'::jsonb,
      null,
      'Demo workspace Owner — presentations and testing only. Primary workspace is demo.',
      now(),
      now()
    where not exists (
      select 1 from public.internal_operators o
      where o.id = v_operator_id
         or lower(o.username) = v_username
         or lower(coalesce(o.email, '')) = v_username
    );

    update public.internal_operators
    set
      full_name = 'Demo Owner',
      username = v_username,
      email = v_username,
      role = 'Admin',
      roles = '["Admin"]'::jsonb,
      status = 'Active',
      department = 'Corporate',
      departments = '["Corporate"]'::jsonb,
      allowed_views = null,
      notes = 'Demo workspace Owner — presentations and testing only. Primary workspace is demo.',
      updated_at = now()
    where id = v_operator_id
       or lower(username) = v_username
       or lower(coalesce(email, '')) = v_username;
  end if;
end $$;
