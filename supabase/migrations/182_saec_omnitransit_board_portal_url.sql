-- Point OmniTransit board portal at omnitransit.unit311central.com/board (not unit311.com).

DO $$
DECLARE
  v_saec_id uuid;
BEGIN
  SELECT id INTO v_saec_id FROM workspaces WHERE slug = 'saec' LIMIT 1;
  IF v_saec_id IS NULL THEN
    RAISE NOTICE 'saec workspace missing — skipping board portal URL correction';
    RETURN;
  END IF;

  UPDATE internal_clients
  SET
    platform_url = 'https://omnitransit.unit311central.com/board',
    updated_at = now()
  WHERE id = 'saec-cli-board-portal' AND workspace_id = v_saec_id;
END $$;
