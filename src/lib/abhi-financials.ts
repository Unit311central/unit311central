/**
 * ABHI financial fixtures — canonical GBP figures for home / financials.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";

/** Canonical cash at bank (GBP). */
export const ABHI_CASH_BALANCE_GBP = 4_242_957;

/** Canonical calendar YTD revenue (GBP). */
export const ABHI_REVENUE_YTD_GBP = 2_000_000;

/**
 * Membership & services income recognised across Jan–Jul 2026.
 * Sums to {@link ABHI_REVENUE_YTD_GBP}.
 */
export const ABHI_MONTHLY_REVENUE_GBP: ReadonlyArray<{ month: string; amount: number }> = [
  { month: "2026-01", amount: 260_000 },
  { month: "2026-02", amount: 270_000 },
  { month: "2026-03", amount: 290_000 },
  { month: "2026-04", amount: 285_000 },
  { month: "2026-05", amount: 300_000 },
  { month: "2026-06", amount: 295_000 },
  { month: "2026-07", amount: 300_000 },
];

export function isAbhiWorkspaceSlug(slug: string | null | undefined): boolean {
  return isAbhiSlug(slug);
}

export function getAbhiMonthlyRevenueSeries(): Array<{ month: string; amount: number }> {
  return ABHI_MONTHLY_REVENUE_GBP.map((point) => ({ ...point }));
}

export function getAbhiRevenueForMonth(monthPrefix: string): number {
  const key = monthPrefix.slice(0, 7);
  return ABHI_MONTHLY_REVENUE_GBP.find((point) => point.month === key)?.amount ?? 0;
}
