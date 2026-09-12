/**
 * Authoritative 22-module customer catalogue — provisioning must never use unit311 DB rows.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { WORKSPACES_MODULE_LABEL } from "@/lib/workspaces-nav";
import {
  CUSTOMER_MODULE_CATALOGUE_MODULE_COUNT,
  WORKSPACE_MODULE_CATALOGUE,
  WORKSPACE_MODULE_IDS,
  allCatalogueModuleSelections,
  allCatalogueProvisioningModuleKeys,
  assertExactlyCustomerCatalogueModuleCount,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  buildCustomerWorkspaceModuleConfiguration,
  CUSTOMER_MODULE_CATALOGUE_COUNT,
  isAuthoritativeCatalogueModuleKey,
  isCustomerCatalogueModuleId,
  isLegacySpecialistModuleKey,
  LEGACY_SPECIALIST_MODULE_KEYS,
  legacyModuleKeysOutsideCatalogue,
} from "@/lib/platform-workspaces/workspace-module-configuration";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import { setWorkspaceAdminRepositoryForTests } from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import { createWorkspaceAdminRecord } from "@/lib/platform-workspaces/workspace-admin-service";
import { workspaceCreateFixture } from "@/lib/platform-workspaces/workspace-create-test-fixture";

const AUTHORITATIVE_LABELS = [
  "HOME",
  "EXECUTIVE ASSISTANT",
  "INTELLIGENCE",
  "BUSINESS CENTRAL",
  "SALES MANAGEMENT",
  "FINANCES",
  "FUNDRAISING",
  "BOARD",
  "CORPORATE INFORMATION",
  "OPERATIONS",
  "MARKETING AND EVENTS",
  "TECH MGMT",
  "HUMAN RESOURCES",
  "BUSINESS PROD",
  "SUPPORT DESK",
  "PROJECT MANAGEMENT",
  "ENGINEERING",
  "TRAINING",
  "QMS",
  "TOOLS",
  "EXTERNAL CLIENT ACCESS",
  "SETTINGS",
] as const;

// 1. Customer catalogue contains exactly 22 modules.
assert.equal(CUSTOMER_MODULE_CATALOGUE_COUNT, 22);
assert.equal(CUSTOMER_MODULE_CATALOGUE_MODULE_COUNT, 22);
assert.equal(WORKSPACE_MODULE_CATALOGUE.length, 22);
assert.equal(WORKSPACE_MODULE_IDS.length, 22);
assert.deepEqual(
  WORKSPACE_MODULE_CATALOGUE.map((entry) => entry.label),
  [...AUTHORITATIVE_LABELS],
);

// 2. WORKSPACES is excluded.
assert.ok(!WORKSPACE_MODULE_IDS.some((id) => id.includes("workspace")));
assert.ok(!WORKSPACE_MODULE_CATALOGUE.some((entry) => entry.label === WORKSPACES_MODULE_LABEL));

// 3. WOLF is excluded.
assert.ok(!WORKSPACE_MODULE_IDS.some((id) => id.toLowerCase().includes("wolf")));
assert.ok(!WORKSPACE_MODULE_CATALOGUE.some((entry) => /wolf/i.test(entry.label)));

// 4. Legacy/specialist keys such as telemetry are excluded from catalogue.
for (const legacyKey of LEGACY_SPECIALIST_MODULE_KEYS) {
  assert.ok(isLegacySpecialistModuleKey(legacyKey));
  assert.ok(!isAuthoritativeCatalogueModuleKey(legacyKey), `${legacyKey} must not be catalogue`);
}
assert.ok(!allCatalogueProvisioningModuleKeys().includes("telemetry"));

// 5. Select All selects exactly 22 modules.
const selectAll = allCatalogueModuleSelections();
assert.equal(selectAll.enabledModules.length, 22);
assert.doesNotThrow(() => assertExactlyCustomerCatalogueModuleCount(selectAll.enabledModules));

// 6–7. All-modules provisioning uses catalogue keys only — no legacy rows inserted.
const allKeys = resolveProvisioningModuleKeys(
  selectAll.enabledModules,
  selectAll.enabledSubModules,
);
const configuration = buildCustomerWorkspaceModuleConfiguration(allKeys);
assert.equal(
  configuration.filter((row) => row.enabled).length,
  allKeys.length,
);
assert.ok(
  configuration.every((row) => isAuthoritativeCatalogueModuleKey(row.module_key)),
  "Configuration rows must only contain catalogue module keys",
);
assert.ok(
  configuration.every((row) => !isLegacySpecialistModuleKey(row.module_key)),
);

// 8. No WOLF module classified as CORE/customer catalogue.
assert.ok(!isCustomerCatalogueModuleId("wolf"));
assert.ok(!isCustomerCatalogueModuleId("wolf-ai"));

// 9. Module count is NOT derived from unit311.workspace_modules (repository source check).
const supabaseRepoSource = readFileSync(
  path.join(process.cwd(), "src/lib/platform-workspaces/workspace-admin-repository.supabase.ts"),
  "utf8",
);
assert.ok(
  !/countEnabledWorkspaceModules/.test(supabaseRepoSource),
  "Must not count enabled workspace_modules rows for catalogue size",
);
assert.ok(
  /buildCustomerWorkspaceModuleConfiguration/.test(supabaseRepoSource),
  "Provisioning must build module config from catalogue",
);
const migration171 = readFileSync(
  path.join(process.cwd(), "supabase/migrations/171_customer_provisioning_module_catalogue.sql"),
  "utf8",
);
assert.ok(
  !/insert into public\.workspace_modules[\s\S]*v_source_workspace_id/.test(migration171),
  "ensure_workspace_foundation must not clone template module rows",
);

// Template clone cleanup: legacy keys removed, catalogue keys only.
const templateClone = ["clients", "crm", "telemetry", "strategy", "wolf-specialist"];
const removable = legacyModuleKeysOutsideCatalogue(templateClone);
assert.deepEqual(removable.sort(), ["telemetry", "wolf-specialist"].sort());
assert.ok(!removable.includes("clients"));

// 10. Memory provision with all 22 modules reports catalogue count 22, not DB row count.
async function runAllModulesMemoryProvision() {
  process.env.WORKSPACE_ADMIN_REPOSITORY = "memory";
  setWorkspaceAdminRepositoryForTests(createMemoryWorkspaceAdminRepository());
  try {
    const created = await createWorkspaceAdminRecord(
      workspaceCreateFixture({
        name: "Catalogue All Modules Test",
        slug: `catalogue-all-${Date.now()}`,
        enabledModules: selectAll.enabledModules,
        enabledSubModules: selectAll.enabledSubModules,
      }),
      "customer-module-catalogue-test",
    );
    assert.equal(created.enabledModules.length, 22);
    assert.equal(created.enabledModuleCount, 22);
  } finally {
    delete process.env.WORKSPACE_ADMIN_REPOSITORY;
    setWorkspaceAdminRepositoryForTests(null);
  }
}

(async () => {
  await runAllModulesMemoryProvision();
  console.log("ok  customer module catalogue checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
