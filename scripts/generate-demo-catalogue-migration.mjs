/**
 * Generate supabase/migrations/168_demo_complete_catalogue_enablement.sql
 * from module-catalogue.ts (allCatalogueModuleSelections).
 *
 *   npx tsx scripts/generate-demo-catalogue-migration.mjs
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { allCatalogueModuleSelections } from "../src/lib/platform-workspaces/module-catalogue.ts";

const { enabledModules, enabledSubModules } = allCatalogueModuleSelections();
const modulesJson = JSON.stringify(enabledModules);
const subModulesJson = JSON.stringify(enabledSubModules);

const sql = `-- Demo workspace: restore complete central catalogue enablement (${enabledModules.length} modules, ${enabledSubModules.length} submodules).
-- Authoritative source: module-catalogue.ts → allCatalogueModuleSelections()
-- Replaces stale partial list from 161_demo_fundraising_module_enablement.sql (21 modules, ~55 submodules).
-- Idempotent: safe to re-run.

do $$
declare
  v_demo_id uuid;
  v_modules jsonb := '${modulesJson}'::jsonb;
  v_sub_modules jsonb := '${subModulesJson}'::jsonb;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '168_demo_complete_catalogue_enablement: demo workspace missing — skipped';
    return;
  end if;

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
`;

const target = join(process.cwd(), "supabase/migrations/168_demo_complete_catalogue_enablement.sql");
writeFileSync(target, sql);
console.log(`Wrote ${target}`);
console.log(`Modules: ${enabledModules.length}, submodules: ${enabledSubModules.length}`);
