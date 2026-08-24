-- Normalize legacy GBP default to USD for generic customer workspaces.
-- Specialist workspaces (demo, onwardair, abhi, talanton, corpcentre) keep their currency.

update public.workspace_settings ws
set
  currency = 'USD',
  updated_at = now()
from public.workspaces w
where ws.workspace_id = w.id
  and w.workspace_type = 'Customer'
  and coalesce(ws.currency, '') in ('GBP', '')
  and w.slug not in (
    'demo',
    'northstar',
    'onwardair',
    'abhi',
    'talanton',
    'talanton-impact',
    'talantonimpact',
    'corpcentre',
    'corp-centre'
  );
