-- Demo workspace: restore full LHS sidebar module rows (Home + Intelligence + 22-module catalogue).
-- workspace_sidebar_modules (207) was seeded from partial legacy metadata; whoami reads this table.
-- Idempotent.

do $$
declare
  v_demo_id uuid;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '214_demo_sidebar_modules_full_catalogue: demo workspace missing — skipped';
    return;
  end if;

  delete from public.workspace_sidebar_modules where workspace_id = v_demo_id;

  insert into public.workspace_sidebar_modules (workspace_id, module_id, enabled, display_order)
  select
    v_demo_id,
    m.module_id,
    true,
    m.display_order
  from (
    values
      ('intelligence', 300),
      ('business-central', 400),
      ('sales-management', 500),
      ('financials', 600),
      ('fundraising', 700),
      ('board', 800),
      ('corporate-information', 900),
      ('operations', 1000),
      ('marketing-events', 1100),
      ('technology-management', 1200),
      ('human-resources', 1300),
      ('business-productivity', 1400),
      ('support-desk', 1500),
      ('project-management', 1600),
      ('engineering', 1700),
      ('training', 1800),
      ('qms', 1900),
      ('tools', 2000),
      ('external-client-access', 2100)
  ) as m(module_id, display_order);

  update public.workspace_admin_metadata
  set
    enabled_modules = '["home","executive-assistant","intelligence","business-central","sales-management","financials","fundraising","board","corporate-information","operations","marketing-events","technology-management","human-resources","business-productivity","support-desk","project-management","engineering","training","qms","tools","external-client-access","settings"]'::jsonb,
    updated_at = now()
  where workspace_id = v_demo_id;
end $$;
