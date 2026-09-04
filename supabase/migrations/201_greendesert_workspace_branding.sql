-- Green Desert workspace branding, USD currency, and purge of legacy starter rows.

update public.workspace_settings ws
set
  logo_url = '/images/workspaces/greendesert/logo.png',
  currency = 'USD',
  updated_at = now()
from public.workspaces w
where w.id = ws.workspace_id
  and w.slug = 'greendesert';

delete from public.partners p
using public.workspaces w
where p.workspace_id = w.id
  and w.slug = 'greendesert';

delete from public.financial_expenses fe
using public.workspaces w
where fe.workspace_id = w.id
  and w.slug = 'greendesert';

delete from public.invoices i
using public.workspaces w
where i.workspace_id = w.id
  and w.slug = 'greendesert';

delete from public.internal_projects ip
using public.workspaces w
where ip.workspace_id = w.id
  and w.slug = 'greendesert'
  and (
    ip.id::text like 'nst-%'
    or ip.client_name ilike '%Northstar%'
    or ip.client_name ilike '%Industrial Technologies%'
    or ip.name ilike '%Edge gateway%'
    or ip.name ilike '%Edge Controller%'
  );

delete from public.internal_clients ic
using public.workspaces w
where ic.workspace_id = w.id
  and w.slug = 'greendesert'
  and (
    ic.id like 'nst-%'
    or ic.company_name ilike '%Northstar%'
    or ic.company_name ilike '%Industrial Technologies%'
    or ic.notes ilike '%Northstar%'
  );
