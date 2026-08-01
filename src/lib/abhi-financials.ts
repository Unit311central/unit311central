/**
 * ABHI financial fixtures — canonical GBP figures for home / financials.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";

/** Canonical cash at bank (GBP). */
export const ABHI_CASH_BALANCE_GBP = 4_242_957;

/** Prior closed-month cash at bank (GBP) — used for Home MoM delta. */
export const ABHI_CASH_PRIOR_MONTH_GBP = 4_100_000;

/** Canonical calendar YTD revenue (GBP). */
export const ABHI_REVENUE_YTD_GBP = 2_000_000;

/**
 * Membership & services income recognised monthly through the current operating year.
 * Jan–Jul carry the bulk of YTD; August is the open month. Sums to {@link ABHI_REVENUE_YTD_GBP}.
 */
export const ABHI_MONTHLY_REVENUE_GBP: ReadonlyArray<{ month: string; amount: number }> = [
  { month: "2026-01", amount: 240_000 },
  { month: "2026-02", amount: 250_000 },
  { month: "2026-03", amount: 270_000 },
  { month: "2026-04", amount: 265_000 },
  { month: "2026-05", amount: 280_000 },
  { month: "2026-06", amount: 275_000 },
  { month: "2026-07", amount: 280_000 },
  { month: "2026-08", amount: 140_000 },
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

/**
 * Operating cash balance by month — rises with membership collections toward
 * {@link ABHI_CASH_BALANCE_GBP}. Prior month is {@link ABHI_CASH_PRIOR_MONTH_GBP}.
 */
export function getAbhiMonthlyCashSeries(): Array<{ month: string; amount: number }> {
  return [
    { month: "2026-01", amount: 3_650_000 },
    { month: "2026-02", amount: 3_720_000 },
    { month: "2026-03", amount: 3_810_000 },
    { month: "2026-04", amount: 3_880_000 },
    { month: "2026-05", amount: 3_960_000 },
    { month: "2026-06", amount: 4_040_000 },
    { month: "2026-07", amount: ABHI_CASH_PRIOR_MONTH_GBP },
    { month: "2026-08", amount: ABHI_CASH_BALANCE_GBP },
  ];
}
