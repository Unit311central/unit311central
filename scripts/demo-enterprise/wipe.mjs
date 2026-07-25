/**
 * Wipe Demo business data only (workspace_id = demo).
 * Never touches Internal.
 */

import { DEMO_ENTERPRISE_TAG } from "./company.mjs";
import { sqlStr } from "./rng.mjs";

/**
 * Full Demo business reset for a coherent regenerate.
 * Deletes by workspace_id = demoId only.
 */
export function buildWipeSql(demoId) {
  const w = sqlStr(demoId);
  const tag = sqlStr(`%${DEMO_ENTERPRISE_TAG}%`);
  // Order respects FKs. All scoped to Demo workspace_id.
  return `
-- DEMO WIPE ONLY workspace_id = ${demoId}
do $wipe$
declare
  demo_id uuid := ${w}::uuid;
  internal_id uuid;
begin
  select id into internal_id from public.workspaces where slug = 'unit311' limit 1;
  if demo_id is null then
    raise exception 'Demo wipe aborted: null demo_id';
  end if;
  if internal_id is not null and demo_id = internal_id then
    raise exception 'Demo wipe aborted: demo_id equals Internal';
  end if;

  -- Child / dependent tables first
  delete from public.wise_payment_matches where workspace_id = demo_id;
  delete from public.journal_lines where workspace_id = demo_id;
  delete from public.invoices where workspace_id = demo_id;
  delete from public.journal_entries where workspace_id = demo_id;
  delete from public.payroll_run_lines where workspace_id = demo_id::text;
  delete from public.payroll_runs where workspace_id = demo_id::text;
  delete from public.payroll_employee_profiles where workspace_id = demo_id::text;
  delete from public.payroll_settings where workspace_id = demo_id::text;
  delete from public.financial_expenses where workspace_id = demo_id;
  delete from public.internal_project_tasks where workspace_id = demo_id;
  delete from public.internal_projects where workspace_id = demo_id;
  delete from public.support_tickets where workspace_id = demo_id;
  delete from public.internal_calendar_events where workspace_id = demo_id;
  delete from public.internal_action_items where workspace_id = demo_id;
  delete from public.crm_leads where workspace_id = demo_id;
  delete from public.internal_messages where workspace_id = demo_id;
  delete from public.internal_message_channels where workspace_id = demo_id;
  delete from public.software_assets where workspace_id = demo_id;
  delete from public.hr_employee_timeline_events where workspace_id = demo_id::text;
  delete from public.hr_employee_compensation_history where workspace_id = demo_id::text;
  delete from public.hr_employee_employment_history where workspace_id = demo_id::text;
  delete from public.hr_employee_notes where workspace_id = demo_id::text;
  delete from public.hr_employee_documents where workspace_id = demo_id::text;
  delete from public.hr_employees where workspace_id = demo_id;
  delete from public.internal_clients
    where workspace_id = demo_id
      and (
        notes like ${tag}
        or notes like '%[demo-curated]%'
        or id like 'dme-%'
        or id like 'demo-client-%'
      );
  -- Catch-all remaining Demo clients (enterprise regenerate owns Demo clients)
  delete from public.internal_clients where workspace_id = demo_id;
  delete from public.accounts where workspace_id = demo_id;
  delete from public.company_details where workspace_id = demo_id;
  delete from public.treasury_settings where workspace_id = demo_id;
end;
$wipe$;
`;
}
