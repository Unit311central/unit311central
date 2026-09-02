-- WOLF Central: enable central catalogue modules (fresh — no legacy data import)
-- and provision bcn@wolf.unit311central.com with full admin access.
-- Idempotent.

do $$
declare
  v_wolf_id uuid;
  v_user_id uuid;
  v_password_hash text := 'bcn@wolf.unit311central.com-salt-v1:e2b91022a08cc845f20feac14782d696413ff77c604e72ac84cd630b44d77a7f7e97b6a4604cfdd5ec37eec1de15158b04a2343c8b912672f5ab92331b5260e5';
  v_roles jsonb := '["Board","Exec","Manager","Associate","Admin"]'::jsonb;
  v_departments jsonb := '["Board","Exec","Manager","Engineering","Sales","Finance","Operations","HR","Corporate","Technology"]'::jsonb;
  v_enabled_modules jsonb := '[
    "home","wolf-animals","wolf-containment","wolf-environment","wolf-drone-operations",
    "wolf-fleet","wolf-tools","executive-assistant","business-productivity","support-desk",
    "operations","training","project-management","tools","settings"
  ]'::jsonb;
  v_enabled_sub_modules jsonb := '[
    "business-productivity:calendar","business-productivity:communications",
    "business-productivity:content-studio","business-productivity:files-external",
    "business-productivity:files-internal","business-productivity:internal-work-packages",
    "business-productivity:messaging","business-productivity:productivity-dashboard",
    "business-productivity:whiteboard","executive-assistant:executive-assistant",
    "home:home","home:wolf-estate","home:wolf-safari-parks","operations:assets",
    "operations:inventory-management","operations:logistics","operations:operations-dashboard",
    "operations:procurement","project-management:projects-dashboard",
    "project-management:projects-external","project-management:projects-internal",
    "settings:appearance","settings:billing","settings:profile","settings:settings",
    "support-desk:support","support-desk:support-mine","support-desk:support-overview",
    "support-desk:whatsapp-integration","tools:users","training:course-builder",
    "training:qms-training","training:training","training:training-dashboard",
    "training:training-external","wolf-animals:wolf-animals","wolf-containment:wolf-containment",
    "wolf-drone-operations:wolf-drone-operations","wolf-environment:wolf-environment",
    "wolf-fleet:wolf-fleet","wolf-tools:wolf-ai-wildlife-vision"
  ]'::jsonb;
  v_module_key text;
  v_module_keys text[] := array[
    'assets-inventory','email-calendar-messaging','executive-assistant','file-explorer',
    'logistics','profiles','projects','strategy','support','training','users',
    'wolf-animals','wolf-containment','wolf-drone-operations','wolf-environment','wolf-fleet'
  ];
  v_now timestamptz := now();
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '195_wolf_central_modules_and_bcn_admin: wolf-central workspace missing — skipped';
    return;
  end if;

  insert into public.workspace_admin_metadata (
    workspace_id,
    company_name,
    contact_name,
    contact_email,
    country,
    description,
    branding_display_name,
    enabled_modules,
    enabled_sub_modules,
    pending_employees,
    pending_clients,
    created_by,
    created_at,
    updated_at
  ) values (
    v_wolf_id,
    'WOLF Central',
    'WOLF Administrator',
    'admin@wolf.unit311central.com',
    'South Africa',
    'WOLF Central estate management platform.',
    'WOLF Central',
    v_enabled_modules,
    v_enabled_sub_modules,
    '[]'::jsonb,
    '[]'::jsonb,
    'migration-195',
    v_now,
    v_now
  )
  on conflict (workspace_id) do update set
    enabled_modules = v_enabled_modules,
    enabled_sub_modules = v_enabled_sub_modules,
    updated_at = v_now;

  foreach v_module_key in array v_module_keys loop
    insert into public.workspace_modules (workspace_id, module_key, enabled, created_at, updated_at)
    values (v_wolf_id, v_module_key, true, v_now, v_now)
    on conflict (workspace_id, module_key) do update set
      enabled = true,
      updated_at = v_now;
  end loop;

  select id into v_user_id
  from public.platform_users
  where workspace_id = v_wolf_id and lower(username) = 'bcn@wolf.unit311central.com'
  limit 1;

  if v_user_id is null then
    select id into v_user_id
    from public.platform_users
    where lower(username) = 'bcn@wolf.unit311central.com'
    limit 1;
  end if;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into public.platform_users (
      id, workspace_id, username, email, display_name, user_type, is_active,
      password_hash, redirect_path, client_name, email_verified_at, created_at, updated_at
    ) values (
      v_user_id,
      v_wolf_id,
      'bcn@wolf.unit311central.com',
      'bcn@wolf.unit311central.com',
      'WOLF BCN Administrator',
      'internal',
      true,
      v_password_hash,
      '/dashboard',
      'WOLF Central',
      v_now,
      v_now,
      v_now
    );
    raise notice '195_wolf_central_modules_and_bcn_admin: created bcn@wolf.unit311central.com';
  else
    update public.platform_users
    set
      workspace_id = v_wolf_id,
      password_hash = v_password_hash,
      display_name = 'WOLF BCN Administrator',
      user_type = 'internal',
      is_active = true,
      email = 'bcn@wolf.unit311central.com',
      email_verified_at = coalesce(email_verified_at, v_now),
      redirect_path = '/dashboard',
      client_name = 'WOLF Central',
      updated_at = v_now
    where id = v_user_id;
    raise notice '195_wolf_central_modules_and_bcn_admin: updated bcn@wolf.unit311central.com';
  end if;

  insert into public.workspace_users (workspace_id, user_id, role, is_owner, created_at, updated_at)
  select v_wolf_id, v_user_id, 'admin', false, v_now, v_now
  where not exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = v_wolf_id
      and wu.user_id = v_user_id
  );

  update public.workspace_users
  set role = 'admin', is_owner = false, updated_at = v_now
  where workspace_id = v_wolf_id
    and user_id = v_user_id;

  insert into public.internal_operators (
    id, operator_label, full_name, username, email, phone, role, roles, department, departments,
    status, region, license_id, notes, allowed_views, dashboard_prefs, created_at, updated_at
  ) values (
    v_user_id::text,
    'BCN Admin',
    'WOLF BCN Administrator',
    'bcn@wolf.unit311central.com',
    'bcn@wolf.unit311central.com',
    null,
    'Admin',
    v_roles,
    'Corporate',
    v_departments,
    'Active',
    '',
    null,
    'WOLF Central full-access administrator',
    null,
    jsonb_build_object(
      'homeTiles',
      jsonb_build_array(
        'executive-brief', 'financial', 'commercial', 'projects', 'operations', 'risks'
      )
    ),
    v_now,
    v_now
  )
  on conflict (id) do update set
    operator_label = excluded.operator_label,
    full_name = excluded.full_name,
    username = excluded.username,
    email = excluded.email,
    role = 'Admin',
    roles = v_roles,
    department = 'Corporate',
    departments = v_departments,
    status = 'Active',
    allowed_views = null,
    dashboard_prefs = excluded.dashboard_prefs,
    notes = excluded.notes,
    updated_at = v_now;
end $$;
