/**
 * Sales Management — product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Formalises the agreed Sales Management taxonomy against the EXISTING single-view
 * (`sales-management`) + tab implementation. Verification-only: it asserts the current
 * structure matches the taxonomy and does not change routing, views, provisioning,
 * data, grants, or any other module.
 *
 *   1 Core Module · 4 Core Features · 14 Core Sub-features · 0 Custom Features · 0 Custom Sub-features
 *
 * Run: npm run prove:sales-management-taxonomy
 */
import assert from "node:assert/strict";

import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import { getWorkspaceModuleEntry } from "@/lib/platform-workspaces/module-catalogue";
import {
  SALES_MANAGEMENT_NAV_GROUPS,
  SALES_MANAGEMENT_ROOT_TAB,
  SALES_MANAGEMENT_TABS,
} from "@/lib/sales-management-tabs";
import {
  SALES_MANAGEMENT_MODULE_LABEL,
  buildSalesManagementNavSection,
} from "@/lib/sales-management-nav";

// ---------------------------------------------------------------------------
// Agreed product taxonomy — authoritative expectation for this test.
// Labels + exact existing tab IDs. No Custom Features / Custom Sub-features.
// ---------------------------------------------------------------------------
const CORE_MODULE = { id: "sales-management", label: "Sales Management" } as const;

/** Four top-level Core Features, in the agreed order. Dashboard is top-level. */
const CORE_FEATURES = ["Dashboard", "Overview", "Management", "Sales"] as const;

/** Core Sub-features grouped under the three grouping Core Features (Dashboard has none). */
const CORE_SUB_FEATURES = {
  Overview: [
    { label: "My Sales", tab: "my-sales" },
    { label: "Sales Team", tab: "sales-team" },
  ],
  Management: [
    { label: "Targets & Forecast", tab: "targets" },
    { label: "Performance", tab: "performance" },
    { label: "Forecast", tab: "forecast" },
    { label: "Commissions", tab: "commissions" },
    { label: "Reports", tab: "reports" },
  ],
  Sales: [
    { label: "Prospects", tab: "prospects" },
    { label: "Opportunities", tab: "opportunities" },
    { label: "Pipeline", tab: "pipeline" },
    { label: "Discovery", tab: "discovery" },
    { label: "Activities", tab: "activities" },
    { label: "Sales Quotes", tab: "sales-quotes" },
    { label: "Partners", tab: "partners" },
  ],
} as const;

type GroupingFeature = keyof typeof CORE_SUB_FEATURES;
const GROUPING_FEATURES: readonly GroupingFeature[] = ["Overview", "Management", "Sales"];

const CUSTOM_FEATURES: readonly string[] = [];
const CUSTOM_SUB_FEATURES: readonly string[] = [];

// ---------------------------------------------------------------------------
// 1. `sales-management` is the Core Module (single catalogue module).
// ---------------------------------------------------------------------------
assert.equal(SALES_MANAGEMENT_MODULE_LABEL, CORE_MODULE.label);
assert.equal(
  getCanonicalModule(CORE_MODULE.id)?.label,
  CORE_MODULE.label,
  "sales-management is the canonical Core Module",
);
assert.ok(
  getWorkspaceModuleEntry(CORE_MODULE.id),
  "sales-management remains a single catalogue module (Overview/Management/Sales/Dashboard are NOT separate modules)",
);

// Live nav section — the source of truth for the current implementation.
const section = buildSalesManagementNavSection();
assert.equal(section.label, CORE_MODULE.label);
const topLevel = section.items.map((item) => item.label);

// ---------------------------------------------------------------------------
// 2-5 + 12. Exactly four Core Features, in order Dashboard → Overview → Management → Sales.
// ---------------------------------------------------------------------------
assert.deepEqual(
  topLevel,
  [...CORE_FEATURES],
  "top-level Core Features in exact order: Dashboard → Overview → Management → Sales",
);
assert.equal(CORE_FEATURES.length, 4);

// Dashboard is a TOP-LEVEL Core Feature (a direct tab, not nested under Overview, no children).
const dashboard = section.items[0];
assert.equal(dashboard.label, "Dashboard");
assert.equal(dashboard.view, "sales-management");
assert.deepEqual(dashboard.query, { tab: SALES_MANAGEMENT_ROOT_TAB.id });
assert.equal(SALES_MANAGEMENT_ROOT_TAB.id, "dashboard");
assert.equal((dashboard.children ?? []).length, 0, "Dashboard must not contain sub-features");

// ---------------------------------------------------------------------------
// 6-8. Core Sub-features under each grouping Core Feature (labels, order, exact tab IDs).
//      Single-view architecture: every sub-feature routes through the `sales-management` view.
// ---------------------------------------------------------------------------
for (const feature of GROUPING_FEATURES) {
  const node = section.items.find((item) => item.label === feature);
  assert.ok(node, `Core Feature "${feature}" present`);
  const expected = CORE_SUB_FEATURES[feature];
  const children = node!.children ?? [];
  assert.deepEqual(
    children.map((child) => child.label),
    expected.map((entry) => entry.label),
    `${feature} Core Sub-features (labels + order)`,
  );
  assert.deepEqual(
    children.map((child) => child.query?.tab),
    expected.map((entry) => entry.tab),
    `${feature} Core Sub-features (exact existing tab IDs)`,
  );
  for (const child of children) {
    assert.equal(child.view, "sales-management", `${feature} sub-feature routes through the single sales-management view`);
  }
}

const allSubFeatures = GROUPING_FEATURES.flatMap((feature) => [...CORE_SUB_FEATURES[feature]]);
assert.equal(allSubFeatures.length, 14, "14 Core Sub-features total");

// ---------------------------------------------------------------------------
// 9-10. Zero Custom Features and zero Custom Sub-features.
// ---------------------------------------------------------------------------
assert.equal(CUSTOM_FEATURES.length, 0);
assert.equal(CUSTOM_SUB_FEATURES.length, 0);
// Nothing beyond the agreed Core Features / Sub-features appears in the nav.
assert.equal(SALES_MANAGEMENT_NAV_GROUPS.length, 3, "exactly three grouping Core Features (Overview, Management, Sales)");
for (const node of section.items.slice(1)) {
  const known = (CORE_SUB_FEATURES as Record<string, readonly unknown[]>)[node.label];
  assert.ok(known, `no unexpected (custom) top-level Core Feature: ${node.label}`);
  assert.equal(
    (node.children ?? []).length,
    known.length,
    `${node.label} exposes only its Core Sub-features (no custom sub-features)`,
  );
}

// ---------------------------------------------------------------------------
// 11. The exact existing tab IDs remain unchanged (15 total: dashboard + 14 sub-features).
// ---------------------------------------------------------------------------
const expectedTabIds = [SALES_MANAGEMENT_ROOT_TAB.id, ...allSubFeatures.map((entry) => entry.tab)];
const actualTabIds = SALES_MANAGEMENT_TABS.map((tab) => tab.id);
assert.equal(SALES_MANAGEMENT_TABS.length, 15, "15 tab IDs total");
assert.deepEqual(
  [...actualTabIds].sort(),
  [...expectedTabIds].sort(),
  "exact existing tab IDs are unchanged",
);

console.log(
  "prove:sales-management-taxonomy: OK — 1 Core Module, 4 Core Features, 14 Core Sub-features, 0 Custom Features, 0 Custom Sub-features; single-view + tab architecture and all 15 tab IDs preserved.",
);
