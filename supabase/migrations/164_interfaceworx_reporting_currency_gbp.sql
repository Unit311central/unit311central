-- Restore Interface Worx workspace reporting currency to GBP (UK customer workspace).
-- Migration 157 normalized generic customer workspaces to USD; Interface Worx remains GBP.

update public.workspace_settings ws
set
  currency = 'GBP',
  updated_at = now()
from public.workspaces w
where ws.workspace_id = w.id
  and w.slug = 'interfaceworx';
