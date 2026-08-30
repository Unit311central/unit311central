/**
 * Operations — product taxonomy (Core Module → Core Features).
 *
 * Formalises the agreed Operations taxonomy against the EXISTING implementation.
 * Verification-only — does not change routing, views, provisioning, data, or other modules.
 *
 * Standard: 1 Core Module · 5 Core Features · 0 Core Sub-features · 0 Custom
 * OmniTransit / SAEC: Installations — Custom Feature · 3 Custom Sub-features
 *
 * Run: npm run prove:operations-taxonomy
 */
import assert from "node:assert/strict";

import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import {
  AUDITED_CORE_MODULE_IDS,
  buildCoreProductTaxonomy,
  buildCustomProductTaxonomy,
  buildWorkspaceArchitectureTaxonomy,
} from "@/lib/architecture-taxonomy";
import type { ArchitectureTaxonomyNode } from "@/lib/architecture-taxonomy-types";
import { demoCatalogueEnablement } from "@/lib/platform-workspaces/demo-provisioning";
import {
  OPERATIONS_CORE_FEATURES,
  OPERATIONS_CUSTOM_FEATURES,
  OPERATIONS_CUSTOM_SUB_FEATURES,
  OPERATIONS_MODULE_ID,
  OPERATIONS_MODULE_LABEL,
  SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL,
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES,
  operationsCoreFeatureCount,
  operationsCoreSubFeatureCount,
} from "@/lib/operations/operations-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { getWorkspaceModuleEntry } from "@/lib/platform-workspaces/module-catalogue";
import {
  SAEC_INSTALLATIONS_NAV_ITEM,
  augmentSaecOperationsNav,
} from "@/lib/saec/installations-nav";
import { saecEnabledSubModules } from "@/lib/platform-workspaces/saec-provisioning";
import { buildWorkspaceProductNavSections } from "@/lib/platform-workspaces/workspace-product-nav";
import { WORKSPACE_MODULE_IDS, defaultEnabledSubModules } from "@/lib/platform-workspaces/module-catalogue";

function child(node: ArchitectureTaxonomyNode, label: string): ArchitectureTaxonomyNode {
  const found = (node.children ?? []).find((entry) => entry.label === label);
  assert.ok(found, `expected child "${label}" under "${node.label}"`);
  return found!;
}

function labels(node: ArchitectureTaxonomyNode): string[] {
  return (node.children ?? []).map((entry) => entry.label);
}

function operationsNavSection() {
  const section = internalSurveyNavSections.find((entry) => entry.label === "Operations");
  assert.ok(section, "Operations nav section must exist");
  return section!;
}

// ---------------------------------------------------------------------------
// 1. Core Module
// ---------------------------------------------------------------------------
assert.equal(OPERATIONS_MODULE_ID, "operations");
assert.equal(OPERATIONS_MODULE_LABEL, "Operations");
assert.equal(getCanonicalModule(OPERATIONS_MODULE_ID)?.label, OPERATIONS_MODULE_LABEL);
assert.ok(getWorkspaceModuleEntry(OPERATIONS_MODULE_ID));

// ---------------------------------------------------------------------------
// 2. Five Core Features · zero Core Sub-features · zero standard Custom
// ---------------------------------------------------------------------------
assert.equal(operationsCoreFeatureCount(), 5);
assert.equal(operationsCoreSubFeatureCount(), 0);
assert.equal(OPERATIONS_CUSTOM_FEATURES.length, 0);
assert.equal(OPERATIONS_CUSTOM_SUB_FEATURES.length, 0);

// ---------------------------------------------------------------------------
// 3. Central nav matches taxonomy (view IDs preserved)
// ---------------------------------------------------------------------------
const opsNav = operationsNavSection();
assert.deepEqual(
  opsNav.items.map((item) => item.label),
  OPERATIONS_CORE_FEATURES.map((feature) => feature.label),
);
assert.deepEqual(
  opsNav.items.map((item) => item.view),
  OPERATIONS_CORE_FEATURES.map((feature) => feature.viewId),
);
for (const item of opsNav.items) {
  assert.equal((item.children ?? []).length, 0, `${item.label} has no nav children`);
}

// ---------------------------------------------------------------------------
// 4. Catalogue submodules align with Core Features (provisioning unchanged)
// ---------------------------------------------------------------------------
const catalogueSubs = getWorkspaceModuleEntry(OPERATIONS_MODULE_ID)?.subModules ?? [];
assert.equal(catalogueSubs.length, 5, "five catalogue submodules = five Core Features");
for (const feature of OPERATIONS_CORE_FEATURES) {
  const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
  assert.ok(sub, `catalogue submodule for ${feature.viewId}`);
  assert.equal(sub!.label, feature.label);
}

// ---------------------------------------------------------------------------
// 5. SAEC Installations custom feature (workspace-only, not in catalogue)
// ---------------------------------------------------------------------------
assert.equal(SAEC_INSTALLATIONS_NAV_ITEM.label, SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL);
assert.deepEqual(
  SAEC_INSTALLATIONS_NAV_ITEM.children?.map((entry) => entry.label),
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES.map((entry) => entry.label),
);
assert.deepEqual(
  SAEC_INSTALLATIONS_NAV_ITEM.children?.map((entry) => entry.view),
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES.map((entry) => entry.viewId),
);
assert.ok(
  !getWorkspaceModuleEntry(OPERATIONS_MODULE_ID)?.subModules.some((sub) =>
    sub.viewId?.startsWith("saec-installations"),
  ),
  "Installations is not a catalogue submodule",
);

const augmented = augmentSaecOperationsNav(opsNav.items);
const installations = augmented.find((item) => item.label === SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL);
assert.ok(installations?.children?.length === 3, "SAEC nav injects Installations after Dashboard");

const saecNav = buildWorkspaceProductNavSections({
  workspaceSlug: "saec",
  workspaceType: "Customer",
  enablement: {
    enabledModules: [...WORKSPACE_MODULE_IDS],
    enabledSubModules: saecEnabledSubModules(),
  },
});
const saecOps = saecNav.find((section) => section.label === "Operations");
assert.ok(saecOps?.items.some((item) => item.label === SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL));

const demoNav = buildWorkspaceProductNavSections({
  workspaceSlug: "demo",
  workspaceType: "Customer",
  enablement: demoCatalogueEnablement(),
});
const demoOps = demoNav.find((section) => section.label === "Operations");
assert.ok(
  demoOps?.items.every((item) => item.label !== SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL),
  "Demo standard Operations nav has no Installations",
);

// ---------------------------------------------------------------------------
// 6. Living Architecture — Operations AUDITED; OmniTransit Installations custom
// ---------------------------------------------------------------------------
assert.ok(AUDITED_CORE_MODULE_IDS.has(OPERATIONS_MODULE_ID));

const core = buildCoreProductTaxonomy();
const coreModules = child(core, "CORE MODULES");
const operations = child(coreModules, OPERATIONS_MODULE_LABEL);
assert.equal(operations.audited, true);
assert.deepEqual(labels(operations), OPERATIONS_CORE_FEATURES.map((feature) => feature.label));
for (const feature of OPERATIONS_CORE_FEATURES) {
  assert.equal(
    (child(operations, feature.label).children ?? []).length,
    0,
    `${feature.label} has no Core Sub-features in standard product`,
  );
}
assert.ok(
  !labels(operations).includes(SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL),
  "Core Product must not include SAEC Installations",
);

const custom = buildCustomProductTaxonomy();
const omnitransitCustom = child(child(custom, "CUSTOM FEATURES"), "OmniTransit");
const installationsFeature = child(omnitransitCustom, SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL);
assert.equal(installationsFeature.kind, "custom");
assert.deepEqual(
  labels(installationsFeature),
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES.map((entry) => entry.label),
);

const workspaces = buildWorkspaceArchitectureTaxonomy("all");
const omnitransit = child(workspaces, "OmniTransit");
const omnitransitCore = child(omnitransit, "CORE MODULES");
const omnitransitOps = child(omnitransitCore, OPERATIONS_MODULE_LABEL);
assert.deepEqual(labels(omnitransitOps), [
  "Dashboard",
  SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL,
  "Assets",
  "Inventory",
  "Procurement",
  "Logistics",
]);
const omnitransitInstallations = child(omnitransitOps, SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL);
assert.equal(omnitransitInstallations.kind, "custom");
assert.deepEqual(
  labels(omnitransitInstallations),
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES.map((entry) => entry.label),
);
assert.ok(
  child(omnitransit, "CUSTOM"),
  "OmniTransit CUSTOM group includes Installations",
);
assert.ok(
  child(child(omnitransit, "CUSTOM"), SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL),
);

const northstar = child(workspaces, "Northstar");
const northstarOps = child(child(northstar, "CORE MODULES"), OPERATIONS_MODULE_LABEL);
assert.deepEqual(
  labels(northstarOps),
  OPERATIONS_CORE_FEATURES.map((feature) => feature.label),
);
assert.equal((child(northstar, "CUSTOM").children ?? []).length, 0);

console.log(
  "prove:operations-taxonomy: OK — 1 Core Module, 5 Core Features, 0 Core Sub-features, 0 standard Custom; OmniTransit Installations custom feature preserved.",
);
