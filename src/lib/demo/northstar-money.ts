import {
  formatReportingMoney,
  resolveBrowserReportingCurrency,
  resolveSlugReportingCurrency,
} from "@/lib/financial-reporting-currency";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";

/** Demo workspace money display — GBP on Demo fixtures (server + client). */
export function formatNorthstarDemoMoney(value: number): string {
  const currency =
    typeof window === "undefined"
      ? resolveSlugReportingCurrency(DEMO_WORKSPACE_SLUG)
      : resolveBrowserReportingCurrency();
  return formatReportingMoney(value, currency);
}

export function formatNorthstarDemoMoneyCompact(value: number): string {
  const currency =
    typeof window === "undefined"
      ? resolveSlugReportingCurrency(DEMO_WORKSPACE_SLUG)
      : resolveBrowserReportingCurrency();
  const abs = Math.abs(value);
  const prefix = currency === "USD" ? "$" : currency === "AUD" ? "AU$" : "£";
  if (abs >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${prefix}${Math.round(value / 1_000)}k`;
  }
  return formatReportingMoney(value, currency);
}
