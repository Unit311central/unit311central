/** Sales Management tab registry with navigation groups. */

export const SALES_MANAGEMENT_ROOT_TAB = {
  id: "dashboard",
  label: "Dashboard",
} as const;

export const SALES_MANAGEMENT_NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    tabs: [
      { id: "my-sales", label: "My Sales" },
      { id: "sales-team", label: "Sales Team" },
    ],
  },
  {
    id: "management",
    label: "Management",
    tabs: [
      { id: "targets", label: "Targets & Forecast" },
      { id: "performance", label: "Performance" },
      { id: "forecast", label: "Forecast" },
      { id: "commissions", label: "Commissions" },
      { id: "reports", label: "Reports" },
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
      { id: "partners", label: "Partners" },
    ],
  },
] as const;

export const SALES_MANAGEMENT_TABS = [
  {
    ...SALES_MANAGEMENT_ROOT_TAB,
    groupId: "root" as const,
    groupLabel: "Sales Management",
  },
  ...SALES_MANAGEMENT_NAV_GROUPS.flatMap((group) =>
    group.tabs.map((tab) => ({ ...tab, groupId: group.id, groupLabel: group.label })),
  ),
];

export type SalesManagementTabId = (typeof SALES_MANAGEMENT_TABS)[number]["id"];
export type SalesManagementNavGroupId =
  | (typeof SALES_MANAGEMENT_NAV_GROUPS)[number]["id"]
  | "root";

export const DEFAULT_SALES_MANAGEMENT_TAB: SalesManagementTabId = "dashboard";

const TAB_IDS = new Set<string>(SALES_MANAGEMENT_TABS.map((tab) => tab.id));

export function isSalesManagementTab(value: string | null | undefined): value is SalesManagementTabId {
  return typeof value === "string" && TAB_IDS.has(value);
}

export function getSalesManagementTabLabel(tab: SalesManagementTabId): string {
  return SALES_MANAGEMENT_TABS.find((entry) => entry.id === tab)?.label ?? "Dashboard";
}

export function getSalesManagementNavGroupForTab(tab: SalesManagementTabId): string {
  return SALES_MANAGEMENT_TABS.find((entry) => entry.id === tab)?.groupLabel ?? "Sales Management";
}

/** Legacy tab ids that remain valid bookmarks. */
export const SALES_MANAGEMENT_LEGACY_TAB_ALIASES: Record<string, SalesManagementTabId> = {};
