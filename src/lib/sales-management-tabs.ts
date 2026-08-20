/** Sales Management horizontal tab registry — Phase 0 shell routing only. */

export const SALES_MANAGEMENT_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "my-sales", label: "My Sales" },
  { id: "sales-team", label: "Sales Team" },
  { id: "prospects", label: "Prospects" },
  { id: "discovery", label: "Discovery" },
  { id: "opportunities", label: "Opportunities" },
  { id: "pipeline", label: "Pipeline" },
  { id: "activities", label: "Activities" },
  { id: "targets", label: "Targets" },
  { id: "performance", label: "Performance" },
  { id: "commissions", label: "Commissions" },
  { id: "forecast", label: "Forecast" },
  { id: "reports", label: "Reports" },
] as const;

export type SalesManagementTabId = (typeof SALES_MANAGEMENT_TABS)[number]["id"];

export const DEFAULT_SALES_MANAGEMENT_TAB: SalesManagementTabId = "dashboard";

const TAB_IDS = new Set<string>(SALES_MANAGEMENT_TABS.map((tab) => tab.id));

export function isSalesManagementTab(value: string | null | undefined): value is SalesManagementTabId {
  return typeof value === "string" && TAB_IDS.has(value);
}

export function getSalesManagementTabLabel(tab: SalesManagementTabId): string {
  return SALES_MANAGEMENT_TABS.find((entry) => entry.id === tab)?.label ?? "Dashboard";
}
