/**
 * Phase 0 — Sales Management central module shell.
 */
import assert from "node:assert/strict";

import { FINANCES_MODULE_LABEL } from "@/lib/finances-nav";
import { ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER } from "@/lib/onwardair-nav-order";
import { injectDemoNavSections } from "@/lib/demo/nav";
import {
  TALANTON_HIDDEN_SECTION_LABELS,
  TALANTON_HIDDEN_VIEWS,
} from "@/lib/internal-role-views";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  SALES_MANAGEMENT_NAV_GROUPS,
  SALES_MANAGEMENT_ROOT_TAB,
  SALES_MANAGEMENT_TABS,
  isSalesManagementTab,
} from "@/lib/sales-management-tabs";
import {
  SALES_MANAGEMENT_MODULE_LABEL,
  buildSalesManagementNavSection,
} from "@/lib/sales-management-nav";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";

function sectionLabels(sections: readonly { label?: string | null }[]): string[] {
  return sections.map((section) => String(section.label ?? ""));
}

assert.equal(getCanonicalModule("sales-management")?.label, "Sales Management");

const baseLabels = sectionLabels(internalSurveyNavSections);
const bcIdx = baseLabels.indexOf("Business Central");
const smIdx = baseLabels.indexOf(SALES_MANAGEMENT_MODULE_LABEL);
const finIdx = baseLabels.indexOf(FINANCES_MODULE_LABEL);
assert.ok(bcIdx >= 0, "base nav must include Business Central");
assert.ok(smIdx >= 0, "base nav must include Sales Management");
assert.ok(finIdx >= 0, "base nav must include Finances");
assert.ok(bcIdx < smIdx && smIdx < finIdx, "Sales Management must sit between BC and Finances");

const smSection = internalSurveyNavSections.find(
  (section) => section.label === SALES_MANAGEMENT_MODULE_LABEL,
);
assert.ok(smSection, "Sales Management section must exist");
assert.equal(
  smSection?.items.length,
  1 + SALES_MANAGEMENT_NAV_GROUPS.length,
  "Sales Management global LHS must expose Dashboard plus each nav group",
);

const dashboardItem = smSection?.items[0];
assert.equal(dashboardItem?.label, SALES_MANAGEMENT_ROOT_TAB.label);
assert.equal(dashboardItem?.view, "sales-management");
assert.deepEqual(dashboardItem?.query, { tab: "dashboard" });

const overviewGroup = smSection?.items.find((item) => item.label === "Overview");
assert.ok(overviewGroup?.children?.length, "Overview group must have children");
assert.ok(
  overviewGroup?.children?.some((child) => child.query?.tab === "my-sales"),
  "Overview must include My Sales tab link",
);

const managementGroup = smSection?.items.find((item) => item.label === "Management");
assert.ok(
  managementGroup?.children?.some((child) => child.label === "Targets & Forecast"),
  "Management must include Targets & Forecast",
);

const salesGroup = smSection?.items.find((item) => item.label === "Sales");
assert.ok(
  salesGroup?.children?.some((child) => child.query?.tab === "partners"),
  "Partners must remain under Sales group",
);

assert.equal(SALES_MANAGEMENT_TABS.length, 15);
assert.equal(SALES_MANAGEMENT_NAV_GROUPS.length, 3);
assert.equal(DEFAULT_SALES_MANAGEMENT_TAB, "dashboard");
assert.equal(isSalesManagementTab("pipeline"), true);
assert.equal(isSalesManagementTab("sales-quotes"), true);
assert.equal(isSalesManagementTab("not-a-tab"), false);

const href = getInternalNavHref("sales-management", "/internaldashboard", { tab: "pipeline" });
assert.ok(href.includes("view=sales-management"));
assert.ok(href.includes("tab=pipeline"));

const demoNav = injectDemoNavSections(internalSurveyNavSections);
const demoLabels = sectionLabels(demoNav);
assert.ok(
  demoLabels.indexOf(SALES_MANAGEMENT_MODULE_LABEL) > demoLabels.indexOf("Business Central"),
  "demo nav must keep Sales Management after Business Central",
);

assert.ok(
  TALANTON_HIDDEN_SECTION_LABELS.has(SALES_MANAGEMENT_MODULE_LABEL),
  "Talanton must hide Sales Management section",
);
assert.ok(TALANTON_HIDDEN_VIEWS.has("sales-management"), "Talanton must hide sales-management view");

assert.ok(
  ONWARDAIR_LOCKED_WORKSPACE_SECTION_ORDER.includes(SALES_MANAGEMENT_MODULE_LABEL),
  "OnwardAir locked order must include Sales Management",
);

const built = buildSalesManagementNavSection();
assert.equal(built.label, SALES_MANAGEMENT_MODULE_LABEL);
assert.equal(built.items.length, 1 + SALES_MANAGEMENT_NAV_GROUPS.length);

const catalogueModule = listPlatformModules().find((module) => module.id === "sales-management");
assert.ok(catalogueModule, "EA Application Catalogue must include Sales Management");
assert.equal(
  catalogueModule?.navigation.href,
  "/internaldashboard?view=sales-management&tab=dashboard",
);
assert.equal(catalogueModule?.applications[0]?.pages.length, 15);
const pipelinePage = catalogueModule?.applications[0]?.pages.find((page) => page.label === "Pipeline");
assert.ok(pipelinePage?.href?.includes("tab=pipeline"), "EA catalogue must route Pipeline tab");

console.log("ok  sales-management-nav checks passed\n");
