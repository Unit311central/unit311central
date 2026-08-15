-- Phase 1 (step 6): Replace permissive RLS on highest-risk tenant tables with deny-all.
-- Server paths must use SUPABASE_SERVICE_ROLE_KEY and explicit workspace_id filters.
-- Does not remove RLS; service_role bypasses policies.
--
-- Table names are passed as text (not ::regclass) so missing optional tables do not fail
-- the whole migration at parse time. phase1_replace_open_rls skips absent tables with NOTICE.
--
-- Optional tables not yet deployed on production (as of Aug 2026):
--   public.software_provider_invoices — defined in 139_software_provider_invoices.sql but not applied to prod.
-- When those tables are added later, re-run this migration (idempotent) or apply a follow-up hardening migration.

create or replace function public.phase1_replace_open_rls(
  p_table text,
  p_legacy_policy_names text[] default '{}'::text[]
)
returns void
language plpgsql
as $$
declare
  policy_name text;
  qualified text := p_table;
  bare_name text := split_part(qualified, '.', 2);
  deny_policy text := bare_name || '_deny_all';
begin
  if to_regclass(qualified) is null then
    raise notice 'phase1_replace_open_rls: skipping missing table %', qualified;
    return;
  end if;

  execute format('alter table %s enable row level security', qualified);

  if array_length(p_legacy_policy_names, 1) is not null then
    foreach policy_name in array p_legacy_policy_names
    loop
      execute format('drop policy if exists %I on %s', policy_name, qualified);
    end loop;
  end if;

  -- Drop any remaining permissive policies on this table.
  for policy_name in
    select pol.polname
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = bare_name
      and (
        pg_get_expr(pol.polqual, pol.polrelid) = 'true'
        or pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
      )
  loop
    execute format('drop policy if exists %I on %s', policy_name, qualified);
  end loop;

  execute format('drop policy if exists %I on %s', deny_policy, qualified);
  execute format(
    'create policy %I on %s for all using (false)',
    deny_policy,
    qualified
  );
end;
$$;

-- Financials / GL
select public.phase1_replace_open_rls('public.accounts', array['accounts_all']);
select public.phase1_replace_open_rls('public.journal_entries', array['journal_entries_all']);
select public.phase1_replace_open_rls('public.journal_lines', array['journal_lines_all']);
select public.phase1_replace_open_rls('public.invoices', array['invoices_all']);
select public.phase1_replace_open_rls('public.wise_payment_matches', array['wise_payment_matches_all']);
select public.phase1_replace_open_rls('public.treasury_settings', array['treasury_settings_all']);
select public.phase1_replace_open_rls('public.financial_expenses', array['financial_expenses_all']);

-- CRM / clients
select public.phase1_replace_open_rls('public.crm_leads', array['crm_leads_all']);
select public.phase1_replace_open_rls('public.crm_activities', array['crm_activities_all']);
select public.phase1_replace_open_rls('public.crm_contact_history', array['crm_contact_history_all']);
select public.phase1_replace_open_rls('public.crm_connections', array['crm_connections_all']);
select public.phase1_replace_open_rls('public.internal_clients', array['internal_clients_all']);

-- Projects
select public.phase1_replace_open_rls('public.internal_projects', array['internal_projects_all']);
select public.phase1_replace_open_rls('public.internal_project_tasks', array['internal_project_tasks_all']);

-- HR (uuid workspace_id on hr_employees; child tables use text — secured here)
select public.phase1_replace_open_rls('public.hr_employees', array['hr_employees_all']);
select public.phase1_replace_open_rls('public.hr_employee_compensation_history', array['hr_comp_history_all']);
select public.phase1_replace_open_rls('public.hr_employee_documents', array['hr_employee_documents_all']);
select public.phase1_replace_open_rls('public.hr_employee_notes', array['hr_employee_notes_all']);
select public.phase1_replace_open_rls('public.hr_employee_timeline_events', array['hr_employee_timeline_all']);
select public.phase1_replace_open_rls('public.hr_employee_employment_history', array['hr_employee_employment_history_all']);
select public.phase1_replace_open_rls('public.hr_employee_number_seq', array['hr_employee_number_seq_all']);

-- Files
select public.phase1_replace_open_rls('public.file_categories', array['file_categories_all']);
select public.phase1_replace_open_rls('public.file_folders', array['file_folders_all']);
select public.phase1_replace_open_rls('public.file_objects', array['file_objects_all']);

-- Software billing
select public.phase1_replace_open_rls('public.software_provider_connections', array['software_provider_connections_all']);
select public.phase1_replace_open_rls('public.software_provider_sync_runs', array['software_provider_sync_runs_all']);
select public.phase1_replace_open_rls('public.software_provider_period_snapshots', array['software_provider_period_snapshots_all']);
select public.phase1_replace_open_rls('public.software_provider_charge_facts', array['software_provider_charge_facts_all']);
select public.phase1_replace_open_rls('public.software_provider_invoices', array['software_provider_invoices_all']);

-- Platform users (login must use service role after this migration)
select public.phase1_replace_open_rls('public.platform_users', array['platform_users_all']);

-- Partners
select public.phase1_replace_open_rls('public.partners', array['partners_all']);
select public.phase1_replace_open_rls('public.partner_otp_codes', array['partner_otp_all']);
select public.phase1_replace_open_rls('public.partner_invoices', array['partner_invoices_all']);
select public.phase1_replace_open_rls('public.partner_commission_rates', array['partner_commission_rates_all']);
select public.phase1_replace_open_rls('public.partner_jobs', array['partner_jobs_all']);

drop function public.phase1_replace_open_rls(text, text[]);

-- Post-check: every table that EXISTS must have deny-all; absent optional tables are reported only.
do $$
declare
  tbl text;
  tables text[] := array[
    'accounts','journal_entries','journal_lines','invoices','wise_payment_matches',
    'treasury_settings','financial_expenses','crm_leads','crm_activities',
    'crm_contact_history','crm_connections','internal_clients','internal_projects',
    'internal_project_tasks','hr_employees','hr_employee_compensation_history',
    'hr_employee_documents','hr_employee_notes','hr_employee_timeline_events',
    'hr_employee_employment_history','hr_employee_number_seq','file_categories',
    'file_folders','file_objects','software_provider_connections',
    'software_provider_sync_runs','software_provider_period_snapshots',
    'software_provider_charge_facts','software_provider_invoices','platform_users',
    'partners','partner_otp_codes','partner_invoices','partner_commission_rates',
    'partner_jobs'
  ];
  deny_count integer;
begin
  foreach tbl in array tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      raise notice 'phase1 priority RLS: table public.% absent — skipped (not a failure)', tbl;
      continue;
    end if;

    select count(*) into deny_count
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = tbl
      and pg_get_expr(pol.polqual, pol.polrelid) = 'false';

    if deny_count < 1 then
      raise exception 'phase1 priority RLS: public.% exists but has no deny-all policy', tbl;
    end if;
  end loop;
end $$;
