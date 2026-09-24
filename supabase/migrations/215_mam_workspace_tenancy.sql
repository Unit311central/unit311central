-- MAM (Moroccan Advanced Manufacturing) — first-class customer workspace.
-- Live host: mam.unit311central.com (subdomain matches canonical slug `mam`).

DO $$
DECLARE
  v_mam_id uuid;
BEGIN
  SELECT id INTO v_mam_id FROM public.workspaces WHERE slug = 'mam' LIMIT 1;

  IF v_mam_id IS NULL THEN
    INSERT INTO public.workspaces (name, slug, workspace_type, status)
    VALUES ('Moroccan Advanced Manufacturing', 'mam', 'Customer', 'Active')
    RETURNING id INTO v_mam_id;
    RAISE NOTICE '215_mam_workspace_tenancy: created workspace slug=mam';
  ELSE
    RAISE NOTICE '215_mam_workspace_tenancy: workspace slug=mam already exists';
  END IF;

  PERFORM public.ensure_workspace_foundation(v_mam_id, 'unit311');

  INSERT INTO public.workspace_host_aliases (alias_subdomain, workspace_id, workspace_slug)
  VALUES ('mam', v_mam_id, 'mam')
  ON CONFLICT (alias_subdomain) DO UPDATE SET
    workspace_id = excluded.workspace_id,
    workspace_slug = excluded.workspace_slug;

  INSERT INTO public.workspace_admin_metadata (
    workspace_id,
    company_name,
    contact_name,
    contact_email,
    country,
    description,
    branding_display_name,
    customer_hostname,
    enabled_modules,
    enabled_sub_modules,
    pending_employees,
    pending_clients,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    v_mam_id,
    'Moroccan Advanced Manufacturing',
    'MAM Administrator',
    'admin@mam.unit311central.com',
    'Morocco',
    'Moroccan Advanced Manufacturing (MAM) customer workspace.',
    'MAM',
    'mam',
    '["home","executive-assistant","business-central","financials","settings"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'migration-215',
    now(),
    now()
  )
  ON CONFLICT (workspace_id) DO UPDATE SET
    company_name = excluded.company_name,
    branding_display_name = excluded.branding_display_name,
    customer_hostname = excluded.customer_hostname,
    description = excluded.description,
    updated_at = now();
END $$;
