/**
 * Business Productivity — product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Formalises the agreed Business Productivity taxonomy against the EXISTING implementation.
 * Verification-only — does not change routing, views, provisioning, data, or other modules.
 *
 *   1 Core Module · 9 Core Features · 3 Core Sub-features · 0 Custom
 *
 * Run: npm run prove:business-productivity-taxonomy
 */
import assert from "node:assert/strict";

import {
  AUDITED_CORE_MODULE_IDS,
  buildCoreProductTaxonomy,
} from "@/lib/architecture-taxonomy";
import type { ArchitectureTaxonomyNode } from "@/lib/architecture-taxonomy-types";
import {
  BUSINESS_PRODUCTIVITY_CORE_FEATURES,
  BUSINESS_PRODUCTIVITY_CUSTOM_FEATURES,
  BUSINESS_PRODUCTIVITY_CUSTOM_SUB_FEATURES,
  BUSINESS_PRODUCTIVITY_EXCLUDED_VIEW_IDS,
  BUSINESS_PRODUCTIVITY_MODULE_ID,
  BUSINESS_PRODUCTIVITY_MODULE_LABEL,
  businessProductivityCoreFeatureCount,
  businessProductivityCoreSubFeatureCount,
  businessProductivityTaxonomyViewIds,
} from "@/lib/business-productivity/business-productivity-taxonomy";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import {
  buildCentralBusinessProductivityNavSection,
  buildCentralMarketingEventsNavSection,
} from "@/lib/platform-workspaces/central-product-nav";
import { getWorkspaceModuleEntry } from "@/lib/platform-workspaces/module-catalogue";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

function child(node: ArchitectureTaxonomyNode, label: string): ArchitectureTaxonomyNode {
  const found = (node.children ?? []).find((entry) => entry.label === label);
  assert.ok(found, `expected child "${label}" under "${node.label}"`);
  return found!;
}

function labels(node: ArchitectureTaxonomyNode): string[] {
  return (node.children ?? []).map((entry) => entry.label);
}

// ---------------------------------------------------------------------------
// 1. Core Module
// ---------------------------------------------------------------------------
assert.equal(BUSINESS_PRODUCTIVITY_MODULE_ID, "business-productivity");
assert.equal(BUSINESS_PRODUCTIVITY_MODULE_LABEL, "Business Productivity");
assert.equal(getCanonicalModule(BUSINESS_PRODUCTIVITY_MODULE_ID)?.label, BUSINESS_PRODUCTIVITY_MODULE_LABEL);
assert.ok(getWorkspaceModuleEntry(BUSINESS_PRODUCTIVITY_MODULE_ID));

// ---------------------------------------------------------------------------
// 2. Counts — nine Core Features · three Core Sub-features · zero Custom
// ---------------------------------------------------------------------------
assert.equal(businessProductivityCoreFeatureCount(), 9);
assert.equal(businessProductivityCoreSubFeatureCount(), 3);
assert.equal(BUSINESS_PRODUCTIVITY_CUSTOM_FEATURES.length, 0);
assert.equal(BUSINESS_PRODUCTIVITY_CUSTOM_SUB_FEATURES.length, 0);

// ---------------------------------------------------------------------------
// 3. Canonical feature tree (labels + view IDs preserved)
// ---------------------------------------------------------------------------
assert.deepEqual(
  BUSINESS_PRODUCTIVITY_CORE_FEATURES.map((feature) => feature.label),
  [
    "Dashboard",
    "Content Studio",
    "Internal Work Packages",
    "File Explorer",
    "Email",
    "Calendar",
    "Messaging",
    "Communications",
    "Whiteboard",
  ],
);
const fileExplorer = BUSINESS_PRODUCTIVITY_CORE_FEATURES.find((feature) => feature.label === "File Explorer");
assert.ok(fileExplorer?.subFeatures?.length === 3);
assert.deepEqual(
  fileExplorer?.subFeatures?.map((sub) => sub.label),
  ["Internal Files", "External Files", "Client Explorer"],
);
assert.deepEqual(
  fileExplorer?.subFeatures?.map((sub) => sub.viewId),
  ["files-internal", "files-external", "files-client"],
);
assert.equal(fileExplorer?.viewId, undefined, "File Explorer is a nav group — no parent view ID");

// ---------------------------------------------------------------------------
// 4. Canonical exclusions
// ---------------------------------------------------------------------------
for (const excluded of BUSINESS_PRODUCTIVITY_EXCLUDED_VIEW_IDS) {
  assert.ok(
    !businessProductivityTaxonomyViewIds().includes(excluded),
    `${excluded} must not appear in canonical BP taxonomy view IDs`,
  );
}

const centralBp = buildCentralBusinessProductivityNavSection();
const centralJson = JSON.stringify(centralBp);
for (const excluded of ["social", "management"] as const) {
  assert.ok(!centralJson.includes(`"view":"${excluded}"`), `central BP nav must not include ${excluded}`);
}

const marketing = buildCentralMarketingEventsNavSection();
assert.ok(
  marketing.items.some((item) => item.view === "social"),
  "Social belongs under Marketing & Events, not Business Productivity",
);

// Raw internal nav may still list Social under BP — canonical taxonomy excludes it.
const internalBp = internalSurveyNavSections.find((section) => section.label === BUSINESS_PRODUCTIVITY_MODULE_LABEL);
assert.ok(
  internalBp?.items.some((item) => item.view === "social"),
  "internal raw nav may retain legacy Social placement (not canonical taxonomy)",
);

// ---------------------------------------------------------------------------
// 5. Central nav aligns with canonical taxonomy (structure preserved)
// ---------------------------------------------------------------------------
assert.equal(centralBp.label, BUSINESS_PRODUCTIVITY_MODULE_LABEL);
assert.deepEqual(
  centralBp.items.map((item) => item.label),
  BUSINESS_PRODUCTIVITY_CORE_FEATURES.map((feature) => feature.label),
);
const centralFileExplorer = centralBp.items.find((item) => item.label === "File Explorer");
assert.deepEqual(
  centralFileExplorer?.children?.map((child) => child.label),
  fileExplorer?.subFeatures?.map((sub) => sub.label),
);
assert.deepEqual(
  centralFileExplorer?.children?.map((child) => child.view),
  fileExplorer?.subFeatures?.map((sub) => sub.viewId),
);
for (const item of centralBp.items) {
  if (item.label === "File Explorer") continue;
  assert.equal((item.children ?? []).length, 0, `${item.label} is a leaf in central nav`);
}

// ---------------------------------------------------------------------------
// 6. Catalogue submodules — eleven flat leaves (provisioning structure ≠ taxonomy tree)
// ---------------------------------------------------------------------------
const catalogueSubs = getWorkspaceModuleEntry(BUSINESS_PRODUCTIVITY_MODULE_ID)?.subModules ?? [];
assert.equal(
  catalogueSubs.length,
  11,
  "eleven catalogue submodule leaves (flat provisioning; File Explorer is not a catalogue row)",
);
assert.deepEqual(
  catalogueSubs.map((sub) => sub.viewId).sort(),
  businessProductivityTaxonomyViewIds().sort(),
  "catalogue view IDs match canonical taxonomy leaves",
);
assert.ok(
  !catalogueSubs.some((sub) => sub.viewId === "social"),
  "catalogue must not place Social under Business Productivity",
);

// ---------------------------------------------------------------------------
// 7. Living Architecture — Business Productivity AUDITED
// ---------------------------------------------------------------------------
assert.ok(AUDITED_CORE_MODULE_IDS.has(BUSINESS_PRODUCTIVITY_MODULE_ID));

const core = buildCoreProductTaxonomy();
const coreModules = child(core, "CORE MODULES");
const productivity = child(coreModules, BUSINESS_PRODUCTIVITY_MODULE_LABEL);
assert.equal(productivity.audited, true);
assert.deepEqual(
  labels(productivity),
  BUSINESS_PRODUCTIVITY_CORE_FEATURES.map((feature) => feature.label),
);
const architectureFileExplorer = child(productivity, "File Explorer");
assert.deepEqual(labels(architectureFileExplorer), [
  "Internal Files",
  "External Files",
  "Client Explorer",
]);
for (const featureLabel of [
  "Dashboard",
  "Content Studio",
  "Internal Work Packages",
  "Email",
  "Calendar",
  "Messaging",
  "Communications",
  "Whiteboard",
]) {
  assert.equal(
    (child(productivity, featureLabel).children ?? []).length,
    0,
    `${featureLabel} has no Core Sub-features`,
  );
}

console.log(
  "prove:business-productivity-taxonomy: OK — 1 Core Module, 9 Core Features, 3 Core Sub-features, 0 Custom; File Explorer grouped; Social/Management excluded; catalogue flat leaves preserved.",
);
