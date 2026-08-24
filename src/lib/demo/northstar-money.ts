import {
  formatReportingMoney,
  resolveBrowserReportingCurrency,
} from "@/lib/financial-reporting-currency";

/** Demo workspace money display — respects browser/workspace reporting currency (USD on Demo). */
export function formatNorthstarDemoMoney(value: number): string {
  return formatReportingMoney(value);
}

export function formatNorthstarDemoMoneyCompact(value: number): string {
  const currency = resolveBrowserReportingCurrency();
  const abs = Math.abs(value);
  const prefix = currency === "USD" ? "$" : currency === "AUD" ? "AU$" : "£";
  if (abs >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${prefix}${Math.round(value / 1_000)}k`;
  }
  return formatReportingMoney(value);
}
