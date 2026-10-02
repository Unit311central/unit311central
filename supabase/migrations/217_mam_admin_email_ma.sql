-- Rename MAM admin login from admin@mam.me to admin@mam.ma (Morocco TLD).

DO $$
DECLARE
  v_mam_id uuid;
  v_user_id uuid;
  v_password_hash text := 'admin@mam.ma-salt-v1:6ed8262f1816001f3e7b7f68cefd6d4aa1a3a7a31d6170e420c6576faf48a595bf1d3ae22935d1373e950662dac918e1b72fe4be1734b5b4dd402a2f1d4e065b';
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_mam_id FROM public.workspaces WHERE slug = 'mam' LIMIT 1;
  IF v_mam_id IS NULL THEN
    RAISE NOTICE '217_mam_admin_email_ma: mam workspace missing — skipped';
    RETURN;
  END IF;

  SELECT id INTO v_user_id
  FROM public.platform_users
  WHERE lower(username) IN ('admin@mam.ma', 'admin@mam.me')
     OR lower(email) IN ('admin@mam.ma', 'admin@mam.me')
  ORDER BY CASE WHEN lower(username) = 'admin@mam.ma' THEN 0 ELSE 1 END, created_at
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '217_mam_admin_email_ma: no MAM admin user — skipped';
    RETURN;
  END IF;

  UPDATE public.platform_users SET
    workspace_id = v_mam_id,
    username = 'admin@mam.ma',
    email = 'admin@mam.ma',
    password_hash = v_password_hash,
    display_name = 'MAM Administrator',
    is_active = true,
    updated_at = v_now
  WHERE id = v_user_id;

  UPDATE public.platform_users SET is_active = false, updated_at = v_now
  WHERE v_mam_id = workspace_id
    AND id <> v_user_id
    AND lower(username) IN ('admin@mam.me', 'admin@mam.ma');

  UPDATE public.workspace_admin_metadata
  SET contact_email = 'admin@mam.ma', updated_at = v_now
  WHERE workspace_id = v_mam_id;

  UPDATE public.internal_operators SET
    username = 'admin@mam.ma',
    email = 'admin@mam.ma',
    updated_at = v_now
  WHERE id = v_user_id::text OR lower(username) IN ('admin@mam.me', 'admin@mam.ma');

  RAISE NOTICE '217_mam_admin_email_ma: MAM admin is admin@mam.ma';
END $$;
