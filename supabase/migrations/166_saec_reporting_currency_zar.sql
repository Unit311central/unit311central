-- SAEC customer workspace reporting currency (South Africa client demo).
-- Keeps ZAR after generic customer USD normalization (migration 157).

update public.workspace_settings ws
set
  currency = 'ZAR',
  updated_at = now()
from public.workspaces w
where ws.workspace_id = w.id
  and w.slug = 'saec';
