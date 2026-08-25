-- SAEC workspace branding + purge legacy Northstar starter catalogue rows.

update public.workspace_settings ws
set
  logo_url = '/images/workspaces/saec/logo.png',
  updated_at = now()
from public.workspaces w
where w.id = ws.workspace_id
  and w.slug = 'saec';

delete from public.internal_projects ip
using public.workspaces w
where ip.workspace_id = w.id
  and w.slug = 'saec'
  and (
    ip.id::text like 'nst-%'
    or ip.client_name ilike '%Northstar%'
    or ip.client_name ilike '%Dublin Pharma%'
    or ip.name ilike '%Edge gateway%'
    or ip.name ilike '%Edge Controller%'
    or ip.name ilike '%MES connector%'
    or ip.name ilike '%Predictive maintenance%'
    or ip.name ilike '%digital twin%'
  );

delete from public.internal_clients ic
using public.workspaces w
where ic.workspace_id = w.id
  and w.slug = 'saec'
  and (
    ic.id like 'nst-%'
    or ic.company_name ilike '%Northstar%'
    or ic.company_name ilike '%Dublin Pharma%'
    or ic.company_name ilike '%Industrial Systems%'
    or ic.notes ilike '%Northstar%'
  );
