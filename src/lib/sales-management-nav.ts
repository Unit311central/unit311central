import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  SALES_MANAGEMENT_NAV_GROUPS,
  SALES_MANAGEMENT_ROOT_TAB,
  getSalesManagementNavGroupForTab,
  getSalesManagementTabLabel,
  isSalesManagementTab,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";

export const SALES_MANAGEMENT_MODULE_LABEL = "Sales Management";

/** Shell chrome for Sales Management deep links (`?view=sales-management&tab=`). */
export function resolveSalesManagementShellTitles(tabParam: string | null | undefined): {
  title: string;
  subtitle: string;
  breadcrumb: readonly string[];
} {
  const tab = isSalesManagementTab(tabParam) ? tabParam : DEFAULT_SALES_MANAGEMENT_TAB;
  const tabLabel = getSalesManagementTabLabel(tab);
  const groupLabel = getSalesManagementNavGroupForTab(tab);
  if (tab === "dashboard") {
    return {
      title: "Dashboard",
      subtitle: SALES_MANAGEMENT_MODULE_LABEL,
      breadcrumb: [SALES_MANAGEMENT_MODULE_LABEL, "Dashboard"],
    };
  }
  return {
    title: tabLabel,
    subtitle: SALES_MANAGEMENT_MODULE_LABEL,
    breadcrumb: [SALES_MANAGEMENT_MODULE_LABEL, groupLabel, tabLabel],
  };
}

const DEFAULT_SALES_MANAGEMENT_COLOR = "#7C3AED";

/** Views that carry `tab` query params for Sales Management deep links. */
export const SALES_MANAGEMENT_QUERY_PARAM_VIEWS: ReadonlySet<InternalOperationsView> = new Set([
  "sales-management",
]);

function salesTabChild(tabId: SalesManagementTabId, label: string): InternalNavChildItem {
  return {
    label,
    view: "sales-management",
    query: { tab: tabId },
  };
}

function groupIcon(groupId: (typeof SALES_MANAGEMENT_NAV_GROUPS)[number]["id"]): string {
  switch (groupId) {
    case "overview":
      return "Users";
    case "management":
      return "Target";
    case "sales":
      return "Handshake";
    default:
      return "TrendingUp";
  }
}

/** Top-level Sales Management module — grouped global LHS aligned with workspace tabs. */
export function buildSalesManagementNavSection(options?: {
  color?: string;
  icon?: string;
}): InternalNavSection {
  const groupItems: InternalNavItem[] = SALES_MANAGEMENT_NAV_GROUPS.map((group) => ({
    label: group.label,
    icon: groupIcon(group.id),
    children: group.tabs.map((tab) =>
      salesTabChild(tab.id as SalesManagementTabId, tab.label),
    ),
  }));

  return {
    kind: "workspace",
    label: SALES_MANAGEMENT_MODULE_LABEL,
    icon: options?.icon ?? "TrendingUp",
    color: options?.color ?? DEFAULT_SALES_MANAGEMENT_COLOR,
    items: [
      {
        label: SALES_MANAGEMENT_ROOT_TAB.label,
        icon: "LayoutDashboard",
        view: "sales-management",
        query: { tab: SALES_MANAGEMENT_ROOT_TAB.id },
      },
      ...groupItems,
    ],
  };
}
