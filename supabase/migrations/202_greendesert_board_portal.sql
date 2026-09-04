-- Green Desert Board Portal: external board member user + internal_clients row.
-- Password hash is for Algae2026$ (board@greendesert.unit311central.com-salt-v1 scrypt).

DO $$
DECLARE
  v_greendesert_id uuid;
  v_user_id uuid;
  v_password_hash text := 'board@greendesert.unit311central.com-salt-v1:5b52d0ce1de1c9fc0d5a6d64c82c7b2afb37436e71071162129fe06b8278a7d96b014961f5935621a680142bffee2ded3d717c1b0809abc66b753cbc1be64e0b';
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_greendesert_id FROM public.workspaces WHERE slug = 'greendesert' LIMIT 1;
  IF v_greendesert_id IS NULL THEN
    RAISE NOTICE '202_greendesert_board_portal: greendesert workspace missing — skipped';
    RETURN;
  END IF;

  INSERT INTO public.internal_clients (
    id,
    workspace_id,
    company_name,
    account_status,
    industry,
    region,
    company_country,
    company_city,
    contract_type,
    notes,
    platform_url,
    email,
    primary_contact,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    'greendesert-cli-board',
    v_greendesert_id,
    'Green Desert Board',
    'Active',
    'Governance',
    'United States',
    'United States',
    'Phoenix',
    'Board Access',
    'Green Desert Board Portal — external board member access',
    'https://greendesert.unit311central.com/board',
    'board@greendesert.unit311central.com',
    'Green Desert Board Member',
    'active',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    workspace_id = EXCLUDED.workspace_id,
    company_name = EXCLUDED.company_name,
    account_status = EXCLUDED.account_status,
    platform_url = EXCLUDED.platform_url,
    email = EXCLUDED.email,
    subscription_status = 'active',
    updated_at = v_now;

  SELECT id INTO v_user_id
  FROM public.platform_users
  WHERE workspace_id = v_greendesert_id
    AND lower(username) = 'board@greendesert.unit311central.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.platform_users
    WHERE lower(username) = 'board@greendesert.unit311central.com'
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO public.platform_users (
      id,
      workspace_id,
      username,
      email,
      display_name,
      user_type,
      is_active,
      password_hash,
      redirect_path,
      client_id,
      client_name,
      email_verified_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_greendesert_id,
      'board@greendesert.unit311central.com',
      'board@greendesert.unit311central.com',
      'Green Desert Board Member',
      'external',
      true,
      v_password_hash,
      '/board',
      'greendesert-cli-board',
      'Green Desert Board',
      v_now,
      v_now,
      v_now
    );
    RAISE NOTICE '202_greendesert_board_portal: created board@greendesert.unit311central.com';
  ELSE
    UPDATE public.platform_users
    SET
      workspace_id = v_greendesert_id,
      password_hash = v_password_hash,
      display_name = 'Green Desert Board Member',
      user_type = 'external',
      is_active = true,
      email = 'board@greendesert.unit311central.com',
      email_verified_at = COALESCE(email_verified_at, v_now),
      redirect_path = '/board',
      client_id = 'greendesert-cli-board',
      client_name = 'Green Desert Board',
      updated_at = v_now
    WHERE id = v_user_id;
    RAISE NOTICE '202_greendesert_board_portal: updated board@greendesert.unit311central.com';
  END IF;
END $$;
