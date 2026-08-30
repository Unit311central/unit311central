-- OmniTransit (SAEC): ensure demo@omnitransit.com has full admin + all roles/departments.
-- Password hash is for SouthAfrica1999$ (demo@omnitransit.com-salt-v1 scrypt).
-- Idempotent.

do $$
declare
  v_saec_id uuid;
  v_user_id uuid;
  v_password_hash text := 'demo@omnitransit.com-salt-v1:51ff58e1fff6000d8d91c0aa5b7136f9fb85e6a7d2d223c9c33f4f80a6c0faa15b28d80a709b93cb00a78e6abd3459f159957e8b1817bf5a102d977867da42e0';
  v_roles jsonb := '["Board","Exec","Manager","Associate","Admin"]'::jsonb;
  v_departments jsonb := '["Board","Exec","Manager","Engineering","Sales","Finance","Operations","HR","Corporate","Technology"]'::jsonb;
  v_now timestamptz := now();
begin
  select id into v_saec_id from public.workspaces where slug = 'saec' limit 1;
  if v_saec_id is null then
    raise notice '184_saec_demo_omnitransit_full_access: saec workspace missing — skipped';
    return;
  end if;

  select id into v_user_id
  from public.platform_users
  where workspace_id = v_saec_id and lower(username) = 'demo@omnitransit.com'
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into public.platform_users (
      id, workspace_id, username, email, display_name, user_type, is_active,
      password_hash, redirect_path, client_name, email_verified_at, created_at, updated_at
    ) values (
      v_user_id,
      v_saec_id,
      'demo@omnitransit.com',
      'demo@omnitransit.com',
      'OmniTransit Demo',
      'internal',
      true,
      v_password_hash,
      '/dashboard',
      'OmniTransit',
      v_now,
      v_now,
      v_now
    );
    raise notice '184_saec_demo_omnitransit_full_access: created demo@omnitransit.com';
  else
    update public.platform_users
    set
      password_hash = v_password_hash,
      display_name = 'OmniTransit Demo',
      user_type = 'internal',
      is_active = true,
      email = 'demo@omnitransit.com',
      email_verified_at = coalesce(email_verified_at, v_now),
      redirect_path = '/dashboard',
      client_name = 'OmniTransit',
      updated_at = v_now
    where id = v_user_id;
    raise notice '184_saec_demo_omnitransit_full_access: updated demo@omnitransit.com';
  end if;

  insert into public.workspace_users (workspace_id, user_id, role, is_owner, created_at, updated_at)
  select v_saec_id, v_user_id, 'admin', false, v_now, v_now
  where not exists (
    select 1
    from public.workspace_users wu
    where wu.workspace_id = v_saec_id
      and wu.user_id = v_user_id
  );

  update public.workspace_users
  set role = 'admin', is_owner = false, updated_at = v_now
  where workspace_id = v_saec_id
    and user_id = v_user_id;

  insert into public.internal_operators (
    id, operator_label, full_name, username, email, phone, role, roles, department, departments,
    status, region, license_id, notes, allowed_views, dashboard_prefs, created_at, updated_at
  ) values (
    v_user_id::text,
    'OmniTransit Demo',
    'OmniTransit Demo',
    'demo@omnitransit.com',
    'demo@omnitransit.com',
    null,
    'Admin',
    v_roles,
    'Corporate',
    v_departments,
    'Active',
    '',
    null,
    'SAEC client demonstration · OmniTransit',
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
