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
import { BOARD_CORE_FEATURES } from "@/lib/board/board-taxonomy";
import { BUSINESS_PRODUCTIVITY_CORE_FEATURES } from "@/lib/business-productivity/business-productivity-taxonomy";
import { CORPORATE_INFORMATION_CORE_FEATURES } from "@/lib/corporate-information/corporate-information-taxonomy";
import { HOME_MODULE_LABEL } from "@/lib/home/home-taxonomy";
import { MARKETING_EVENTS_CORE_FEATURES, ABHI_MARKETING_CUSTOM_FEATURES, MARKETING_EVENTS_MODULE_LABEL } from "@/lib/marketing-events/marketing-events-taxonomy";
import {
  OPERATIONS_CORE_FEATURES,
  SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL,
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES,
} from "@/lib/operations/operations-taxonomy";
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

// Fundraising is formally audited → Core Features + Core Sub-features.
const fundraising = child(coreModules, "Fundraising");
assert.equal(fundraising.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("fundraising"));
assert.deepEqual(labels(fundraising), [
  "Dashboard",
  "Investors",
  "Cap Table Management",
  "Pipeline",
  "Meetings",
  "Pitch Decks",
  "Data Rooms",
  "Grant Management",
]);
const grantMgmt = child(fundraising, "Grant Management");
assert.deepEqual(labels(grantMgmt), [
  "KPI Summary",
  "Pipeline by Status",
  "Funding by Programme",
  "Submissions vs Approvals",
  "Grant Applications",
]);
const capTableMgmt = child(fundraising, "Cap Table Management");
assert.deepEqual(labels(capTableMgmt), [
  "Overview",
  "Shareholders",
  "Option Pool",
  "Share Capital",
]);
for (const featureLabel of [
  "Dashboard",
  "Investors",
  "Pipeline",
  "Meetings",
  "Pitch Decks",
  "Data Rooms",
]) {
  assert.equal(
    (child(fundraising, featureLabel).children ?? []).length,
    0,
    `${featureLabel} must not expose sub-features`,
  );
}

// Operations is formally audited → five Core Features, zero Core Sub-features.
const operations = child(coreModules, "Operations");
assert.equal(operations.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("operations"));
assert.deepEqual(
  labels(operations),
  OPERATIONS_CORE_FEATURES.map((feature) => feature.label),
);
for (const feature of OPERATIONS_CORE_FEATURES) {
  assert.equal(
    (child(operations, feature.label).children ?? []).length,
    0,
    `${feature.label} has no Core Sub-features`,
  );
}
assert.ok(
  !labels(operations).includes(SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL),
  "Core Product Operations must not include SAEC Installations",
);

// Board is formally audited → six Core Features, no Core Sub-features.
const board = child(coreModules, "Board");
assert.equal(board.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("board"));
assert.deepEqual(
  labels(board),
  BOARD_CORE_FEATURES.map((feature) => feature.label),
);
for (const feature of BOARD_CORE_FEATURES) {
  assert.equal(
    (child(board, feature.label).children ?? []).length,
    0,
    `${feature.label} must not expose Core Sub-features`,
  );
}

// Marketing & Events is formally audited → seven Core Features, zero Core Sub-features.
const marketingEvents = child(coreModules, MARKETING_EVENTS_MODULE_LABEL);
assert.equal(marketingEvents.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("marketing-events"));
assert.deepEqual(
  labels(marketingEvents),
  MARKETING_EVENTS_CORE_FEATURES.map((feature) => feature.label),
);
for (const feature of MARKETING_EVENTS_CORE_FEATURES) {
  assert.equal(
    (child(marketingEvents, feature.label).children ?? []).length,
    0,
    `${feature.label} has no Core Sub-features`,
  );
}
for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.ok(
    !labels(marketingEvents).includes(custom.label),
    `Core Product must not include ABHI custom ${custom.label}`,
  );
}

// Business Productivity is formally audited → nine Core Features, three Core Sub-features.
const productivity = child(coreModules, "Business Productivity");
assert.equal(productivity.audited, true);
assert.ok(AUDITED_CORE_MODULE_IDS.has("business-productivity"));
assert.deepEqual(
  labels(productivity),
  BUSINESS_PRODUCTIVITY_CORE_FEATURES.map((feature) => feature.label),
);
const bpFileExplorer = child(productivity, "File Explorer");
assert.deepEqual(labels(bpFileExplorer), [
  "Internal Files",
  "External Files",
  "Client Explorer",
]);
for (const feature of BUSINESS_PRODUCTIVITY_CORE_FEATURES) {
  if (feature.subFeatures?.length) continue;
  assert.equal(
    (child(productivity, feature.label).children ?? []).length,
    0,
    `${feature.label} must not expose Core Sub-features`,
  );
}
assert.ok(
  !labels(productivity).includes("Social"),
  "Core Product Business Productivity must not include Social",
);

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
// VIEW 2 — Custom Product (ABHI Regulatory Intelligence + OmniTransit Installations).
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
for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  const node = child(abhi, custom.label);
  assert.equal(node.kind, "custom");
  assert.equal(node.level, "feature");
  assert.equal((node.children ?? []).length, 0, `${custom.label} has no sub-features`);
}

const omnitransitCustom = child(customFeatures, "OmniTransit");
const installationsFeature = child(omnitransitCustom, SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL);
assert.equal(installationsFeature.kind, "custom");
assert.deepEqual(
  labels(installationsFeature),
  SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES.map((entry) => entry.label),
);
for (const sub of installationsFeature.children ?? []) {
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
for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.ok(child(abhiCustom, custom.label), `ABHI CUSTOM has ${custom.label}`);
}
const abhiMarketing = child(abhiCore, MARKETING_EVENTS_MODULE_LABEL);
assert.deepEqual(labels(abhiMarketing), [
  "Digital Newsletter",
  "Social",
  "External Events",
  "ABHI Events",
  "Event Management",
  "ABHI Working Groups",
  "ABHI US Accelerator",
  "ABHI Middle East Accelerator",
  "Mailing List",
]);
for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.equal(child(abhiMarketing, custom.label).kind, "custom");
}
// ABHI Business Central shows Member terminology.
const abhiBc = child(abhiCore, "Business Central");
assert.ok(labels(abhiBc).includes("Member Management"), "ABHI BC uses Member terminology");

// Non-ABHI workspace has no custom items.
const northstar = child(workspaces, "Northstar");
const northstarCustom = child(northstar, "CUSTOM");
assert.equal((northstarCustom.children ?? []).length, 0, "Northstar has no custom items");
const northstarOps = child(child(northstar, "CORE MODULES"), "Operations");
assert.deepEqual(
  labels(northstarOps),
  OPERATIONS_CORE_FEATURES.map((feature) => feature.label),
);

// OmniTransit: Installations custom feature under Operations + CUSTOM group.
const omnitransitWs = child(workspaces, "OmniTransit");
const omnitransitCore = child(omnitransitWs, "CORE MODULES");
const omnitransitOps = child(omnitransitCore, "Operations");
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
const omnitransitCustomGroup = child(omnitransitWs, "CUSTOM");
assert.ok(child(omnitransitCustomGroup, SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL));

// Workspace filter narrows to a single workspace.
const onlyAbhi = buildWorkspaceArchitectureTaxonomy("abhi");
assert.deepEqual(labels(onlyAbhi), ["ABHI"]);

console.log(
  "prove:architecture-taxonomy: OK — Core Product (audited-only), Custom Product (ABHI + OmniTransit custom features), Workspace Architecture (6 workspaces) verified.",
);
