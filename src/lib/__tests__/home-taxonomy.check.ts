/**
 * Home — product taxonomy (Core Module only).
 *
 * Formalises the agreed Home taxonomy against the EXISTING implementation.
 * Verification-only — does not change routing, views, provisioning, data, roles,
 * permissions, or the Users → Edit Access flow (Details / Role / Modules / Dashboards).
 *
 *   1 Core Module · 0 Core Features · 0 Core Sub-features · 0 Custom
 *
 * Run: npm run prove:home-taxonomy
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import {
  HOME_CORE_FEATURES,
  HOME_CORE_SUB_FEATURES,
  HOME_CUSTOM_FEATURES,
  HOME_CUSTOM_SUB_FEATURES,
  HOME_MODULE_ID,
  HOME_MODULE_LABEL,
  HOME_VIEW_ID,
  homeCoreFeatureCount,
  homeCoreSubFeatureCount,
} from "@/lib/home/home-taxonomy";
import { AUDITED_CORE_MODULE_IDS } from "@/lib/architecture-taxonomy";
import { buildCoreProductTaxonomy } from "@/lib/architecture-taxonomy";
import {
  getInternalNavHref,
  internalSurveyNavSections,
} from "@/lib/internal-operations-data";
import { buildCentralProductNavSections } from "@/lib/platform-workspaces/central-product-nav";
import {
  getWorkspaceModuleEntry,
} from "@/lib/platform-workspaces/module-catalogue";

// ---------------------------------------------------------------------------
// 1. Core Module
// ---------------------------------------------------------------------------
assert.equal(HOME_MODULE_ID, "home");
assert.equal(HOME_MODULE_LABEL, "Home");
assert.equal(HOME_VIEW_ID, "home");
assert.equal(getCanonicalModule(HOME_MODULE_ID)?.label, HOME_MODULE_LABEL);
assert.ok(getWorkspaceModuleEntry(HOME_MODULE_ID));

// ---------------------------------------------------------------------------
// 2. Zero Core Features · zero Core Sub-features · zero Custom
// ---------------------------------------------------------------------------
assert.equal(homeCoreFeatureCount(), 0);
assert.equal(homeCoreSubFeatureCount(), 0);
assert.equal(HOME_CORE_FEATURES.length, 0);
assert.equal(HOME_CORE_SUB_FEATURES.length, 0);
assert.equal(HOME_CUSTOM_FEATURES.length, 0);
assert.equal(HOME_CUSTOM_SUB_FEATURES.length, 0);

// ---------------------------------------------------------------------------
// 3. Existing nav remains a single PIN landing view (routes unchanged)
// ---------------------------------------------------------------------------
const centralHome = buildCentralProductNavSections().find((spec) => spec.id === HOME_MODULE_ID);
assert.ok(centralHome, "Home is the first central product module");
assert.equal(centralHome!.number, 1);
assert.equal(centralHome!.section.kind, "pin");
assert.equal(centralHome!.section.items.length, 1);
assert.equal(centralHome!.section.items[0]?.view, HOME_VIEW_ID);
assert.equal(centralHome!.section.items[0]?.label, "HOME");

const pinSection = internalSurveyNavSections.find(
  (section) => section.kind === "pin" && section.items.some((item) => item.view === HOME_VIEW_ID),
);
assert.ok(pinSection, "Internal nav retains the Home PIN section");
assert.deepEqual(
  pinSection!.items.map((item) => item.view),
  [HOME_VIEW_ID],
  "Home PIN exposes exactly one view",
);

assert.equal(getInternalNavHref(HOME_VIEW_ID), "/internaldashboard");

const catalogueEntry = getWorkspaceModuleEntry(HOME_MODULE_ID);
assert.ok(catalogueEntry, "Home is in the workspace module catalogue");
assert.equal(catalogueEntry!.subModules.length, 1, "catalogue retains one provisioning leaf for the Home view");
assert.equal(catalogueEntry!.subModules[0]?.viewId, HOME_VIEW_ID);
assert.equal(HOME_CORE_FEATURES.length, 0, "provisioning leaf is not a Core Feature");

// ---------------------------------------------------------------------------
// 4. Role / access customisation is outside Home taxonomy (not modified)
// ---------------------------------------------------------------------------
const accessWizardSource = readFileSync(
  join(process.cwd(), "src/components/testflighthub/AddUserAccessWizard.tsx"),
  "utf8",
);
assert.match(
  accessWizardSource,
  /STEPS = \["Details", "Role", "Modules", "Dashboards"\]/,
  "Users → Edit Access steps remain Details / Role / Modules / Dashboards",
);
assert.ok(
  !accessWizardSource.includes("home-taxonomy"),
  "Edit Access wizard was not wired to Home taxonomy",
);

// ---------------------------------------------------------------------------
// 5. Living Architecture — Home audited at module level only
// ---------------------------------------------------------------------------
assert.ok(AUDITED_CORE_MODULE_IDS.has(HOME_MODULE_ID), "Home must be marked AUDITED");

function child(node: { label: string; children?: { label: string; children?: unknown[] }[] }, label: string) {
  const found = (node.children ?? []).find((entry) => entry.label === label);
  assert.ok(found, `expected child "${label}" under "${node.label}"`);
  return found!;
}

const core = buildCoreProductTaxonomy();
const coreModules = child(core, "CORE MODULES");
const homeNode = child(coreModules, HOME_MODULE_LABEL);
assert.equal((homeNode as { audited?: boolean }).audited, true);
assert.equal((homeNode.children ?? []).length, 0, "Home remains a module-level leaf");

// ---------------------------------------------------------------------------
// 6. Guard: Home PIN is the landing view only (not decomposed into features)
// ---------------------------------------------------------------------------
const homePinViews = internalSurveyNavSections
  .filter((section) => section.kind === "pin")
  .flatMap((section) => section.items.map((item) => item.view));
assert.ok(homePinViews.includes(HOME_VIEW_ID), "Home remains the primary PIN landing view");

console.log(
  "prove:home-taxonomy: OK — 1 Core Module, 0 Core Features, 0 Core Sub-features, 0 Custom Features, 0 Custom Sub-features; Home AUDITED as module-level leaf; nav/routes/access unchanged.",
);
