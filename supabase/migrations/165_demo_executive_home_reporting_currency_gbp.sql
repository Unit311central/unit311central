-- Demo executive Home reporting currency (Northstar UK workspace; Finances keeps USD fixtures).
update public.workspace_settings ws
set
  currency = 'GBP',
  updated_at = now()
from public.workspaces w
where ws.workspace_id = w.id
  and w.slug = 'demo';
