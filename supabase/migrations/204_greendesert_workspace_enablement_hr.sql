-- Green Desert: enable full central catalogue, provision workspace admin, reset HR to 4 employees.
-- Password: Reactor20206$ (admin@greendesert.unit311central.com-salt-v1 scrypt).

DO $$
DECLARE
  v_greendesert_id uuid;
  v_user_id uuid;
  v_password_hash text := 'admin@greendesert.unit311central.com-salt-v1:217d22965ea324f8feb6c29e8d6e2a3703f41e97a85ceab3335b80b8f25e24ed3bef8670815cf68157ffae3e09f3b64f01db3faf5312eceabc28072996538d63';
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
  SELECT id INTO v_greendesert_id FROM public.workspaces WHERE slug = 'greendesert' LIMIT 1;
  IF v_greendesert_id IS NULL THEN
    RAISE NOTICE '204_greendesert_workspace_enablement_hr: greendesert workspace missing — skipped';
    RETURN;
  END IF;

  INSERT INTO public.workspace_admin_metadata (
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
  ) VALUES (
    v_greendesert_id,
    'Green Desert',
    'Green Desert Administrator',
    'admin@greendesert.unit311central.com',
    'Saudi Arabia',
    'Green Desert modular reactor deployment workspace.',
    'Green Desert',
    v_enabled_modules,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'migration-204',
    v_now,
    v_now
  )
  ON CONFLICT (workspace_id) DO UPDATE SET
    enabled_modules = v_enabled_modules,
    enabled_sub_modules = COALESCE(
      NULLIF(public.workspace_admin_metadata.enabled_sub_modules, '[]'::jsonb),
      excluded.enabled_sub_modules
    ),
    updated_at = v_now;

  -- Remove legacy / duplicate HR rows — keep only the canonical four Green Desert employees.
  DELETE FROM public.payroll_employee_profiles pep
  USING public.hr_employees he
  WHERE pep.workspace_id = v_greendesert_id::text
    AND pep.employee_id = he.id
    AND he.workspace_id = v_greendesert_id
    AND lower(he.email) NOT IN (
      'layla.alharbi@greendesert.unit311central.com',
      'omar.alqahtani@greendesert.unit311central.com',
      'noura.alshehri@greendesert.unit311central.com',
      'faisal.aldossary@greendesert.unit311central.com'
    );

  DELETE FROM public.hr_employees he
  WHERE he.workspace_id = v_greendesert_id
    AND lower(he.email) NOT IN (
      'layla.alharbi@greendesert.unit311central.com',
      'omar.alqahtani@greendesert.unit311central.com',
      'noura.alshehri@greendesert.unit311central.com',
      'faisal.aldossary@greendesert.unit311central.com'
    );

  -- Upsert canonical workforce — Jeddah, $100k USD, monthly.
  INSERT INTO public.hr_employees (
    id, workspace_id, full_name, preferred_name, email, phone, employment_status, employment_type,
    date_joined, location, role, department, manager, currency, pay_frequency,
    salary_current, salary_previous, bonus, holiday_calendar, vacation_days_per_year, vacation_days_taken,
    created_at, updated_at
  ) VALUES
    ('gd-hr-layla', v_greendesert_id, 'Layla Al-Harbi', 'Layla', 'layla.alharbi@greendesert.unit311central.com', '+966 12 555 0101', 'active', 'full_time', '2024-03-01', 'Jeddah', 'Chief Executive Officer', 'Executive', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 4, v_now, v_now),
    ('gd-hr-omar', v_greendesert_id, 'Omar Al-Qahtani', 'Omar', 'omar.alqahtani@greendesert.unit311central.com', '+966 12 555 0102', 'active', 'full_time', '2024-06-15', 'Jeddah', 'Head of Reactor Engineering', 'Engineering', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 2, v_now, v_now),
    ('gd-hr-noura', v_greendesert_id, 'Noura Al-Shehri', 'Noura', 'noura.alshehri@greendesert.unit311central.com', '+966 12 555 0103', 'active', 'full_time', '2025-01-10', 'Jeddah', 'Operations Director', 'Operations', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 6, v_now, v_now),
    ('gd-hr-faisal', v_greendesert_id, 'Faisal Al-Dossary', 'Faisal', 'faisal.aldossary@greendesert.unit311central.com', '+966 12 555 0104', 'active', 'full_time', '2025-04-01', 'Jeddah', 'Commercial Lead', 'Sales', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 1, v_now, v_now)
  ON CONFLICT (id) DO UPDATE SET
    workspace_id = EXCLUDED.workspace_id,
    full_name = EXCLUDED.full_name,
    preferred_name = EXCLUDED.preferred_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    employment_status = EXCLUDED.employment_status,
    employment_type = EXCLUDED.employment_type,
    date_joined = EXCLUDED.date_joined,
    location = EXCLUDED.location,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    currency = EXCLUDED.currency,
    pay_frequency = EXCLUDED.pay_frequency,
    salary_current = EXCLUDED.salary_current,
    salary_previous = EXCLUDED.salary_previous,
    bonus = EXCLUDED.bonus,
    holiday_calendar = EXCLUDED.holiday_calendar,
    vacation_days_per_year = EXCLUDED.vacation_days_per_year,
    vacation_days_taken = EXCLUDED.vacation_days_taken,
    updated_at = v_now;

  INSERT INTO public.payroll_settings (
    workspace_id, federal_tax_pct, state_tax_pct, social_security_pct, medicare_pct,
    employer_payroll_pct, default_currency, payroll_frequency, pay_day, bonus_pay_month,
    bonus_pay_day, country_code, default_tax_state, updated_at
  ) VALUES (
    v_greendesert_id, 0, 0, 9.75, 0, 11.75, 'USD', 'monthly', 28, 12, 28, 'SA', 'SA', v_now
  )
  ON CONFLICT (workspace_id) DO UPDATE SET
    default_currency = 'USD',
    payroll_frequency = 'monthly',
    country_code = 'SA',
    default_tax_state = 'SA',
    social_security_pct = 9.75,
    employer_payroll_pct = 11.75,
    updated_at = v_now;

  SELECT id INTO v_user_id
  FROM public.platform_users
  WHERE workspace_id = v_greendesert_id
    AND lower(username) = 'admin@greendesert.unit311central.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.platform_users
    WHERE lower(username) = 'admin@greendesert.unit311central.com'
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO public.platform_users (
      id, workspace_id, username, email, display_name, user_type, is_active,
      password_hash, redirect_path, client_name, email_verified_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_greendesert_id, 'admin@greendesert.unit311central.com',
      'admin@greendesert.unit311central.com', 'Green Desert Administrator', 'internal', true,
      v_password_hash, '/dashboard', 'Green Desert', v_now, v_now, v_now
    );
    RAISE NOTICE '204_greendesert_workspace_enablement_hr: created admin@greendesert.unit311central.com';
  ELSE
    UPDATE public.platform_users SET
      workspace_id = v_greendesert_id,
      password_hash = v_password_hash,
      display_name = 'Green Desert Administrator',
      user_type = 'internal',
      is_active = true,
      email = 'admin@greendesert.unit311central.com',
      email_verified_at = COALESCE(email_verified_at, v_now),
      redirect_path = '/dashboard',
      client_name = 'Green Desert',
      updated_at = v_now
    WHERE id = v_user_id;
    RAISE NOTICE '204_greendesert_workspace_enablement_hr: updated admin@greendesert.unit311central.com';
  END IF;

  INSERT INTO public.workspace_users (workspace_id, user_id, role, is_owner, created_at, updated_at)
  SELECT v_greendesert_id, v_user_id, 'admin', true, v_now, v_now
  WHERE NOT EXISTS (
    SELECT 1 FROM public.workspace_users wu
    WHERE wu.workspace_id = v_greendesert_id AND wu.user_id = v_user_id
  );

  UPDATE public.workspace_users
  SET role = 'admin', is_owner = true, updated_at = v_now
  WHERE workspace_id = v_greendesert_id AND user_id = v_user_id;

  INSERT INTO public.internal_operators (
    id, operator_label, full_name, username, email, phone, role, roles, department, departments,
    status, region, license_id, notes, allowed_views, dashboard_prefs, created_at, updated_at
  ) VALUES (
    v_user_id::text, 'GD Admin', 'Green Desert Administrator', 'admin@greendesert.unit311central.com',
    'admin@greendesert.unit311central.com', null, 'Admin', v_roles, 'Corporate', v_departments,
    'Active', 'Middle East', null, 'Green Desert full-access administrator', null,
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
