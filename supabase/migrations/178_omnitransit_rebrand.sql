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

-- Align platform_users login identifiers with Tools → Users (internal_operators) when email/username were edited in UI.
update public.platform_users pu
set
  username = lower(trim(io.username)),
  email = lower(trim(io.email)),
  updated_at = now()
from public.internal_operators io, public.workspaces w
where pu.id = io.id
  and pu.workspace_id = w.id
  and w.slug = 'saec'
  and (
    lower(trim(pu.username)) is distinct from lower(trim(io.username))
    or lower(trim(pu.email)) is distinct from lower(trim(io.email))
  );

update public.sales_teams st
set name = 'OmniTransit National Sales', updated_at = now()
from public.workspaces w
where st.workspace_id = w.id
  and w.slug = 'saec'
  and st.name = 'SAEC National Sales';
