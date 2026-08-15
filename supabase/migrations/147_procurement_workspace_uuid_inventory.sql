-- Phase 1 (step 4b): Procurement workspace_uuid column (text workspace_id retained for compatibility).
-- Maps slug or uuid-string workspace_id values to workspaces.id.
--
-- PROCUREMENT TABLES (from supabase/migrations/107_procurement_module.sql):
--   procurement_suppliers, procurement_requisitions, procurement_purchase_orders,
--   procurement_goods_receipts, procurement_invoice_matches, procurement_approval_rules,
--   procurement_contracts
--
-- These tables are NOT present on production as of Aug 2026 — migration 107 was never applied.
-- This migration safely skips absent tables via to_regclass() and emits NOTICE for each skip.
-- It does NOT fail when procurement is undeployed; the inventory view below always runs.
--
-- When migration 107 is applied later, re-run this migration (idempotent) and extend migration 144
-- to deny-all RLS on procurement tables before exposing them via PostgREST.

do $$
declare
  tbl text;
  tables text[] := array[
    'procurement_suppliers',
    'procurement_requisitions',
    'procurement_purchase_orders',
    'procurement_goods_receipts',
    'procurement_invoice_matches',
    'procurement_approval_rules',
    'procurement_contracts'
  ];
begin
  foreach tbl in array tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      raise notice '147 procurement: skipping absent table public.% (107_procurement_module not deployed)', tbl;
      continue;
    end if;

    execute format(
      'alter table public.%I add column if not exists workspace_uuid uuid references public.workspaces (id) on delete restrict',
      tbl
    );
    raise notice '147 procurement: ensured workspace_uuid on public.%', tbl;
  end loop;
end $$;

do $$
declare
  tbl text;
  tables text[] := array[
    'procurement_suppliers',
    'procurement_requisitions',
    'procurement_purchase_orders',
    'procurement_goods_receipts',
    'procurement_invoice_matches',
    'procurement_approval_rules',
    'procurement_contracts'
  ];
begin
  foreach tbl in array tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    execute format(
      $sql$
      update public.%1$I t
      set workspace_uuid = w.id
      from public.workspaces w
      where t.workspace_uuid is null
        and lower(t.workspace_id) = lower(w.slug)
      $sql$,
      tbl
    );

    execute format(
      $sql$
      update public.%1$I t
      set workspace_uuid = w.id
      from public.workspaces w
      where t.workspace_uuid is null
        and t.workspace_id ~* '^[0-9a-f-]{36}$'
        and t.workspace_id::uuid = w.id
      $sql$,
      tbl
    );
  end loop;
end $$;

do $$
declare
  tbl text;
  index_tables text[] := array[
    'procurement_suppliers',
    'procurement_requisitions',
    'procurement_purchase_orders'
  ];
begin
  foreach tbl in array index_tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;
    execute format(
      'create index if not exists %I on public.%I (workspace_uuid)',
      tbl || '_workspace_uuid_idx',
      tbl
    );
  end loop;
end $$;

-- Inventory view for Phase 1 reporting (read via service role).
create or replace view public.workspace_id_column_inventory as
select
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
     and kcu.table_schema = tc.table_schema
    join information_schema.referential_constraints rc
      on rc.constraint_name = tc.constraint_name
    join information_schema.key_column_usage ccu
      on ccu.constraint_name = rc.unique_constraint_name
     and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and kcu.table_name = c.table_name
      and kcu.column_name = c.column_name
      and ccu.table_name = 'workspaces'
      and ccu.column_name = 'id'
  ) as fk_to_workspaces,
  coalesce(cls.relrowsecurity, false) as rls_enabled
from information_schema.columns c
left join pg_class cls
  on cls.relname = c.table_name
left join pg_namespace nsp
  on nsp.oid = cls.relnamespace
 and nsp.nspname = 'public'
where c.table_schema = 'public'
  and c.column_name in ('workspace_id', 'workspace_uuid')
order by c.table_name, c.column_name;

comment on view public.workspace_id_column_inventory is
  'Supabase Phase 1 inventory of workspace_id / workspace_uuid columns. Query via service role.';

-- Post-check: report procurement table presence (informational; does not fail when all absent).
do $$
declare
  tbl text;
  tables text[] := array[
    'procurement_suppliers',
    'procurement_requisitions',
    'procurement_purchase_orders',
    'procurement_goods_receipts',
    'procurement_invoice_matches',
    'procurement_approval_rules',
    'procurement_contracts'
  ];
  present_count integer := 0;
begin
  foreach tbl in array tables
  loop
    if to_regclass(format('public.%I', tbl)) is not null then
      present_count := present_count + 1;
      raise notice '147 procurement post-check: public.% present', tbl;
    else
      raise notice '147 procurement post-check: public.% absent (expected on current production)', tbl;
    end if;
  end loop;

  if present_count = 0 then
    raise notice '147 procurement post-check: 0/7 procurement tables present — column work skipped; inventory view created';
  elsif present_count < array_length(tables, 1) then
    raise warning '147 procurement post-check: only %/7 procurement tables present — partial deployment', present_count;
  end if;
end $$;
