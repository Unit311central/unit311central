-- Migration 144 coverage audit on staging
select
  t.table_name,
  to_regclass('public.' || t.table_name) is not null as table_exists,
  coalesce((
    select count(*)::int from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public' and cls.relname = t.table_name
      and pg_get_expr(pol.polqual, pol.polrelid) = 'false'
  ), 0) as deny_policies
from (
  values
    ('accounts'),('journal_entries'),('journal_lines'),('invoices'),('wise_payment_matches'),
    ('treasury_settings'),('financial_expenses'),('crm_leads'),('crm_activities'),
    ('crm_contact_history'),('crm_connections'),('internal_clients'),('internal_projects'),
    ('internal_project_tasks'),('hr_employees'),('hr_employee_compensation_history'),
    ('hr_employee_documents'),('hr_employee_notes'),('hr_employee_timeline_events'),
    ('hr_employee_employment_history'),('hr_employee_number_seq'),('file_categories'),
    ('file_folders'),('file_objects'),('software_provider_connections'),
    ('software_provider_sync_runs'),('software_provider_period_snapshots'),
    ('software_provider_charge_facts'),('software_provider_invoices'),('platform_users'),
    ('partners'),('partner_otp_codes'),('partner_invoices'),('partner_commission_rates'),
    ('partner_jobs')
) as t(table_name)
order by t.table_name;
