-- Phase 1 (step 1): Remove dangerous Internal workspace_id defaults.
-- Migration 077, 087, 088, and 089 set workspace_id DEFAULT to the Unit311 Internal UUID.
-- New rows must supply workspace_id explicitly; no silent writes to Internal.

do $$
declare
  internal_default constant uuid := 'cd5c37a5-add4-4a8b-830c-6d26b775f62c'::uuid;
  tbl text;
  col_default text;
  tables text[] := array[
    -- 077_workspace_id_phase1_defaults.sql
    'accounts',
    'blog_posts',
    'client_onboarding_records',
    'competitors',
    'email_mailbox_credentials',
    'email_whatsapp_notification_log',
    'email_whatsapp_settings',
    'file_categories',
    'file_folders',
    'file_objects',
    'financial_expenses',
    'hr_employees',
    'internal_action_items',
    'internal_calendar_events',
    'internal_clients',
    'internal_info_email_messages',
    'internal_info_email_threads',
    'internal_projects',
    'internal_scheduled_calls',
    'internal_whiteboard',
    'invoices',
    'journal_entries',
    'platform_organisation_onboarding',
    'platform_organisations',
    'platform_users',
    'strategy_items',
    'support_tickets',
    'telemetry',
    'whatsapp_inbound_log',
    'whatsapp_support_sessions',
    'whiteboard_projects',
    'wise_payment_matches',
    -- 087_crm_projects_workspace_isolation.sql
    'crm_leads',
    'crm_activities',
    'crm_contact_history',
    'crm_connections',
    'founder_session_bookings',
    -- 088_financials_files_workspace_isolation.sql
    'journal_lines',
    'treasury_settings',
    -- 089_messaging_email_support_workspace_isolation.sql
    'internal_message_channels',
    'internal_messages',
    'internal_message_read_state'
  ];
begin
  foreach tbl in array tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = tbl
        and c.column_name = 'workspace_id'
    ) then
      continue;
    end if;

    select pg_get_expr(d.adbin, d.adrelid)
    into col_default
    from pg_attrdef d
    join pg_attribute a
      on a.attrelid = d.adrelid
     and a.attnum = d.adnum
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = tbl
      and a.attname = 'workspace_id'
      and not a.attisdropped;

    if col_default is null then
      continue;
    end if;

    if col_default ilike '%cd5c37a5-add4-4a8b-830c-6d26b775f62c%' then
      execute format(
        'alter table public.%I alter column workspace_id drop default',
        tbl
      );
      raise notice 'Dropped Internal workspace_id default on public.%', tbl;
    end if;
  end loop;
end $$;

-- Post-check: no workspace_id column should still default to Internal UUID.
do $$
declare
  remaining integer;
begin
  select count(*) into remaining
  from pg_attrdef d
  join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and a.attname = 'workspace_id'
    and not a.attisdropped
    and pg_get_expr(d.adbin, d.adrelid) ilike '%cd5c37a5-add4-4a8b-830c-6d26b775f62c%';

  if remaining > 0 then
    raise exception 'Internal workspace_id defaults remain on % column(s)', remaining;
  end if;
end $$;
