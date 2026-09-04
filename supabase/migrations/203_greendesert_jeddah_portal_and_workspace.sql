-- Green Desert: Jeddah Technologies client portal + HR/payroll seed data.
-- Password hash: Reactor20206$ (jeddahtechnologies@greendesert.unit311central.com-salt-v1 scrypt).

DO $$
DECLARE
  v_greendesert_id uuid;
  v_user_id uuid;
  v_password_hash text := 'jeddahtechnologies@greendesert.unit311central.com-salt-v1:37405e950dd46b790903cbb939dafb1911b8626e0a823083baa9e1c9bb7843b646a846616b61f4b1e640e33f9b6b1cc66d1acd4993ffd66ad4ed739608f2f8fe';
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_greendesert_id FROM public.workspaces WHERE slug = 'greendesert' LIMIT 1;
  IF v_greendesert_id IS NULL THEN
    RAISE NOTICE '203_greendesert_jeddah: greendesert workspace missing — skipped';
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
    'greendesert-cli-jeddah-technologies',
    v_greendesert_id,
    'Jeddah Technologies',
    'Active',
    'Technology',
    'Middle East',
    'Saudi Arabia',
    'Jeddah',
    'Client',
    'Green Desert external client portal — reactor deployment partner',
    'https://greendesert.unit311central.com/jeddahtechnologies',
    'jeddahtechnologies@greendesert.unit311central.com',
    'Jeddah Technologies Portal Admin',
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
    company_city = EXCLUDED.company_city,
    company_country = EXCLUDED.company_country,
    subscription_status = 'active',
    updated_at = v_now;

  SELECT id INTO v_user_id
  FROM public.platform_users
  WHERE workspace_id = v_greendesert_id
    AND lower(username) = 'jeddahtechnologies@greendesert.unit311central.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.platform_users
    WHERE lower(username) = 'jeddahtechnologies@greendesert.unit311central.com'
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
      'jeddahtechnologies@greendesert.unit311central.com',
      'jeddahtechnologies@greendesert.unit311central.com',
      'Jeddah Technologies Portal User',
      'external',
      true,
      v_password_hash,
      '/jeddahtechnologies',
      'greendesert-cli-jeddah-technologies',
      'Jeddah Technologies',
      v_now,
      v_now,
      v_now
    );
    RAISE NOTICE '203_greendesert_jeddah: created jeddahtechnologies portal user';
  ELSE
    UPDATE public.platform_users
    SET
      workspace_id = v_greendesert_id,
      password_hash = v_password_hash,
      display_name = 'Jeddah Technologies Portal User',
      user_type = 'external',
      is_active = true,
      email = 'jeddahtechnologies@greendesert.unit311central.com',
      email_verified_at = COALESCE(email_verified_at, v_now),
      redirect_path = '/jeddahtechnologies',
      client_id = 'greendesert-cli-jeddah-technologies',
      client_name = 'Jeddah Technologies',
      updated_at = v_now
    WHERE id = v_user_id;
    RAISE NOTICE '203_greendesert_jeddah: updated jeddahtechnologies portal user';
  END IF;

  -- Saudi Arabia payroll settings (USD salaries, SA tax structure labels in UI).
  INSERT INTO public.payroll_settings (
    workspace_id,
    federal_tax_pct,
    state_tax_pct,
    social_security_pct,
    medicare_pct,
    employer_payroll_pct,
    default_currency,
    payroll_frequency,
    pay_day,
    bonus_pay_month,
    bonus_pay_day,
    country_code,
    default_tax_state,
    updated_at
  ) VALUES (
    v_greendesert_id,
    0,
    0,
    9.75,
    0,
    11.75,
    'USD',
    'monthly',
    28,
    12,
    28,
    'SA',
    'SA',
    v_now
  )
  ON CONFLICT (workspace_id) DO UPDATE SET
    default_currency = 'USD',
    payroll_frequency = 'monthly',
    country_code = 'SA',
    default_tax_state = 'SA',
    social_security_pct = 9.75,
    employer_payroll_pct = 11.75,
    updated_at = v_now;
END $$;
