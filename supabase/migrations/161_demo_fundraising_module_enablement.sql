-- Ensure Demo workspace metadata enables the full Northstar SME catalogue,
-- including Fundraising and all seven submodule view ids.
-- Idempotent: safe to re-run on provisioned demo workspace.

do $$
declare
  v_demo_id uuid;
  v_modules jsonb := '[
    "home",
    "executive-assistant",
    "business-central",
    "intelligence",
    "financials",
    "fundraising",
    "board",
    "corporate-information",
    "operations",
    "marketing-events",
    "technology-management",
    "human-resources",
    "business-productivity",
    "support-desk",
    "project-management",
    "engineering",
    "training",
    "qms",
    "tools",
    "external-client-access",
    "settings"
  ]'::jsonb;
  v_sub_modules jsonb;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '161_demo_fundraising_module_enablement: demo workspace missing — skipped';
    return;
  end if;

  -- Full catalogue sub-module keys for the modules above (matches module-catalogue.ts).
  v_sub_modules := '[
    "home:home",
    "executive-assistant:executive-assistant",
    "business-central:business-central-dashboard",
    "business-central:clients",
    "business-central:management",
    "business-central:grants",
    "intelligence:company-intelligence",
    "intelligence:client-intelligence",
    "intelligence:market-intelligence",
    "financials:financials",
    "financials:general-ledger",
    "financials:accounts-receivable",
    "financials:accounts-payable",
    "financials:expenses",
    "financials:wise",
    "financials:financial-reports",
    "fundraising:fundraising-dashboard",
    "fundraising:fundraising-investors",
    "fundraising:fundraising-cap-table",
    "fundraising:fundraising-pipeline",
    "fundraising:fundraising-meetings",
    "fundraising:fundraising-pitch-decks",
    "fundraising:fundraising-data-rooms",
    "board:board-dashboard",
    "board:board-meetings",
    "board:board-minutes",
    "board:board-members",
    "board:board-pack",
    "board:corporate-risk-register",
    "corporate-information:corporate-dashboard",
    "corporate-information:corporate-company-details",
    "operations:operations-dashboard",
    "marketing-events:oa-marketing-dashboard",
    "marketing-events:marketing-newsletter",
    "marketing-events:marketing-events",
    "marketing-events:marketing-event-management",
    "marketing-events:marketing-mailing-list",
    "marketing-events:portfolio-stories",
    "technology-management:technology-dashboard",
    "human-resources:hr-dashboard",
    "business-productivity:productivity-dashboard",
    "business-productivity:internal-work-packages",
    "support-desk:support-desk",
    "project-management:projects-dashboard",
    "engineering:engineering-dashboard",
    "engineering:engineering-programs",
    "engineering:engineering-capacity",
    "engineering:engineering-risks",
    "engineering:engineering-technical-files",
    "engineering:engineering-sops-dashboard",
    "training:training-dashboard",
    "qms:qms-dashboard",
    "tools:tools-dashboard",
    "external-client-access:external-client-access",
    "settings:settings"
  ]'::jsonb;

  insert into public.workspace_admin_metadata (
    workspace_id,
    enabled_modules,
    enabled_sub_modules
  )
  values (v_demo_id, v_modules, v_sub_modules)
  on conflict (workspace_id) do update
  set
    enabled_modules = excluded.enabled_modules,
    enabled_sub_modules = excluded.enabled_sub_modules,
    updated_at = now();
end $$;
