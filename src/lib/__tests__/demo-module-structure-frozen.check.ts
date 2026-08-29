/**
 * Demo module structure freeze — regression guard.
 *
 * Demo MUST remain on the complete central catalogue (22 modules, 157 submodules).
 * Fails if demo-provisioning or migration drift from module-catalogue.ts.
 *
 * Run: npm run prove:demo-module-structure
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEMO_CATALOGUE_MODULE_COUNT,
  DEMO_CATALOGUE_SUBMODULE_COUNT,
  DEMO_ENABLED_MODULES,
  DEMO_SLUG,
  demoCatalogueEnablement,
  demoEnabledSubModules,
} from "@/lib/platform-workspaces/demo-provisioning";
import {
  WORKSPACE_MODULE_CATALOGUE,
  WORKSPACE_CORE_MODULE_IDS,
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  subModuleKey,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

assert.equal(
  DEMO_CATALOGUE_MODULE_COUNT,
  22,
  "Central catalogue must expose 22 top-level modules",
);
assert.equal(
  DEMO_CATALOGUE_SUBMODULE_COUNT,
  157,
  "Central catalogue must expose 157 submodule keys",
);

assert.deepEqual(
  [...DEMO_ENABLED_MODULES],
  [...WORKSPACE_CORE_MODULE_IDS],
  "Demo enabled module IDs must equal WORKSPACE_CORE_MODULE_IDS",
);

const coreCatalogueSelection = {
  enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
  enabledSubModules: defaultEnabledSubModules([...WORKSPACE_CORE_MODULE_IDS]),
};

assert.deepEqual(
  demoEnabledSubModules().sort(),
  coreCatalogueSelection.enabledSubModules.sort(),
  "Demo enabled submodule IDs must equal core catalogue submodules",
);

assert.deepEqual(
  demoCatalogueEnablement().enabledModules.sort(),
  coreCatalogueSelection.enabledModules.sort(),
);
assert.deepEqual(
  demoCatalogueEnablement().enabledSubModules.sort(),
  coreCatalogueSelection.enabledSubModules.sort(),
);

assert.ok(
  UNIT311_PENDING_MIGRATIONS.includes(
    "supabase/migrations/168_demo_complete_catalogue_enablement.sql",
  ),
  "Migration 168 must be registered for Demo catalogue restore",
);

const migration168 = readFileSync(
  join(process.cwd(), "supabase/migrations/168_demo_complete_catalogue_enablement.sql"),
  "utf8",
);
assert.match(
  migration168,
  /22 modules, 157 submodules/,
  "Migration 168 header must document full catalogue counts",
);
assert.match(migration168, /"sales-management"/, "Migration 168 must include sales-management");
assert.match(
  migration168,
  /business-central:information-repository/,
  "Migration 168 must include Information Repository",
);
assert.match(migration168, /business-central:grants/, "Migration 168 must include Grant Management");

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: DEMO_SLUG,
  workspaceType: "Demo",
  enabledModules: [...DEMO_ENABLED_MODULES],
  enabledSubModules: demoEnabledSubModules(),
});

assert.equal(demoEnablement.enabledModules.length, 22);
assert.equal(demoEnablement.enabledSubModules.length, 157);

const nav = buildWorkspaceProductNavSections({
  workspaceSlug: DEMO_SLUG,
  workspaceType: "Demo",
  enablement: demoEnablement,
});

const topLevelLabels = nav.flatMap((section) =>
  section.kind === "pin"
    ? section.items.map((item) => item.label)
    : section.label
      ? [section.label]
      : [],
);

assert.equal(nav.length, WORKSPACE_CORE_MODULE_IDS.length);
assert.equal(topLevelLabels.length, WORKSPACE_CORE_MODULE_IDS.length);

assert.ok(topLevelLabels.includes("HOME"), "Demo nav must include HOME pin");
assert.ok(
  topLevelLabels.includes("EXECUTIVE ASSISTANT"),
  "Demo nav must include Executive Assistant pin",
);

const requiredWorkspaceSections = [
  "Northstar Intelligence",
  "Business Central",
  "Sales Management",
  "Finances",
  "Fundraising",
  "Board",
  "Corporate Information",
  "Operations",
  "Marketing & Events",
  "Technology Management",
  "Human Resources",
  "Business Productivity",
  "Support Desk",
  "Project Management",
  "Engineering",
  "Training",
  "QMS",
  "Tools",
  "External Client Access",
  "Settings",
];

for (const label of requiredWorkspaceSections) {
  assert.ok(topLevelLabels.includes(label), `Demo nav missing section: ${label}`);
}

function navModuleLabels(moduleLabel: string): string[] {
  const section = nav.find((entry) => entry.label === moduleLabel);
  if (!section || section.kind !== "workspace") return [];
  return section.items.flatMap((item) => [
    item.label,
    ...(item.children?.map((child) => child.label) ?? []),
  ]);
}

const bcLabels = navModuleLabels("Business Central");
for (const label of [
  "Dashboard",
  "Client Management",
  "Management",
  "Grant Management",
  "Information Repository",
]) {
  assert.ok(bcLabels.includes(label), `Business Central nav missing ${label}`);
}
assert.ok(bcLabels.includes("Client Directory"), "BC Client Management must include Client Directory");
assert.ok(bcLabels.includes("Client Dashboard"), "BC Client Management must include Client Dashboard");
assert.ok(bcLabels.includes("Management Dashboard"), "BC Management must include Management Dashboard");

const corporateSubs = getWorkspaceModuleEntry("corporate-information")?.subModules ?? [];
assert.equal(corporateSubs.length, 6, "Corporate Information catalogue must have 6 submodules");
for (const sub of corporateSubs) {
  assert.ok(
    demoEnablement.enabledSubModules.includes(subModuleKey("corporate-information", sub.id)),
    `Demo must enable corporate-information:${sub.id}`,
  );
}

const operationsSubs = getWorkspaceModuleEntry("operations")?.subModules ?? [];
assert.equal(operationsSubs.length, 5, "Operations catalogue must have 5 submodules");

const hrSubs = getWorkspaceModuleEntry("human-resources")?.subModules ?? [];
assert.equal(hrSubs.length, 8, "Human Resources catalogue must have 8 submodules");

const productivitySubs = getWorkspaceModuleEntry("business-productivity")?.subModules ?? [];
assert.ok(
  productivitySubs.some((sub) => sub.id === "internal-work-packages"),
  "Business Productivity catalogue must include internal-work-packages",
);

const engineeringSubs = getWorkspaceModuleEntry("engineering")?.subModules ?? [];
assert.ok(
  engineeringSubs.some((sub) => sub.id === "engineering-technical-files"),
  "Engineering must include technical files",
);
assert.ok(
  engineeringSubs.some((sub) => sub.id.startsWith("engineering-sops")),
  "Engineering must include SOP submodules",
);

// Partial metadata (migration 161 stale shape) must NOT satisfy the freeze.
const stale161Modules = [
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
  "settings",
];
const stale161Subs = [
  "home:home",
  "executive-assistant:executive-assistant",
  "business-central:business-central-dashboard",
  "business-central:clients",
  "business-central:management",
  "business-central:grants",
];
const staleEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: DEMO_SLUG,
  workspaceType: "Demo",
  enabledModules: stale161Modules,
  enabledSubModules: stale161Subs,
});
assert.notEqual(
  staleEnablement.enabledModules.length,
  22,
  "Stale 161 module list must be detected as incomplete (missing sales-management)",
);
assert.notEqual(
  staleEnablement.enabledSubModules.length,
  157,
  "Stale 161 submodule list must be detected as incomplete",
);

console.log("ok  demo-module-structure-frozen checks passed\n");
