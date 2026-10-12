-- Enable canonical Sales Management module for WOLF Central (idempotent).
-- Does not modify Internal, Demo or other workspaces.

do $$
declare
  v_wolf_id uuid;
  v_now timestamptz := now();
  v_sales_subs text[] := array[
    'sales-management:sales-management-tab-dashboard',
    'sales-management:sales-management-tab-my-sales',
    'sales-management:sales-management-tab-sales-team',
    'sales-management:sales-management-tab-targets',
    'sales-management:sales-management-tab-performance',
    'sales-management:sales-management-tab-forecast',
    'sales-management:sales-management-tab-commissions',
    'sales-management:sales-management-tab-reports',
    'sales-management:sales-management-tab-prospects',
    'sales-management:sales-management-tab-opportunities',
    'sales-management:sales-management-tab-pipeline',
    'sales-management:sales-management-tab-discovery',
    'sales-management:sales-management-tab-activities',
    'sales-management:sales-management-tab-sales-quotes',
    'sales-management:sales-management-tab-partners'
  ];
  v_sub text;
  v_order integer;
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '220_wolf_central_sales_management: wolf-central missing — skipped';
    return;
  end if;

  update public.workspace_admin_metadata
  set
    enabled_modules = (
      select coalesce(jsonb_agg(distinct elem order by elem), '[]'::jsonb)
      from (
        select jsonb_array_elements_text(coalesce(enabled_modules, '[]'::jsonb)) as elem
        union
        select 'sales-management'
      ) merged
    ),
    enabled_sub_modules = (
      select coalesce(jsonb_agg(distinct elem order by elem), '[]'::jsonb)
      from (
        select jsonb_array_elements_text(coalesce(enabled_sub_modules, '[]'::jsonb)) as elem
        union
        select unnest(v_sales_subs)
      ) merged
    ),
    updated_at = v_now
  where workspace_id = v_wolf_id;

  insert into public.workspace_modules (workspace_id, module_key, enabled, created_at, updated_at)
  values (v_wolf_id, 'crm', true, v_now, v_now)
  on conflict (workspace_id, module_key) do update set
    enabled = true,
    updated_at = v_now;

  select coalesce(max(display_order), 1200) + 100
  into v_order
  from public.workspace_sidebar_modules
  where workspace_id = v_wolf_id;

  insert into public.workspace_sidebar_modules (workspace_id, module_id, enabled, display_order)
  values (v_wolf_id, 'sales-management', true, v_order)
  on conflict (workspace_id, module_id) do update
    set enabled = true,
        display_order = coalesce(public.workspace_sidebar_modules.display_order, excluded.display_order);

  raise notice '220_wolf_central_sales_management: sales-management enabled for wolf-central';
end $$;
