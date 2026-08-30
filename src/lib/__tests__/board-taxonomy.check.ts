/**
 * Board — product taxonomy (Core Module → Core Features).
 *
 * Formalises the agreed Board taxonomy against the EXISTING implementation: six Core Features,
 * no Core Sub-features, no Custom. Verification-only — it does not change navigation, routes,
 * components, permissions, provisioning, data, or workspace configuration.
 *
 *   1 Core Module · 6 Core Features · 0 Core Sub-features · 0 Custom
 *
 * Run: npm run prove:board-taxonomy
 */
import assert from "node:assert/strict";

import {
  BOARD_CORE_FEATURES,
  BOARD_CUSTOM_FEATURES,
  BOARD_CUSTOM_SUB_FEATURES,
  BOARD_EXCLUDED_VIEW_IDS,
  BOARD_MODULE_ID,
  BOARD_MODULE_LABEL,
  boardCoreFeatureCount,
  boardCoreSubFeatureCount,
  getBoardCoreFeatureByViewId,
} from "@/lib/board/board-taxonomy";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { buildCentralBoardNavSection } from "@/lib/platform-workspaces/central-product-nav";
import {
  getWorkspaceModuleEntry,
  WORKSPACE_CORE_MODULE_IDS,
} from "@/lib/platform-workspaces/module-catalogue";

// ---------------------------------------------------------------------------
// 1. Core Module — single standard, non-optional Core Module.
// ---------------------------------------------------------------------------
assert.equal(BOARD_MODULE_ID, "board");
assert.equal(BOARD_MODULE_LABEL, "Board");
assert.equal(getCanonicalModule(BOARD_MODULE_ID)?.label, BOARD_MODULE_LABEL);
assert.notEqual(getCanonicalModule(BOARD_MODULE_ID)?.optional, true, "Board is a standard Core Module");
assert.ok(WORKSPACE_CORE_MODULE_IDS.includes(BOARD_MODULE_ID), "Board is one of the core modules");
assert.ok(getWorkspaceModuleEntry(BOARD_MODULE_ID), "Board remains a single catalogue module");

// ---------------------------------------------------------------------------
// 2. Counts — six Core Features, zero Sub-features, zero Custom.
// ---------------------------------------------------------------------------
assert.equal(boardCoreFeatureCount(), 6);
assert.equal(boardCoreSubFeatureCount(), 0);
assert.equal(BOARD_CUSTOM_FEATURES.length, 0);
assert.equal(BOARD_CUSTOM_SUB_FEATURES.length, 0);

// ---------------------------------------------------------------------------
// 3. Canonical Core Feature labels + preserved view IDs (in agreed order).
// ---------------------------------------------------------------------------
assert.deepEqual(
  BOARD_CORE_FEATURES.map((feature) => feature.label),
  ["Dashboard", "Meetings", "Minutes & Decisions", "Board Members", "Board Deck", "Risk Register"],
);
assert.deepEqual(
  BOARD_CORE_FEATURES.map((feature) => feature.viewId),
  [
    "board-dashboard",
    "board-meetings",
    "board-minutes",
    "board-members",
    "board-pack",
    "corporate-risk-register",
  ],
);

// Board Members is canonical; Board Deck / Risk Register keep canonical labels + existing view IDs.
assert.equal(getBoardCoreFeatureByViewId("board-members")?.label, "Board Members");
assert.equal(getBoardCoreFeatureByViewId("board-pack")?.label, "Board Deck");
assert.equal(getBoardCoreFeatureByViewId("corporate-risk-register")?.label, "Risk Register");

// ---------------------------------------------------------------------------
// 4. corporate-board-directors is legacy/orphaned — excluded from Board taxonomy.
// ---------------------------------------------------------------------------
assert.ok(BOARD_EXCLUDED_VIEW_IDS.includes("corporate-board-directors"));
assert.ok(
  !BOARD_CORE_FEATURES.some((feature) => feature.viewId === "corporate-board-directors"),
  "corporate-board-directors must not be a Board Core Feature",
);

// ---------------------------------------------------------------------------
// 5. Central product nav wiring preserved (view IDs match taxonomy; order preserved).
//    Labels intentionally differ for Board Deck (nav: "Board deck"), so match on view IDs.
// ---------------------------------------------------------------------------
const central = buildCentralBoardNavSection();
assert.equal(central.label, BOARD_MODULE_LABEL);
assert.equal(central.items.length, 6, "six Board nav items = six Core Features");
assert.deepEqual(
  central.items.map((item) => item.view),
  BOARD_CORE_FEATURES.map((feature) => feature.viewId),
);
for (const item of central.items) {
  assert.equal((item.children ?? []).length, 0, `${item.label} is a leaf (no nav children)`);
}
const centralJson = JSON.stringify(central);
for (const excluded of BOARD_EXCLUDED_VIEW_IDS) {
  assert.ok(!centralJson.includes(`"view":"${excluded}"`), `Board nav must not include ${excluded}`);
}

// ---------------------------------------------------------------------------
// 6. Catalogue submodules align with Core Features (view IDs; provisioning unchanged).
// ---------------------------------------------------------------------------
const catalogueSubs = getWorkspaceModuleEntry(BOARD_MODULE_ID)?.subModules ?? [];
assert.equal(catalogueSubs.length, 6, "six catalogue submodules = six Core Features");
assert.deepEqual(
  catalogueSubs.map((sub) => sub.viewId),
  BOARD_CORE_FEATURES.map((feature) => feature.viewId),
);

// ---------------------------------------------------------------------------
// 7. Routes preserved for each Core Feature view.
// ---------------------------------------------------------------------------
for (const feature of BOARD_CORE_FEATURES) {
  const href = getInternalNavHref(feature.viewId, "/");
  assert.ok(href.includes(`view=${feature.viewId}`), `${feature.viewId} route preserved`);
}

console.log(
  "prove:board-taxonomy: OK — 1 Core Module, 6 Core Features, 0 Core Sub-features, 0 Custom; view IDs and routes preserved; corporate-board-directors excluded.",
);
