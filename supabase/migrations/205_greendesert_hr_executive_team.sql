-- Green Desert: reset HR to executive team (Ashley Pursglove, Hashem brothers).

DO $$
DECLARE
  v_greendesert_id uuid;
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_greendesert_id FROM public.workspaces WHERE slug = 'greendesert' LIMIT 1;
  IF v_greendesert_id IS NULL THEN
    RAISE NOTICE '205_greendesert_hr_executive_team: greendesert workspace missing — skipped';
    RETURN;
  END IF;

  DELETE FROM public.payroll_employee_profiles pep
  USING public.hr_employees he
  WHERE pep.workspace_id = v_greendesert_id::text
    AND pep.employee_id = he.id
    AND he.workspace_id = v_greendesert_id
    AND lower(he.email) NOT IN (
      'ashley.pursglove@greendesert.unit311central.com',
      'abdulmajeed@greendesert.unit311central.com',
      'yusuf@greendesert.unit311central.com',
      'omar@greendesert.unit311central.com'
    );

  DELETE FROM public.hr_employees he
  WHERE he.workspace_id = v_greendesert_id
    AND lower(he.email) NOT IN (
      'ashley.pursglove@greendesert.unit311central.com',
      'abdulmajeed@greendesert.unit311central.com',
      'yusuf@greendesert.unit311central.com',
      'omar@greendesert.unit311central.com'
    );

  INSERT INTO public.hr_employees (
    id, workspace_id, full_name, preferred_name, email, phone, employment_status, employment_type,
    date_joined, location, role, department, manager, currency, pay_frequency,
    salary_current, salary_previous, bonus, holiday_calendar, vacation_days_per_year, vacation_days_taken,
    created_at, updated_at
  ) VALUES
    ('gd-hr-ashley', v_greendesert_id, 'Ashley Pursglove', 'Ashley', 'ashley.pursglove@greendesert.unit311central.com', '+966 12 555 0101', 'active', 'full_time', '2023-09-01', 'Jeddah', 'Chief Technology Officer', 'Technology', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 3, v_now, v_now),
    ('gd-hr-abdulmajeed', v_greendesert_id, 'Abdulmajeed Hashem', 'Abdulmajeed', 'abdulmajeed@greendesert.unit311central.com', '+966 54 477 7775', 'active', 'full_time', '2023-01-15', 'Jeddah', 'Chief Executive Officer', 'Executive', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 5, v_now, v_now),
    ('gd-hr-yusuf', v_greendesert_id, 'Yusuf Hashem', 'Yusuf', 'yusuf@greendesert.unit311central.com', '+966 12 555 0103', 'active', 'full_time', '2023-04-01', 'Jeddah', 'Chief Financial Officer', 'Finance', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 2, v_now, v_now),
    ('gd-hr-omar', v_greendesert_id, 'Omar Hashem', 'Omar', 'omar@greendesert.unit311central.com', '+966 12 555 0104', 'active', 'full_time', '2023-06-01', 'Jeddah', 'Chief Operating Officer', 'Operations', '', 'USD', 'monthly', 100000, 100000, 0, 'Saudi Arabia', 30, 4, v_now, v_now)
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
END $$;
