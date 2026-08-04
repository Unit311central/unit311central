/**
 * OnwardAir financial fixtures — canonical USD figures for home / financials / bank.
 * Pre-revenue aerospace (founded 2023); raised ~$1.7M; current cash $1M.
 */

import { isOnwardAirSlug } from "@/lib/onwardair-surface";

/** Canonical current cash on hand (USD). */
export const ONWARDAIR_CASH_BALANCE_USD = 1_000_000;

/** Narrative raise (USD) — residual after prior burn sits as current cash. */
export const ONWARDAIR_CAPITAL_RAISED_USD = 1_700_000;

/** Prior closed-month cash (USD) — Home MoM delta. */
export const ONWARDAIR_CASH_PRIOR_MONTH_USD = 1_080_000;

/**
 * Split across simulated Bank balances (Finance → Bank).
 * Totals must equal {@link ONWARDAIR_CASH_BALANCE_USD}.
 */
export const ONWARDAIR_BANK_BALANCES_USD = {
  operating: 720_000,
  payroll: 180_000,
  reserves: 100_000,
} as const;

export function isOnwardAirWorkspaceSlug(slug: string | null | undefined): boolean {
  return isOnwardAirSlug(slug);
}

export function assertOnwardAirBankBalancesTotal(): void {
  const total =
    ONWARDAIR_BANK_BALANCES_USD.operating +
    ONWARDAIR_BANK_BALANCES_USD.payroll +
    ONWARDAIR_BANK_BALANCES_USD.reserves;
  if (total !== ONWARDAIR_CASH_BALANCE_USD) {
    throw new Error(
      `OnwardAir bank balances (${total}) must equal ONWARDAIR_CASH_BALANCE_USD (${ONWARDAIR_CASH_BALANCE_USD})`,
    );
  }
}

/** Soft monthly cash glide toward current balance (pre-revenue). */
export function getOnwardAirMonthlyCashSeries(): Array<{ month: string; amount: number }> {
  return [
    { month: "2025-09", amount: 1_320_000 },
    { month: "2025-10", amount: 1_260_000 },
    { month: "2025-11", amount: 1_210_000 },
    { month: "2025-12", amount: 1_160_000 },
    { month: "2026-01", amount: 1_130_000 },
    { month: "2026-02", amount: 1_110_000 },
    { month: "2026-03", amount: 1_095_000 },
    { month: "2026-04", amount: 1_085_000 },
    { month: "2026-05", amount: ONWARDAIR_CASH_PRIOR_MONTH_USD },
    { month: "2026-06", amount: 1_050_000 },
    { month: "2026-07", amount: 1_025_000 },
    { month: "2026-08", amount: ONWARDAIR_CASH_BALANCE_USD },
  ];
}
