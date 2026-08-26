-- OmniTransit external portals: board + Hyprop client portal internal_clients rows.
-- Portal authentication uses env OMNITRANSIT_PORTALS_SHARED_PASSWORD (not stored here).

DO $$
DECLARE
  v_saec_id uuid;
  v_now timestamptz := now();
BEGIN
  SELECT id INTO v_saec_id FROM workspaces WHERE slug = 'saec' LIMIT 1;
  IF v_saec_id IS NULL THEN
    RAISE NOTICE 'saec workspace missing — skipping omnitransit portal seed';
    RETURN;
  END IF;

  INSERT INTO internal_clients (
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
    'saec-cli-board-portal',
    v_saec_id,
    'OmniTransit Board',
    'Active',
    'Governance',
    'Gauteng, South Africa',
    'South Africa',
    'Centurion',
    'Board Access',
    'OmniTransit Board Portal — external board member access (demo)',
    'https://omnitransit.unit311.com/board',
    'demo@omnitransit.com',
    'OmniTransit Board Member',
    'active',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    workspace_id = EXCLUDED.workspace_id,
    company_name = EXCLUDED.company_name,
    account_status = EXCLUDED.account_status,
    platform_url = EXCLUDED.platform_url,
    subscription_status = 'active',
    updated_at = v_now;

  UPDATE internal_clients
  SET
    platform_url = 'https://omnitransit.unit311central.com/hyprop',
    subscription_status = COALESCE(subscription_status, 'active'),
    account_status = 'Active',
    updated_at = v_now
  WHERE id = 'saec-cli-hyprop' AND workspace_id = v_saec_id;
END $$;
