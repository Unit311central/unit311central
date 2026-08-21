/** Sales Management tab registry with navigation groups. */

export const SALES_MANAGEMENT_NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    tabs: [
      { id: "dashboard", label: "Dashboard" },
      { id: "my-sales", label: "My Sales" },
      { id: "sales-team", label: "Sales Team" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    tabs: [
      { id: "prospects", label: "Prospects" },
      { id: "opportunities", label: "Opportunities" },
      { id: "pipeline", label: "Pipeline" },
      { id: "discovery", label: "Discovery" },
      { id: "activities", label: "Activities" },
      { id: "sales-quotes", label: "Sales Quotes" },
    ],
  },
  {
    id: "management",
    label: "Management",
    tabs: [
      { id: "targets", label: "Targets" },
      { id: "performance", label: "Performance" },
      { id: "forecast", label: "Forecast" },
      { id: "commissions", label: "Commissions" },
      { id: "reports", label: "Reports" },
    ],
  },
] as const;

export const SALES_MANAGEMENT_TABS = SALES_MANAGEMENT_NAV_GROUPS.flatMap((group) =>
  group.tabs.map((tab) => ({ ...tab, groupId: group.id, groupLabel: group.label })),
);

export type SalesManagementTabId = (typeof SALES_MANAGEMENT_TABS)[number]["id"];
export type SalesManagementNavGroupId = (typeof SALES_MANAGEMENT_NAV_GROUPS)[number]["id"];

export const DEFAULT_SALES_MANAGEMENT_TAB: SalesManagementTabId = "dashboard";

const TAB_IDS = new Set<string>(SALES_MANAGEMENT_TABS.map((tab) => tab.id));

export function isSalesManagementTab(value: string | null | undefined): value is SalesManagementTabId {
  return typeof value === "string" && TAB_IDS.has(value);
}

export function getSalesManagementTabLabel(tab: SalesManagementTabId): string {
  return SALES_MANAGEMENT_TABS.find((entry) => entry.id === tab)?.label ?? "Dashboard";
}

export function getSalesManagementNavGroupForTab(tab: SalesManagementTabId): string {
  return SALES_MANAGEMENT_TABS.find((entry) => entry.id === tab)?.groupLabel ?? "Overview";
}

/** Legacy tab ids that remain valid bookmarks. */
export const SALES_MANAGEMENT_LEGACY_TAB_ALIASES: Record<string, SalesManagementTabId> = {};
