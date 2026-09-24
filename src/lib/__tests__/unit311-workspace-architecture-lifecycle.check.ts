/**
 * Unit311 workspace architecture registry — lifecycle bands + MAM tenancy guardrails.
 * Run: npm run prove:unit311-workspace-architecture-lifecycle
 */
import assert from "node:assert/strict";

import {
  buildArchitectureTaxonomy,
  buildCoreProductTaxonomy,
  buildWorkspaceArchitectureTaxonomy,
} from "@/lib/architecture-taxonomy";
import type { ArchitectureTaxonomyNode } from "@/lib/architecture-taxonomy-types";
import { MAM_HOST_ALIAS, MAM_SLUG } from "@/lib/mam/mam-surface";
import { WORKSPACE_CORE_MODULE_COUNT } from "@/lib/platform-workspaces/module-catalogue";
import {
  WORKSPACE_ARCHITECTURE_LIFECYCLE_LABEL,
  WORKSPACE_ARCHITECTURE_LIFECYCLE_SEQUENCE,
  WORKSPACE_ARCHITECTURE_REGISTRY_COUNT,
  UNIT311_WORKSPACE_UNIVERSE,
  countWorkspaceArchitectureByLifecycle,
  getWorkspaceUniverseEntryBySlug,
  workspaceArchitectureRegistryEntries,
} from "@/lib/platform-workspaces/unit311-workspace-universe";
import { sidebarConfigFromEnabledModuleIds } from "@/lib/platform-workspaces/workspace-sidebar-config";
import { unit311CentralEnabledCoreModuleIds } from "@/lib/platform-workspaces/workspace-architecture-enablement";
import { canonicalizeWorkspaceHostSubdomain } from "@/lib/platform-workspaces/workspace-host-alias-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

function child(node: ArchitectureTaxonomyNode, label: string): ArchitectureTaxonomyNode {
  const found = (node.children ?? []).find((entry) => entry.label === label);
  assert.ok(found, `missing child ${label}`);
  return found;
}

function workspaceInArchitecture(root: ArchitectureTaxonomyNode, label: string): ArchitectureTaxonomyNode {
  for (const lifecycle of root.children ?? []) {
    const match = lifecycle.children?.find((node) => node.label === label);
    if (match) return match;
  }
  assert.fail(`missing workspace ${label}`);
}

function labels(node: ArchitectureTaxonomyNode): string[] {
  return (node.children ?? []).map((entry) => entry.label);
}

function allWorkspaceNodes(root: ArchitectureTaxonomyNode): ArchitectureTaxonomyNode[] {
  return (root.children ?? []).flatMap((group) => group.children ?? []);
}

assert.equal(WORKSPACE_ARCHITECTURE_REGISTRY_COUNT, 13);
assert.equal(UNIT311_WORKSPACE_UNIVERSE.length, 13);

const lifecycleCounts = countWorkspaceArchitectureByLifecycle();
assert.equal(lifecycleCounts.active, 4);
assert.equal(lifecycleCounts.potential, 7);
assert.equal(lifecycleCounts.archived, 2);

const tree = buildWorkspaceArchitectureTaxonomy("all");
assert.deepEqual(
  labels(tree),
  WORKSPACE_ARCHITECTURE_LIFECYCLE_SEQUENCE.map(
    (lifecycle) => WORKSPACE_ARCHITECTURE_LIFECYCLE_LABEL[lifecycle],
  ),
);
assert.equal(allWorkspaceNodes(tree).length, 13);

for (const lifecycle of WORKSPACE_ARCHITECTURE_LIFECYCLE_SEQUENCE) {
  const group = child(tree, WORKSPACE_ARCHITECTURE_LIFECYCLE_LABEL[lifecycle]);
  assert.ok((group.children ?? []).length > 0, `${lifecycle} band must remain visible`);
}

const expectedLabels = [
  "Unit311 Central / Internal",
  "Demo / Northstar",
  "WOLF Central",
  "Interface Worx",
  "Talanton",
  "PAILEX",
  "MAM",
  "ABHI",
  "OmniTransit",
  "Amanah Surgical",
  "Green Desert",
  "CorpCentre",
  "OnwardAir",
];
assert.deepEqual(allWorkspaceNodes(tree).map((node) => node.label), expectedLabels);

const mamEntry = getWorkspaceUniverseEntryBySlug(MAM_SLUG);
assert.ok(mamEntry, "MAM registry entry required");
assert.equal(mamEntry?.lifecycle, "potential");
assert.equal(mamEntry?.slug, MAM_SLUG);
assert.equal(mamEntry?.architectureId, MAM_SLUG);

assert.equal(
  canonicalizeWorkspaceHostSubdomain(MAM_HOST_ALIAS, MAM_SLUG),
  MAM_SLUG,
  "mam host resolves through normal workspace host canonicalization when DB alias present",
);
assert.equal(
  canonicalizeWorkspaceHostSubdomain(MAM_HOST_ALIAS, null),
  MAM_HOST_ALIAS,
  "mam host without DB row keeps subdomain until alias registered",
);

const northstarEntries = workspaceArchitectureRegistryEntries("northstar");
assert.equal(northstarEntries.length, 1);
assert.equal(northstarEntries[0]?.slug, "demo");
assert.equal(northstarEntries[0]?.architectureId, "northstar");

assert.ok(getWorkspaceUniverseEntryBySlug(WOLF_CENTRAL_SLUG));
assert.ok(workspaceInArchitecture(tree, "WOLF Central"));

const archived = child(tree, "ARCHIVED");
assert.deepEqual(labels(archived), ["CorpCentre", "OnwardAir"]);

const coreProductModules = labels(child(buildCoreProductTaxonomy(), "CORE MODULES"));
assert.equal(coreProductModules.length, WORKSPACE_CORE_MODULE_COUNT);

const unit311Snapshot = sidebarConfigFromEnabledModuleIds([
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
])!;
const enabledCore = unit311CentralEnabledCoreModuleIds(unit311Snapshot);
assert.equal(enabledCore.length, 17);
for (const disabled of ["engineering", "qms", "fundraising", "board", "training"]) {
  assert.ok(!enabledCore.includes(disabled));
}

const unit311Tree = buildWorkspaceArchitectureTaxonomy(INTERNAL_WORKSPACE_SLUG, {
  unit311SidebarConfig: unit311Snapshot,
});
const unit311Ws = workspaceInArchitecture(unit311Tree, "Unit311 Central / Internal");
const unit311Core = labels(child(unit311Ws, "CORE MODULES"));
assert.ok(!unit311Core.includes("Engineering"));
assert.ok(!unit311Core.includes("QMS"));
assert.deepEqual(labels(child(unit311Ws, "PLATFORM NAVIGATION")), [
  "Analytics",
  "Support",
  "Workspaces",
]);

const viaApi = buildArchitectureTaxonomy("workspace-architecture", {
  workspace: "all",
  unit311SidebarConfig: unit311Snapshot,
});
assert.ok(viaApi);

console.log(
  "prove:unit311-workspace-architecture-lifecycle: OK — 13 workspaces in Active/Potential/Archived bands; MAM slug=mam lifecycle=potential.",
);
