import { formatReportingMoney } from "@/lib/financial-reporting-currency";

export function formatCountUpValue(
  kind: "compactCurrency" | "integer" | undefined,
  currency: string | undefined,
  value: number,
): string {
  if (kind === "integer") {
    return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(
      Math.round(value),
    );
  }
  return formatReportingMoney(Math.round(value), currency ?? "GBP");
}
