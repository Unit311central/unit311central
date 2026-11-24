/**
 * WOLF Sentinel navigation.
 * Home, Business Central, Sales, Operations, Business Productivity, Support, Settings.
 */

import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import { filterCustomerSupportNavItems } from "@/lib/customer-workspace-surface";
import {
  internalSurveyNavSections,
  type InternalNavSection,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { buildSalesManagementNavSection } from "@/lib/sales-management-nav";

function sectionByLabel(label: string): InternalNavSection {
  const section = internalSurveyNavSections.find((item) => item.label === label);
  if (!section) throw new Error(`WOLF Sentinel nav missing section: ${label}`);
  return section;
}

type NavNode = { view?: string | null; children?: readonly NavNode[] };

function collectViews(items: readonly NavNode[], into: Set<string>) {
  for (const item of items) {
    if (item.view) into.add(item.view);
    if (item.children?.length) collectViews(item.children, into);
  }
}

export function buildWolfSentinelNavSections(): InternalNavSection[] {
  const support = sectionByLabel("Support Desk");
  return [
    {
      kind: "pin",
      label: null,
      color: "#2F80ED",
      items: [{ label: "HOME", icon: "LayoutDashboard", view: "home" }],
    },
    buildCentralBusinessCentralNavSection(),
    buildSalesManagementNavSection(),
    sectionByLabel("Operations"),
    sectionByLabel("Business Productivity"),
    {
      ...support,
      items: filterCustomerSupportNavItems(support.items),
    },
    {
      kind: "workspace",
      label: "Settings",
      icon: "Settings",
      color: "#64748B",
      items: [{ label: "Profile", icon: "Users", view: "profile" }],
    },
  ];
}

const WOLF_SENTINEL_VIEWS: ReadonlySet<string> = (() => {
  const views = new Set<string>();
  for (const section of buildWolfSentinelNavSections()) {
    collectViews(section.items, views);
  }
  return views;
})();

export function isWolfSentinelView(view: string | null | undefined): view is InternalOperationsView {
  return typeof view === "string" && WOLF_SENTINEL_VIEWS.has(view);
}
