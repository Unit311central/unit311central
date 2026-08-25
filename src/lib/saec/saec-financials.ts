/**
 * SAEC financial fixtures — canonical ZAR figures for home / financials.
 */

import { isSaecSlug } from "@/lib/saec-surface";

export const SAEC_CASH_BALANCE_ZAR = 24_600_000;
/** Prior closed-month cash — Home MoM delta. */
export const SAEC_CASH_PRIOR_MONTH_ZAR = 23_800_000;
export const SAEC_REVENUE_YTD_ZAR = 86_400_000;
export const SAEC_ACCOUNTS_RECEIVABLE_ZAR = 12_400_000;
export const SAEC_ACCOUNTS_PAYABLE_ZAR = 5_200_000;
export const SAEC_MONTHLY_REVENUE_ZAR = 7_200_000;
export const SAEC_MONTHLY_OPEX_ZAR = 5_100_000;

export const SAEC_MONTHLY_REVENUE_SERIES: ReadonlyArray<{ month: string; amount: number }> = [
  { month: "2026-01", amount: 6_800_000 },
  { month: "2026-02", amount: 6_900_000 },
  { month: "2026-03", amount: 7_100_000 },
  { month: "2026-04", amount: 7_000_000 },
  { month: "2026-05", amount: 7_300_000 },
  { month: "2026-06", amount: 7_400_000 },
  { month: "2026-07", amount: 7_500_000 },
  { month: "2026-08", amount: 7_200_000 },
];

export const SAEC_MONTHLY_OUTGOINGS_SERIES: ReadonlyArray<{ month: string; amount: number }> = [
  { month: "2026-01", amount: 4_850_000 },
  { month: "2026-02", amount: 4_920_000 },
  { month: "2026-03", amount: 5_050_000 },
  { month: "2026-04", amount: 4_980_000 },
  { month: "2026-05", amount: 5_120_000 },
  { month: "2026-06", amount: 5_180_000 },
  { month: "2026-07", amount: 5_220_000 },
  { month: "2026-08", amount: 5_100_000 },
];

export function isSaecWorkspaceSlug(slug: string | null | undefined): boolean {
  return isSaecSlug(slug);
}

export function getSaecMonthlyRevenueSeries() {
  return SAEC_MONTHLY_REVENUE_SERIES.map((row) => ({ ...row }));
}

export function getSaecMonthlyOutgoingsSeries() {
  return SAEC_MONTHLY_OUTGOINGS_SERIES.map((row) => ({ ...row }));
}

export function getSaecMonthlyCashSeries() {
  let balance = SAEC_CASH_BALANCE_ZAR - SAEC_MONTHLY_REVENUE_ZAR + SAEC_MONTHLY_OPEX_ZAR;
  return SAEC_MONTHLY_REVENUE_SERIES.map((row, index) => {
    const out = SAEC_MONTHLY_OUTGOINGS_SERIES[index]?.amount ?? SAEC_MONTHLY_OPEX_ZAR;
    balance = balance + row.amount - out;
    return { month: row.month, amount: balance };
  });
}

export function getSaecRevenueForMonth(monthPrefix: string): number {
  const key = monthPrefix.slice(0, 7);
  return SAEC_MONTHLY_REVENUE_SERIES.find((point) => point.month === key)?.amount ?? 0;
}
