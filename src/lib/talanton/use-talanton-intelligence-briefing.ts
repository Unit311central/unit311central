"use client";

import { useMemo } from "react";

import { useTalantonPortfolioCompanies } from "@/lib/talanton/use-talanton-portfolio-companies";

/** Rebuild intelligence briefings when live portfolio companies finish loading. */
export function useTalantonPortfolioDataKey(): string {
  const { companies, status } = useTalantonPortfolioCompanies();
  const ids = companies.map((c) => c.id).join(",");
  return `${status}:${companies.length}:${ids}`;
}

export function useTalantonMemo<T>(factory: () => T, extraDeps: readonly unknown[] = []): T {
  const dataKey = useTalantonPortfolioDataKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dataKey captures portfolio load
  return useMemo(factory, [dataKey, ...extraDeps]);
}
