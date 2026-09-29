"use client";

import { useMemo } from "react";

import { useSyncExternalStore } from "react";

import {
  getTalantonIntelligenceContextClientSnapshot,
  getTalantonIntelligenceContextServerSnapshot,
  subscribeTalantonIntelligenceContext,
} from "@/lib/talanton/talanton-intelligence-context-client";
import { useTalantonPortfolioCompanies } from "@/lib/talanton/use-talanton-portfolio-companies";

/** Rebuild intelligence briefings when live portfolio companies finish loading. */
export function useTalantonPortfolioDataKey(): string {
  const { companies, status } = useTalantonPortfolioCompanies();
  const ctx = useSyncExternalStore(
    subscribeTalantonIntelligenceContext,
    getTalantonIntelligenceContextClientSnapshot,
    getTalantonIntelligenceContextServerSnapshot,
  );
  const ids = companies.map((c) => c.id).join(",");
  const ctxKey = `${ctx.governanceRisks.length}:${ctx.governanceActions.length}:${Object.keys(ctx.impactReportsByCompanyId).length}`;
  return `${status}:${companies.length}:${ids}:${ctxKey}`;
}

export function useTalantonMemo<T>(factory: () => T, extraDeps: readonly unknown[] = []): T {
  const dataKey = useTalantonPortfolioDataKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dataKey captures portfolio load
  return useMemo(factory, [dataKey, ...extraDeps]);
}
