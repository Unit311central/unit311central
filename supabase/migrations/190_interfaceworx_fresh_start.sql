-- Interface Worx fresh start: remove all legacy operational CRM/project/demo rows.
-- Keeps Tom expense rows in financial_expenses (real workspace data).

delete from public.internal_work_package_tasks t
using public.internal_work_packages p, public.workspaces w
where t.work_package_id = p.id
  and p.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.internal_work_package_members m
using public.internal_work_packages p, public.workspaces w
where m.work_package_id = p.id
  and p.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.internal_work_packages p
using public.workspaces w
where p.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.internal_projects ip
using public.workspaces w
where ip.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.internal_clients ic
using public.workspaces w
where ic.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.software_assets sa
using public.workspaces w
where sa.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.support_tickets st
using public.workspaces w
where st.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.board_directors bd
using public.workspaces w
where bd.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.technology_telecom_services tts
using public.workspaces w
where tts.workspace_id = w.id
  and w.slug = 'interfaceworx';

update public.payroll_settings ps
set
  default_currency = 'GBP',
  country_code = 'GB',
  default_tax_state = '',
  updated_at = now()
from public.workspaces w
where ps.workspace_id = w.id
  and w.slug = 'interfaceworx';
