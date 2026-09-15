/**
 * Central workspace sidebar module configuration helpers.
 * Run: node --import tsx src/lib/__tests__/workspace-sidebar-config.check.ts
 */
import assert from "node:assert/strict";

import type { InternalNavSection } from "@/lib/internal-operations-data";
import {
  applyWorkspaceSidebarModuleConfig,
  buildSidebarConfigSnapshot,
  defaultWorkspaceSidebarModuleRows,
  listSidebarCatalogueModules,
  mergeCatalogueWithPersistedRows,
  sanitizeSidebarModulePayload,
  sidebarConfigFromEnabledModuleIds,
} from "@/lib/platform-workspaces/workspace-sidebar-config";

const catalogue = listSidebarCatalogueModules();
assert.ok(catalogue.length >= 10, "catalogue should list configurable modules");

const defaults = defaultWorkspaceSidebarModuleRows();
assert.equal(defaults.length, catalogue.length);
assert.ok(defaults.every((row) => row.enabled), "defaults enable all catalogue modules");

const mockSections: InternalNavSection[] = [
  {
    kind: "pin",
    label: "Home",
    items: [{ label: "Home", icon: "LayoutDashboard", view: "home" }],
  },
  {
    kind: "workspace",
    label: "Board",
    items: [{ label: "Dashboard", icon: "LayoutDashboard", view: "board-dashboard" }],
  },
  {
    kind: "workspace",
    label: "Financials",
    items: [{ label: "Dashboard", icon: "LayoutDashboard", view: "financials-dashboard" }],
  },
  {
    kind: "workspace",
    label: "Settings",
    items: [{ label: "General", icon: "Settings", view: "settings" }],
  },
];

const financialsOnly = buildSidebarConfigSnapshot([
  { moduleId: "financials", enabled: true, displayOrder: 10 },
  { moduleId: "board", enabled: false, displayOrder: 20 },
]);
assert.ok(!financialsOnly.enabledModuleIds.includes("board"));

const filtered = applyWorkspaceSidebarModuleConfig(mockSections, financialsOnly);
const labels = filtered.map((section) => section.label);
assert.deepEqual(labels, ["Home", "Financials", "Settings"]);
assert.ok(!labels.includes("Board"));

const reorderSnapshot = buildSidebarConfigSnapshot([
  { moduleId: "financials", enabled: true, displayOrder: 50 },
  { moduleId: "board", enabled: true, displayOrder: 500 },
]);
const fromWhoami = sidebarConfigFromEnabledModuleIds(reorderSnapshot.enabledModuleIds);
assert.ok(fromWhoami);
const ordered = applyWorkspaceSidebarModuleConfig(mockSections, fromWhoami);
const movableLabels = ordered
  .filter((section) => section.kind === "workspace" && section.label !== "Settings")
  .map((section) => section.label);
assert.deepEqual(movableLabels, ["Financials", "Board"]);

const merged = mergeCatalogueWithPersistedRows([
  { moduleId: "board", enabled: true, displayOrder: 10 },
]);
assert.ok(merged.some((row) => row.moduleId === "intelligence"));
assert.equal(merged.filter((row) => row.enabled).length, 1);

const sanitized = sanitizeSidebarModulePayload([
  { moduleId: "board", enabled: false, displayOrder: 20 },
  { moduleId: "not-a-module", enabled: true, displayOrder: 30 },
]);
assert.ok(sanitized);
assert.ok(sanitized.some((row) => row.moduleId === "board" && !row.enabled));
assert.ok(!sanitized.some((row) => row.moduleId === "not-a-module"));

console.log("workspace-sidebar-config.check.ts: all assertions passed");
