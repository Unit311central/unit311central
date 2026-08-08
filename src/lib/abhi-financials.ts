/**
 * ABHI financial fixtures — canonical GBP figures for home / financials.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";

/** Canonical cash at bank (GBP). */
export const ABHI_CASH_BALANCE_GBP = 1_000_000;

/** Prior closed-month cash at bank (GBP) — used for Home MoM delta. */
export const ABHI_CASH_PRIOR_MONTH_GBP = 985_000;

/** Canonical calendar YTD revenue (GBP). */
export const ABHI_REVENUE_YTD_GBP = 2_000_000;

/**
 * Total monthly operating burn (payroll + facilities + programmes) — not raw HR gross.
 * Previous full month (July 2026). With £1m cash ≈ 12.8 months runway.
 */
export const ABHI_MONTHLY_BURN_PRIOR_GBP = 76_200;

/** Current-month operating burn pace (August MTD — partial). */
export const ABHI_MONTHLY_BURN_MTD_GBP = 41_800;

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

/** Monthly operating outgoings — aligns burn KPIs and P&L charts. */
export const ABHI_MONTHLY_OUTGOINGS_GBP: ReadonlyArray<{ month: string; amount: number }> = [
  { month: "2026-01", amount: 71_500 },
  { month: "2026-02", amount: 73_200 },
  { month: "2026-03", amount: 74_800 },
  { month: "2026-04", amount: 75_100 },
  { month: "2026-05", amount: 75_900 },
  { month: "2026-06", amount: 76_000 },
  { month: "2026-07", amount: ABHI_MONTHLY_BURN_PRIOR_GBP },
  { month: "2026-08", amount: ABHI_MONTHLY_BURN_MTD_GBP },
];

export function isAbhiWorkspaceSlug(slug: string | null | undefined): boolean {
  return isAbhiSlug(slug);
}

export function getAbhiMonthlyRevenueSeries(): Array<{ month: string; amount: number }> {
  return ABHI_MONTHLY_REVENUE_GBP.map((point) => ({ ...point }));
}

export function getAbhiMonthlyOutgoingsSeries(): Array<{ month: string; amount: number }> {
  return ABHI_MONTHLY_OUTGOINGS_GBP.map((point) => ({ ...point }));
}

export function getAbhiRevenueForMonth(monthPrefix: string): number {
  const key = monthPrefix.slice(0, 7);
  return ABHI_MONTHLY_REVENUE_GBP.find((point) => point.month === key)?.amount ?? 0;
}

export function getAbhiFixtureBurnObligation(monthPrefix?: string): {
  monthly: number;
  previousMonthly: number;
} {
  const key = (monthPrefix ?? new Date().toISOString().slice(0, 7)).slice(0, 7);
  const current =
    ABHI_MONTHLY_OUTGOINGS_GBP.find((point) => point.month === key)?.amount ??
    ABHI_MONTHLY_BURN_MTD_GBP;
  return {
    monthly: current,
    previousMonthly: ABHI_MONTHLY_BURN_PRIOR_GBP,
  };
}

/**
 * Operating cash balance by month — rises with membership collections toward
 * {@link ABHI_CASH_BALANCE_GBP}. Prior month is {@link ABHI_CASH_PRIOR_MONTH_GBP}.
 */
export function getAbhiMonthlyCashSeries(): Array<{ month: string; amount: number }> {
  return [
    { month: "2026-01", amount: 892_000 },
    { month: "2026-02", amount: 918_000 },
    { month: "2026-03", amount: 941_000 },
    { month: "2026-04", amount: 952_000 },
    { month: "2026-05", amount: 968_000 },
    { month: "2026-06", amount: 976_000 },
    { month: "2026-07", amount: ABHI_CASH_PRIOR_MONTH_GBP },
    { month: "2026-08", amount: ABHI_CASH_BALANCE_GBP },
  ];
}
