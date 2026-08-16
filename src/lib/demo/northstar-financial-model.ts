/**
 * Northstar Demo — single source of truth for financial fixtures (GBP, UK FY Apr–Mar).
 */

/** Current-month operating expense breakdown (matches burn / GL expense accounts). */
export const NORTHSTAR_OPEX_BREAKDOWN = {
  payroll: 118_000,
  cloud: 10_500,
  rent: 21_600,
  marketing: 12_000,
  software: 9_000,
  professional: 8_000,
  travel: 8_000,
  other: 7_000,
} as const;

const OPEX_BREAKDOWN_TOTAL = Object.values(NORTHSTAR_OPEX_BREAKDOWN).reduce((sum, value) => sum + value, 0);

export const NORTHSTAR_MONTHLY_OPEX = OPEX_BREAKDOWN_TOTAL;

export const NORTHSTAR_MONTHLY_REVENUE = 400_000;
export const NORTHSTAR_REVENUE_YTD = 2_880_000;
export const NORTHSTAR_NET_PROFIT_YTD = 720_000;
export const NORTHSTAR_CASH_GBP = 1_900_000;

/** Prior-month burn — scaled from legacy £295k after opex mix reductions. */
export const NORTHSTAR_BURN_PREVIOUS_MONTHLY = 212_731;

export const NORTHSTAR_AP_OUTSTANDING = 186_000;
export const NORTHSTAR_AP_DUE_NOW = 64_000;
export const NORTHSTAR_AP_DUE_WITHIN_MONTH = 122_000;

export const NORTHSTAR_FY_START_MONTH = 4; // UK fiscal year begins April

/** Months from Apr 2023 through Aug 2026 for minable GL history. */
export function northstarFinancialMonths(): string[] {
  const months: string[] = [];
  for (let y = 2023; y <= 2026; y += 1) {
    const startM = y === 2023 ? 4 : 1;
    const endM = y === 2026 ? 8 : 12;
    for (let m = startM; m <= endM; m += 1) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }
  return months;
}

/** Revenue ramps from early startup to current run-rate. */
export function northstarMonthlyRevenueForMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  const fyYear = m >= NORTHSTAR_FY_START_MONTH ? y : y - 1;
  const monthsSinceApr2023 = (fyYear - 2023) * 12 + (m >= NORTHSTAR_FY_START_MONTH ? m - NORTHSTAR_FY_START_MONTH : m + 8);
  if (monthsSinceApr2023 <= 3) return 55_000 + monthsSinceApr2023 * 8_000;
  if (monthsSinceApr2023 <= 12) return 95_000 + (monthsSinceApr2023 - 3) * 6_500;
  if (monthsSinceApr2023 <= 24) return 180_000 + (monthsSinceApr2023 - 12) * 5_500;
  if (monthsSinceApr2023 <= 36) return 280_000 + (monthsSinceApr2023 - 24) * 3_500;
  return NORTHSTAR_MONTHLY_REVENUE;
}

export function northstarMonthlyOpexForMonth(monthKey: string): number {
  const revenue = northstarMonthlyRevenueForMonth(monthKey);
  const ratio = NORTHSTAR_MONTHLY_OPEX / NORTHSTAR_MONTHLY_REVENUE;
  return Math.round(revenue * ratio * 0.92 + 40_000);
}

export function northstarEmployeesForMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  const fyYear = m >= NORTHSTAR_FY_START_MONTH ? y : y - 1;
  if (fyYear <= 2023) return 5;
  if (fyYear === 2024) return 12;
  if (fyYear === 2025) return 20;
  return 25;
}

export function northstarCurrentUkFyStart(): string {
  const now = new Date("2026-08-16T12:00:00.000Z");
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const fyStartYear = m >= NORTHSTAR_FY_START_MONTH ? y : y - 1;
  return `${fyStartYear}-04-01`;
}
