import { getNorthstarPayrollDashboard } from "@/lib/demo/northstar-hr-data";
import { isNorthstarDemoSlug } from "@/lib/demo/northstar-surface";
import type { PayrollDashboardSnapshot } from "@/lib/payroll/types";

export function northstarDemoPayrollDashboard(
  workspaceSlug?: string | null,
): PayrollDashboardSnapshot | null {
  if (!isNorthstarDemoSlug(workspaceSlug)) return null;
  return getNorthstarPayrollDashboard();
}

export function formatNorthstarPayrollTrendMessage(
  trend: PayrollDashboardSnapshot["trend"],
  currency = "GBP",
): string {
  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  const lines = trend.map(
    (row) =>
      `${row.month}: gross ${formatter.format(row.gross)}, net ${formatter.format(row.net)}, employer tax ${formatter.format(row.employerTax)}`,
  );
  return ["Payroll — last 6 months (Northstar demo):", ...lines.map((line) => `• ${line}`)].join(
    "\n",
  );
}
