-- Purge legacy Northstar/demo starter rows from Interface Worx workspace.

delete from public.internal_projects ip
using public.workspaces w
where ip.workspace_id = w.id
  and w.slug = 'interfaceworx'
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
  and w.slug = 'interfaceworx'
  and (
    ic.id like 'nst-%'
    or ic.company_name ilike '%Northstar%'
    or ic.company_name ilike '%Industrial Technologies%'
    or ic.notes ilike '%Northstar%'
  );

delete from public.software_assets sa
using public.workspaces w
where sa.workspace_id = w.id
  and w.slug = 'interfaceworx'
  and (
    sa.id::text like 'nst-%'
    or sa.name ilike '%Northstar%'
    or sa.vendor ilike '%Northstar%'
  );
