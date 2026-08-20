import type { InternalNavSection } from "@/lib/internal-operations-data";

export const SALES_MANAGEMENT_MODULE_LABEL = "Sales Management";

const DEFAULT_SALES_MANAGEMENT_COLOR = "#7C3AED";

/** Top-level Sales Management module — single LHS entry; tabs live inside the workspace shell. */
export function buildSalesManagementNavSection(options?: {
  color?: string;
  icon?: string;
}): InternalNavSection {
  return {
    kind: "workspace",
    label: SALES_MANAGEMENT_MODULE_LABEL,
    icon: options?.icon ?? "TrendingUp",
    color: options?.color ?? DEFAULT_SALES_MANAGEMENT_COLOR,
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "sales-management",
      },
    ],
  };
}
