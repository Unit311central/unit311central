"use client";

import { createContext, useContext } from "react";

import {
  DEFAULT_REPORTING_CURRENCY,
  type ReportingCurrency,
} from "@/lib/financial-reporting-currency";

const WorkspaceReportingCurrencyContext = createContext<ReportingCurrency | null>(null);

export function WorkspaceReportingCurrencyProvider({
  currency,
  children,
}: {
  currency: ReportingCurrency;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceReportingCurrencyContext.Provider value={currency}>
      {children}
    </WorkspaceReportingCurrencyContext.Provider>
  );
}

/** Host-aware reporting currency — prefers server-resolved value to avoid GBP hydration flash. */
export function useWorkspaceReportingCurrency(
  apiCurrency?: string | null,
): ReportingCurrency {
  const fromContext = useContext(WorkspaceReportingCurrencyContext);
  // Server-resolved workspace currency (internaldashboard provider) — avoids GBP flash on customer hosts.
  if (fromContext) return fromContext;

  const fromApi = String(apiCurrency ?? "")
    .trim()
    .toUpperCase();
  if (
    fromApi === "USD" ||
    fromApi === "GBP" ||
    fromApi === "EUR" ||
    fromApi === "AUD" ||
    fromApi === "ZAR"
  ) {
    return fromApi;
  }
  if (typeof window === "undefined") return DEFAULT_REPORTING_CURRENCY;
  const { resolveBrowserReportingCurrency } =
    require("@/lib/financial-reporting-currency") as typeof import("@/lib/financial-reporting-currency");
  return resolveBrowserReportingCurrency();
}
