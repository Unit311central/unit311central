/**
 * Central workspace sidebar module configuration helpers.
 * Run: node --import tsx src/lib/__tests__/workspace-sidebar-config.check.ts
 */
import assert from "node:assert/strict";

import type { InternalNavSection } from "@/lib/internal-operations-data";
import { getTalantonImpactNavSections } from "@/lib/internal-role-views";
import { buildProjectManagementNavSection } from "@/lib/project-management-nav";
import {
  applyWorkspaceSidebarModuleConfig,
  buildSidebarConfigSnapshot,
  dedupeNavSectionsByCatalogueModuleId,
  defaultWorkspaceSidebarModuleRows,
  deriveSidebarRowsFromLegacyEnabledModules,
  enableWorkspaceSidebarModule,
  isWolfSidebarExtensionModuleId,
  listSidebarCatalogueModules,
  mergeCatalogueWithPersistedRows,
  resolveCatalogueModuleIdForNavSection,
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
    items: [{ label: "Dashboard", icon: "LayoutDashboard", view: "financials" }],
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

const legacySubset = deriveSidebarRowsFromLegacyEnabledModules([
  "home",
  "executive-assistant",
  "business-central",
  "financials",
  "settings",
]);
assert.ok(legacySubset.find((row) => row.moduleId === "business-central")?.enabled);
assert.ok(legacySubset.find((row) => row.moduleId === "board")?.enabled === false);
assert.ok(legacySubset.find((row) => row.moduleId === "intelligence")?.enabled === false);

const specialistDefault = deriveSidebarRowsFromLegacyEnabledModules(null);
assert.ok(specialistDefault.every((row) => row.enabled));

const abcdRows = [
  { moduleId: "board", enabled: true, displayOrder: 10 },
  { moduleId: "financials", enabled: true, displayOrder: 20 },
  { moduleId: "fundraising", enabled: true, displayOrder: 30 },
  { moduleId: "engineering", enabled: true, displayOrder: 40 },
] as const;

assert.deepEqual(buildSidebarConfigSnapshot(abcdRows).enabledModuleIds, [
  "board",
  "financials",
  "fundraising",
  "engineering",
]);

const disabledMiddle = abcdRows.map((row) =>
  row.moduleId === "financials" ? { ...row, enabled: false } : row,
);
const afterDisable = buildSidebarConfigSnapshot(disabledMiddle);
assert.deepEqual(afterDisable.enabledModuleIds, ["board", "fundraising", "engineering"]);
assert.equal(
  afterDisable.modules.find((row) => row.moduleId === "financials")?.displayOrder,
  20,
);

const reenabled = enableWorkspaceSidebarModule(disabledMiddle, "financials");
assert.ok(reenabled);
const afterReenable = buildSidebarConfigSnapshot(reenabled);
assert.deepEqual(afterReenable.enabledModuleIds, [
  "board",
  "financials",
  "fundraising",
  "engineering",
]);
assert.equal(
  afterReenable.modules.find((row) => row.moduleId === "financials")?.displayOrder,
  20,
);

const talantonCatalogue = listSidebarCatalogueModules({ workspaceSlug: "talantonimpact" });
assert.ok(talantonCatalogue.length > 0);
assert.ok(!talantonCatalogue.some((entry) => isWolfSidebarExtensionModuleId(entry.id)));

const wolfCatalogue = listSidebarCatalogueModules({ workspaceSlug: "wolf-central" });
assert.ok(wolfCatalogue.some((entry) => entry.id === "wolf-animals"));

const pailexCatalogue = listSidebarCatalogueModules({ workspaceSlug: "pailex" });
assert.ok(pailexCatalogue.some((entry) => entry.id === "wolf-animals"));

assert.equal(
  talantonCatalogue.find((entry) => entry.id === "business-central")?.label,
  "Business Central",
);

function countCatalogueModuleSections(
  sections: readonly InternalNavSection[],
  moduleId: string,
): number {
  return sections.filter(
    (section) =>
      section.kind === "workspace" &&
      resolveCatalogueModuleIdForNavSection(section) === moduleId,
  ).length;
}

function countLabelSections(sections: readonly InternalNavSection[], label: string): number {
  return sections.filter((section) => section.kind === "workspace" && section.label === label)
    .length;
}

const talantonNav = getTalantonImpactNavSections();
assert.equal(
  countCatalogueModuleSections(talantonNav, "project-management"),
  2,
  "Talanton host overlay currently produces two PM catalogue representations before normalisation",
);

const pmEnabledConfig = buildSidebarConfigSnapshot([
  { moduleId: "project-management", enabled: true, displayOrder: 100 },
  { moduleId: "business-productivity", enabled: true, displayOrder: 110 },
  { moduleId: "training", enabled: true, displayOrder: 120 },
]);
const talantonPmEnabled = applyWorkspaceSidebarModuleConfig(
  talantonNav,
  pmEnabledConfig,
  "talantonimpact",
);
assert.equal(
  countCatalogueModuleSections(talantonPmEnabled, "project-management"),
  1,
  "Project Management enabled → exactly one catalogue section",
);
assert.equal(
  countLabelSections(talantonPmEnabled, "Project Management"),
  1,
  "Project Management enabled → exactly one PM-labelled section",
);

const pmDisabledConfig = buildSidebarConfigSnapshot([
  { moduleId: "project-management", enabled: false, displayOrder: 100 },
  { moduleId: "business-productivity", enabled: true, displayOrder: 110 },
  { moduleId: "training", enabled: true, displayOrder: 120 },
]);
const talantonPmDisabled = applyWorkspaceSidebarModuleConfig(
  talantonNav,
  pmDisabledConfig,
  "talantonimpact",
);
assert.equal(
  countCatalogueModuleSections(talantonPmDisabled, "project-management"),
  0,
  "Project Management disabled → zero catalogue sections",
);
assert.equal(
  countLabelSections(talantonPmDisabled, "Project Management"),
  0,
  "Project Management disabled → zero PM-labelled sections",
);

const duplicateTrainingSections: InternalNavSection[] = [
  {
    kind: "workspace",
    label: "Training",
    items: [{ label: "Dashboard", icon: "LayoutDashboard", view: "training-dashboard" }],
  },
  {
    kind: "workspace",
    label: "Training",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "training-dashboard" },
      { label: "Certifications", icon: "GraduationCap", view: "training-certifications" },
    ],
  },
];
const dedupedTraining = dedupeNavSectionsByCatalogueModuleId(duplicateTrainingSections);
assert.equal(dedupedTraining.length, 1);
assert.equal(dedupedTraining[0]?.items.length, 2, "dedupe keeps the richer Training section");

const trainingEnabledConfig = buildSidebarConfigSnapshot([
  { moduleId: "training", enabled: true, displayOrder: 10 },
  { moduleId: "project-management", enabled: true, displayOrder: 20 },
]);
const duplicatePmTree = [
  ...mockSections.filter((section) => section.label !== "Board"),
  buildProjectManagementNavSection(),
  buildProjectManagementNavSection({ includeGrants: true }),
  ...duplicateTrainingSections,
];
const dedupedPmTree = applyWorkspaceSidebarModuleConfig(
  duplicatePmTree,
  trainingEnabledConfig,
);
assert.equal(
  countCatalogueModuleSections(dedupedPmTree, "project-management"),
  1,
  "duplicate PM sections in input collapse to one",
);
assert.equal(
  countCatalogueModuleSections(dedupedPmTree, "training"),
  1,
  "another module with duplicates also collapses to one",
);

console.log("workspace-sidebar-config.check.ts: all assertions passed");
