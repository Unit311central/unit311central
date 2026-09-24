/**
 * Unit311 Central Workspace Architecture — sidebar enablement guardrails.
 * Run: npm run prove:unit311-workspace-architecture
 */
import assert from "node:assert/strict";

import {
  buildArchitectureTaxonomy,
  buildCoreProductTaxonomy,
  buildWorkspaceArchitectureTaxonomy,
} from "@/lib/architecture-taxonomy";
import { ENGINEERING_MODULE_ID } from "@/lib/engineering/engineering-taxonomy";
import { QMS_MODULE_ID } from "@/lib/qms/qms-taxonomy";
import { OPERATIONS_CORE_FEATURES } from "@/lib/operations/operations-taxonomy";
import {
  WORKSPACE_CORE_MODULE_IDS,
  getWorkspaceModuleEntry,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  sidebarConfigFromEnabledModuleIds,
} from "@/lib/platform-workspaces/workspace-sidebar-config";
import {
  unit311CentralEnabledCoreModuleIds,
} from "@/lib/platform-workspaces/workspace-architecture-enablement";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

function child(parent: { children?: { label: string; children?: unknown[] }[] }, label: string) {
  const node = parent.children?.find((entry) => entry.label === label);
  assert.ok(node, `missing child ${label}`);
  return node!;
}

function labels(node: { children?: { label: string }[] }): string[] {
  return (node.children ?? []).map((entry) => entry.label);
}

/** Approved live Unit311 Central enablement (fixture simulating workspace_sidebar_modules / whoami). */
function approvedUnit311SidebarSnapshot() {
  const enabledModuleIds = [
    "home",
    "executive-assistant",
    "business-central",
    "financials",
    "intelligence",
    "sales-management",
    "corporate-information",
    "operations",
    "marketing-events",
    "technology-management",
    "human-resources",
    "business-productivity",
    "support-desk",
    "project-management",
    "tools",
    "external-client-access",
    "settings",
  ];
  const fromWhoami = sidebarConfigFromEnabledModuleIds(enabledModuleIds);
  assert.ok(fromWhoami, "fixture enablement must produce sidebar snapshot");
  return fromWhoami;
}

const snapshot = approvedUnit311SidebarSnapshot();
const enabledCoreIds = unit311CentralEnabledCoreModuleIds(snapshot);

assert.equal(
  enabledCoreIds.length,
  17,
  "approved fixture must yield 17 enabled core catalogue modules",
);
assert.ok(!enabledCoreIds.includes(ENGINEERING_MODULE_ID));
assert.ok(!enabledCoreIds.includes(QMS_MODULE_ID));
assert.ok(!enabledCoreIds.includes("fundraising"));
assert.ok(!enabledCoreIds.includes("board"));
assert.ok(!enabledCoreIds.includes("training"));

const unit311Tree = buildWorkspaceArchitectureTaxonomy(INTERNAL_WORKSPACE_SLUG, {
  unit311SidebarConfig: snapshot,
});
const unit311Ws = unit311Tree.children?.[0];
assert.equal(unit311Ws?.label, "Unit311 Central");

const coreGroup = child(unit311Ws!, "CORE MODULES");
const coreLabels = labels(coreGroup);
assert.ok(!coreLabels.includes("Engineering"));
assert.ok(!coreLabels.includes("QMS"));
assert.ok(coreLabels.includes("Operations"));
assert.ok(coreLabels.includes("Intelligence"));

const platformGroup = child(unit311Ws!, "PLATFORM NAVIGATION");
assert.deepEqual(labels(platformGroup), ["Analytics", "Support", "Workspaces"]);
for (const platformNode of platformGroup.children ?? []) {
  assert.equal(platformNode.kind, "structural");
}

const operations = child(coreGroup, "Operations");
assert.deepEqual(
  labels(operations),
  OPERATIONS_CORE_FEATURES.map((feature) => feature.label),
  "enabled Unit311 modules use canonical Core Product feature definitions",
);

const coreProduct = buildCoreProductTaxonomy();
const coreProductModuleLabels = labels(child(coreProduct, "CORE MODULES"));
assert.ok(coreProductModuleLabels.includes("Engineering"));
assert.ok(coreProductModuleLabels.includes("QMS"));

const talanton = buildWorkspaceArchitectureTaxonomy(TALANTON_IMPACT_SLUG);
const talantonCoreLabels = labels(child(talanton.children![0]!, "CORE MODULES"));
assert.equal(
  talantonCoreLabels.length,
  WORKSPACE_CORE_MODULE_IDS.length,
  "Talanton db-driven path unchanged (full core catalogue)",
);

const northstar = buildWorkspaceArchitectureTaxonomy("northstar");
const northstarCoreLabels = labels(child(northstar.children![0]!, "CORE MODULES"));
assert.equal(
  northstarCoreLabels.length,
  WORKSPACE_CORE_MODULE_IDS.length,
  "Northstar full-core mapping unchanged",
);

const withoutSnapshot = buildWorkspaceArchitectureTaxonomy(INTERNAL_WORKSPACE_SLUG);
assert.equal(
  labels(child(withoutSnapshot.children![0]!, "CORE MODULES")).length,
  0,
  "Unit311 must not fall back to WORKSPACE_CORE_MODULE_IDS when snapshot missing",
);

assert.notEqual(
  enabledCoreIds.length,
  WORKSPACE_CORE_MODULE_IDS.length,
  "Unit311 enablement fixture must not equal full WORKSPACE_CORE_MODULE_IDS list",
);

for (const moduleId of enabledCoreIds) {
  assert.ok(
    getWorkspaceModuleEntry(moduleId),
    `enabled module ${moduleId} must exist in catalogue`,
  );
}

const viaApiShape = buildArchitectureTaxonomy("workspace-architecture", {
  workspace: INTERNAL_WORKSPACE_SLUG,
  unit311SidebarConfig: snapshot,
});
assert.ok(viaApiShape?.children?.some((ws) => ws.label === "Unit311 Central"));

console.log(
  "prove:unit311-workspace-architecture: OK — Unit311 Central tree driven by sidebar snapshot; Engineering/QMS excluded; Core Product unchanged.",
);
