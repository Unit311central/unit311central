-- OmniTransit customer-facing rebrand for SAEC workspace (slug remains `saec`).

update public.workspaces
set
  name = 'OmniTransit',
  updated_at = now()
where slug = 'saec';

update public.workspace_settings ws
set
  logo_url = '/images/workspaces/omnitransit-logo.svg',
  updated_at = now()
from public.workspaces w
where w.id = ws.workspace_id
  and w.slug = 'saec';

update public.company_details cd
set
  legal_company_name = 'OmniTransit Group',
  trading_name = 'OmniTransit',
  updated_at = now()
from public.workspaces w
where cd.workspace_id = w.id
  and w.slug = 'saec';

insert into public.workspace_host_aliases (alias_subdomain, workspace_id, workspace_slug)
select 'omnitransit', w.id, w.slug
from public.workspaces w
where w.slug = 'saec'
on conflict (alias_subdomain) do update
set workspace_id = excluded.workspace_id,
    workspace_slug = excluded.workspace_slug;
