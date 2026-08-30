/**
 * Living Architecture taxonomy — Core Product / Custom Product / Workspace Architecture.
 *
 * Verifies the derived hierarchies without touching any module, provisioning, or the
 * existing React Flow diagrams.
 *
 * Run: npm run prove:architecture-taxonomy
 */
import assert from "node:assert/strict";

import {
  AUDITED_CORE_MODULE_IDS,
  buildArchitectureTaxonomy,
  buildCoreProductTaxonomy,
  buildCustomProductTaxonomy,
  buildWorkspaceArchitectureTaxonomy,
} from "@/lib/architecture-taxonomy";
import {
  ARCHITECTURE_TREE_SLUGS,
  isArchitectureTreeSlug,
  type ArchitectureTaxonomyNode,
} from "@/lib/architecture-taxonomy-types";
import { ARCHITECTURE_DIAGRAM_CATALOG } from "@/lib/architecture-diagram-data";
import { CORPORATE_INFORMATION_CORE_FEATURES } from "@/lib/corporate-information/corporate-information-taxonomy";
import { HOME_MODULE_LABEL } from "@/lib/home/home-taxonomy";
import { buildCentralProductNavSections } from "@/lib/platform-workspaces/central-product-nav";

function child(node: ArchitectureTaxonomyNode, label: string): ArchitectureTaxonomyNode {
  const found = (node.children ?? []).find((c) => c.label === label);
  assert.ok(found, `expected child "${label}" under "${node.label}"`);
  return found!;
}

function labels(node: ArchitectureTaxonomyNode): string[] {
  return (node.children ?? []).map((c) => c.label);
}

// ---------------------------------------------------------------------------
// Renderer selection + internal-only catalogue wiring.
// ---------------------------------------------------------------------------
const catalogBySlug = new Map(ARCHITECTURE_DIAGRAM_CATALOG.map((e) => [e.sectionSlug, e]));
for (const slug of Object.values(ARCHITECTURE_TREE_SLUGS)) {
  const entry = catalogBySlug.get(slug);
  assert.ok(entry, `catalog must contain tree entry ${slug}`);
  assert.equal(entry!.renderer, "tree", `${slug} must use the tree renderer`);
  assert.ok(!entry!.seedTemplate, `${slug} must not seed a React Flow document`);
  assert.ok(isArchitectureTreeSlug(slug));
}
// Existing canvas diagrams remain canvas (renderer omitted or "canvas").
for (const slug of ["platform-overview", "vercel-stack", "supabase-stack", "codebase-stack"]) {
  const entry = catalogBySlug.get(slug);
  assert.ok(entry, `existing diagram ${slug} present`);
  assert.notEqual(entry!.renderer, "tree", `${slug} must not become a tree`);
}
// The tree views are not customer product modules (internal-only surface).
const productModuleIds = new Set(buildCentralProductNavSections().map((s) => s.id));
for (const slug of Object.values(ARCHITECTURE_TREE_SLUGS)) {
  assert.ok(!productModuleIds.has(slug), `${slug} must not be a customer product module`);
}
assert.equal(buildArchitectureTaxonomy("platform-overview"), null, "non-tree slug yields no taxonomy");

// ---------------------------------------------------------------------------
// VIEW 1 — Core Product.
// ---------------------------------------------------------------------------
const core = buildCoreProductTaxonomy();
assert.equal(core.label, "UNIT311 CENTRAL");
assert.equal(core.level, "root");
const coreModules = child(core, "CORE MODULES");
assert.equal(coreModules.level, "group");
assert.equal(coreModules.kind, "core");
const expectedCoreCount = buildCentralProductNavSections().filter(
  (spec) => !spec.id.startsWith("wolf-"),
).length;
assert.equal(
  (coreModules.children ?? []).length,
  expectedCoreCount,
  "Core Product lists every standard Core Module (WOLF specialist modules excluded)",
);
assert.ok(
  !(coreModules.children ?? []).some((mod) => /^wolf/i.test(mod.label)),
  "Core Product must not include WOLF specialist modules",
);

// Audited modules expose Features/Sub-features; unaudited stay at module level.
const bc = child(coreModules, "Business Central");
assert.equal(bc.audited, true);
assert.deepEqual(labels(bc), [
  "Dashboard",
  "Client Management",
  "Management",
  "Information Repository",
]);
assert.deepEqual(labels(child(bc, "Client Management")), ["Client Dashboard", "Client Directory"]);
assert.deepEqual(labels(child(bc, "Management")), [
  "Management Dashboard",
  "Meetings",
  "Function Packs",
  "Actions & Decisions",
]);

const sm = child(coreModules, "Sales Management");
assert.equal(sm.audited, true);
assert.deepEqual(labels(sm), ["Dashboard", "Overview", "Management", "Sales"]);
assert.deepEqual(labels(child(sm, "Overview")), ["My Sales", "Sales Team"]);
assert.deepEqual(labels(child(sm, "Management")), [
  "Targets & Forecast",
  "Performance",
  "Forecast",
  "Commissions",
  "Reports",
]);
assert.deepEqual(labels(child(sm, "Sales")), [
  "Prospects",
  "Opportunities",
  "Pipeline",
  "Discovery",
  "Activities",
  "Sales Quotes",
  "Partners",
]);

const intel = child(coreModules, "Intelligence");
assert.equal(intel.audited, true);
assert.deepEqual(labels(intel), [
  "Dashboard",
  "Company Intelligence",
  "Client Intelligence",
  "Market Intelligence",
]);

// Home is formally audited → module-level leaf (0 Core Features).
const home = child(coreModules, HOME_MODULE_LABEL);
assert.equal(home.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("home"));
assert.equal((home.children ?? []).length, 0, "Home has no Core Features");

// Corporate Information is now formally audited → Core Features + Core Sub-features.
const corp = child(coreModules, "Corporate Information");
assert.equal(corp.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("corporate-information"));
assert.deepEqual(
  labels(corp),
  CORPORATE_INFORMATION_CORE_FEATURES.map((feature) => feature.label),
);
for (const feature of CORPORATE_INFORMATION_CORE_FEATURES) {
  const node = child(corp, feature.label);
  if (feature.subFeature) {
    assert.deepEqual(labels(node), [feature.subFeature.label], `${feature.label} Core Sub-feature`);
  } else {
    assert.equal((node.children ?? []).length, 0, `${feature.label} has no Core Sub-feature`);
  }
}

// Fundraising audit is in progress → must remain UNAUDITED (module level only).
const fundraising = child(coreModules, "Fundraising");
assert.equal(fundraising.audited, false);
assert.equal((fundraising.children ?? []).length, 0, "unaudited module has no features");
assert.ok(!AUDITED_CORE_MODULE_IDS.has("fundraising"));

// Every unaudited module must have zero children (only audited taxonomy is classified).
for (const mod of coreModules.children ?? []) {
  if (mod.audited) continue;
  assert.equal(
    (mod.children ?? []).length,
    0,
    `unaudited module "${mod.label}" must not expose Features`,
  );
}

// ---------------------------------------------------------------------------
// VIEW 2 — Custom Product (only ABHI Regulatory Intelligence today).
// ---------------------------------------------------------------------------
const custom = buildCustomProductTaxonomy();
const customModules = child(custom, "CUSTOM MODULES");
assert.equal((customModules.children ?? []).length, 0, "no custom modules identified yet");
const customFeatures = child(custom, "CUSTOM FEATURES");
const abhi = child(customFeatures, "ABHI");
const regIntel = child(abhi, "Regulatory Intelligence");
assert.equal(regIntel.kind, "custom");
assert.equal(regIntel.level, "feature");
assert.deepEqual(labels(regIntel), [
  "Dashboard",
  "Regulatory Updates",
  "Impact Assessments",
  "Member Alerts",
]);
for (const sub of regIntel.children ?? []) {
  assert.equal(sub.kind, "custom");
  assert.equal(sub.level, "sub-feature");
}

// ---------------------------------------------------------------------------
// VIEW 3 — Workspace Architecture.
// ---------------------------------------------------------------------------
const workspaces = buildWorkspaceArchitectureTaxonomy("all");
assert.deepEqual(labels(workspaces), [
  "Northstar",
  "ABHI",
  "OmniTransit",
  "Amanah",
  "InterfaceWorx",
  "GreenDesert",
]);

const abhiWs = child(workspaces, "ABHI");
const abhiCore = child(abhiWs, "CORE MODULES");
const abhiCustom = child(abhiWs, "CUSTOM");
assert.ok(child(abhiCustom, "Regulatory Intelligence"), "ABHI CUSTOM has Regulatory Intelligence");
// ABHI Business Central shows Member terminology.
const abhiBc = child(abhiCore, "Business Central");
assert.ok(labels(abhiBc).includes("Member Management"), "ABHI BC uses Member terminology");

// Non-ABHI workspace has no custom items.
const northstar = child(workspaces, "Northstar");
const northstarCustom = child(northstar, "CUSTOM");
assert.equal((northstarCustom.children ?? []).length, 0, "Northstar has no custom items");

// Workspace filter narrows to a single workspace.
const onlyAbhi = buildWorkspaceArchitectureTaxonomy("abhi");
assert.deepEqual(labels(onlyAbhi), ["ABHI"]);

console.log(
  "prove:architecture-taxonomy: OK — Core Product (audited-only), Custom Product (ABHI Regulatory Intelligence), Workspace Architecture (6 workspaces) verified.",
);
