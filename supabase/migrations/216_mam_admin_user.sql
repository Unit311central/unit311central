-- MAM workspace administrator — full catalogue access.
-- Login: admin@mam.me (password set via provision script / migration hash).

DO $$
DECLARE
  v_mam_id uuid;
  v_user_id uuid;
  v_password_hash text := 'admin@mam.me-salt-v1:587fd787b7c784d1bc6e3c4391fb69a609ed14cc5ae62ce3e5f0aa7d65c6f29eba64aa90d17e25826aa161c05cedc2bd7c006f9f3b9e5e64c06a80f75f54115f';
  v_roles jsonb := '["Board","Exec","Manager","Associate","Admin"]'::jsonb;
  v_departments jsonb := '["Board","Exec","Manager","Engineering","Sales","Finance","Operations","HR","Corporate","Technology"]'::jsonb;
  v_enabled_modules jsonb := '[
    "home","executive-assistant","intelligence","business-central","sales-management","financials",
    "fundraising","board","corporate-information","operations","marketing-events","technology-management",
    "human-resources","business-productivity","support-desk","project-management","engineering","training",
    "qms","tools","external-client-access","settings"
  ]'::jsonb;
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_mam_id FROM public.workspaces WHERE slug = 'mam' LIMIT 1;
  IF v_mam_id IS NULL THEN
    RAISE NOTICE '216_mam_admin_user: mam workspace missing — skipped';
    RETURN;
  END IF;

  UPDATE public.workspace_admin_metadata
  SET
    contact_email = 'admin@mam.me',
    contact_name = 'MAM Administrator',
    enabled_modules = v_enabled_modules,
    updated_at = v_now
  WHERE workspace_id = v_mam_id;

  SELECT id INTO v_user_id
  FROM public.platform_users
  WHERE lower(username) = 'admin@mam.me' OR lower(email) = 'admin@mam.me'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO public.platform_users (
      id, workspace_id, username, email, display_name, user_type, is_active,
      password_hash, redirect_path, client_name, email_verified_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_mam_id, 'admin@mam.me', 'admin@mam.me', 'MAM Administrator', 'internal', true,
      v_password_hash, '/dashboard', 'Moroccan Advanced Manufacturing', v_now, v_now, v_now
    );
    RAISE NOTICE '216_mam_admin_user: created admin@mam.me';
  ELSE
    UPDATE public.platform_users SET
      workspace_id = v_mam_id,
      username = 'admin@mam.me',
      email = 'admin@mam.me',
      password_hash = v_password_hash,
      display_name = 'MAM Administrator',
      user_type = 'internal',
      is_active = true,
      email_verified_at = COALESCE(email_verified_at, v_now),
      redirect_path = '/dashboard',
      client_name = 'Moroccan Advanced Manufacturing',
      updated_at = v_now
    WHERE id = v_user_id;
    RAISE NOTICE '216_mam_admin_user: updated admin@mam.me';
  END IF;

  INSERT INTO public.workspace_users (workspace_id, user_id, role, is_owner, created_at, updated_at)
  SELECT v_mam_id, v_user_id, 'admin', true, v_now, v_now
  WHERE NOT EXISTS (
    SELECT 1 FROM public.workspace_users wu
    WHERE wu.workspace_id = v_mam_id AND wu.user_id = v_user_id
  );

  UPDATE public.workspace_users
  SET role = 'admin', is_owner = true, updated_at = v_now
  WHERE workspace_id = v_mam_id AND user_id = v_user_id;

  INSERT INTO public.internal_operators (
    id, operator_label, full_name, username, email, phone, role, roles, department, departments,
    status, region, license_id, notes, allowed_views, dashboard_prefs, created_at, updated_at
  ) VALUES (
    v_user_id::text, 'MAM Admin', 'MAM Administrator', 'admin@mam.me', 'admin@mam.me', null,
    'Admin', v_roles, 'Corporate', v_departments, 'Active', 'Morocco', null,
    'MAM full-access administrator', null,
    jsonb_build_object('homeTiles', jsonb_build_array('executive-brief', 'financial', 'commercial', 'projects', 'operations')),
    v_now, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    operator_label = EXCLUDED.operator_label,
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    role = 'Admin',
    roles = v_roles,
    department = 'Corporate',
    departments = v_departments,
    status = 'Active',
    allowed_views = null,
    updated_at = v_now;
END $$;
