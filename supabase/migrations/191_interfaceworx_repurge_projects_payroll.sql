-- Interface Worx: purge re-seeded demo projects and payroll employee rows.
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

delete from public.payroll_run_lines prl
using public.payroll_runs pr, public.workspaces w
where prl.run_id = pr.id
  and pr.workspace_id = w.id::text
  and w.slug = 'interfaceworx';

delete from public.payroll_runs pr
using public.workspaces w
where pr.workspace_id = w.id::text
  and w.slug = 'interfaceworx';

delete from public.payroll_employee_profiles pep
using public.workspaces w
where pep.workspace_id = w.id::text
  and w.slug = 'interfaceworx';

delete from public.hr_employee_payment_details epd
using public.hr_employees e, public.workspaces w
where epd.employee_id = e.id
  and e.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.hr_employee_compensation_history ech
using public.hr_employees e, public.workspaces w
where ech.employee_id = e.id
  and e.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.hr_employee_documents ed
using public.hr_employees e, public.workspaces w
where ed.employee_id = e.id
  and e.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.hr_employee_notes en
using public.hr_employees e, public.workspaces w
where en.employee_id = e.id
  and e.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.hr_employee_timeline_events ete
using public.hr_employees e, public.workspaces w
where ete.employee_id = e.id
  and e.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.hr_employee_employment_history eeh
using public.hr_employees e, public.workspaces w
where eeh.employee_id = e.id
  and e.workspace_id = w.id
  and w.slug = 'interfaceworx';

delete from public.hr_employees e
using public.workspaces w
where e.workspace_id = w.id
  and w.slug = 'interfaceworx';
