-- Sales Management business context.
-- Additive column on the existing sales tables. Existing rows, ids,
-- workspace assignments, and foreign keys stay in place.
-- Every existing row receives unit311central, including wolf-central.
-- No row is copied, deleted, or classified as wolf.

do $$
declare
  target text;
  targets text[] := array[
    'crm_leads',
    'sales_quotes',
    'sales_targets',
    'sales_commission_rules',
    'sales_commissions',
    'founder_session_bookings'
  ];
begin
  foreach target in array targets loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target
        and column_name = 'business_context'
    ) then
      execute format(
        'alter table public.%I add column business_context text not null default %L',
        target,
        'unit311central'
      );
    else
      execute format(
        'alter table public.%I alter column business_context set default %L',
        target,
        'unit311central'
      );
      execute format(
        'update public.%I set business_context = %L where business_context is null',
        target,
        'unit311central'
      );
      execute format(
        'alter table public.%I alter column business_context set not null',
        target
      );
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = target || '_business_context_check'
        and conrelid = format('public.%I', target)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I check (business_context in (%L, %L))',
        target,
        target || '_business_context_check',
        'unit311central',
        'wolf'
      );
    end if;

    execute format(
      'create index if not exists %I on public.%I (workspace_id, business_context)',
      target || '_workspace_business_context_idx',
      target
    );
  end loop;
end $$;
