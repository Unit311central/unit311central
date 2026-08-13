/**
 * Executive Software & SaaS dashboard metrics from shared software-asset records.
 * Totals only — no provider rows, allowance, or invented provider figures.
 */

import type { SoftwareAsset } from "@/lib/software-assets-data";
import { roundMoney } from "@/lib/software-billing/dashboard-model";

export type SoftwareSaasMonthlyPoint = {
  /** YYYY-MM */
  month: string;
  /** Short label for charts, e.g. "Jul 26" */
  label: string;
  amount: number;
};

export type SoftwareSaasBiggestIncrease = {
  softwareName: string;
  softwareId: string;
  increase: number;
};

export type SoftwareSaasHighestSpend = {
  softwareName: string;
  softwareId: string;
  amount: number;
};

export type SoftwareSaasExecutiveDashboard = {
  currency: string;
  /** Total spend across all software/SaaS in the previous calendar month. */
  lastMonth: number;
  /** Estimated total spend across all software/SaaS for the upcoming / current run-rate. */
  upcoming: number;
  /**
   * Cumulative spend from the first month any expenditure was recorded through
   * the current month (inclusive), using register monthly costs for months in force.
   */
  spendToDate: number;
  /** First month of recorded expenditure (YYYY-MM), or null when none. */
  firstExpenditureMonth: string | null;
  monthlyTrend: SoftwareSaasMonthlyPoint[];
  biggestIncreaseLastMonth: SoftwareSaasBiggestIncrease | null;
  /** Software with the highest spend last month. */
  highestSpendSoftware: SoftwareSaasHighestSpend | null;
  thisMonth: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function monthKeyFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return day.slice(0, 7);
}

export function addMonthsToKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y!, (m! - 1) + delta, 1));
  return toMonthKey(date);
}

function compareMonthKeys(a: string, b: string) {
  return a.localeCompare(b);
}

function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function assetMonthlyAmount(asset: SoftwareAsset): number {
  if (Number(asset.monthlyCost || 0) > 0) return Number(asset.monthlyCost);
  if (Number(asset.annualCost || 0) > 0) {
    if (asset.renewalFrequency === "Quarterly") return Number(asset.annualCost) / 4;
    if (asset.renewalFrequency === "Annually") return Number(asset.annualCost) / 12;
    return Number(asset.annualCost) / 12;
  }
  return 0;
}

/**
 * First month this asset contributes spend, when a monthly amount exists.
 * Prefer last payment month, else createdAt — do not invent earlier history.
 */
function assetStartMonth(asset: SoftwareAsset): string | null {
  if (assetMonthlyAmount(asset) <= 0) return null;
  const fromPayment = monthKeyFromIso(asset.lastPaymentDate);
  const fromCreated = monthKeyFromIso(asset.createdAt);
  if (fromPayment && fromCreated) {
    return compareMonthKeys(fromPayment, fromCreated) <= 0 ? fromPayment : fromCreated;
  }
  return fromPayment ?? fromCreated;
}

/**
 * Inclusive end month for spend attribution.
 * Cancelled assets stop at their updatedAt month; Active/Trial continue through `throughMonth`.
 */
function assetEndMonth(asset: SoftwareAsset, throughMonth: string): string | null {
  const start = assetStartMonth(asset);
  if (!start) return null;
  if (asset.status === "Cancelled") {
    const cancelled = monthKeyFromIso(asset.updatedAt) ?? throughMonth;
    return compareMonthKeys(cancelled, throughMonth) <= 0 ? cancelled : throughMonth;
  }
  if (asset.status === "Active" || asset.status === "Trial") return throughMonth;
  return null;
}

function assetInForceInMonth(asset: SoftwareAsset, month: string, throughMonth: string): boolean {
  const start = assetStartMonth(asset);
  const end = assetEndMonth(asset, throughMonth);
  if (!start || !end) return false;
  return compareMonthKeys(start, month) <= 0 && compareMonthKeys(month, end) <= 0;
}

function resolveCurrency(assets: readonly SoftwareAsset[]): string {
  const withCost = assets.find((asset) => assetMonthlyAmount(asset) > 0 && asset.currency);
  return (
    withCost?.currency ||
    assets.find((asset) => asset.currency)?.currency ||
    "USD"
  );
}

function earliestExpenditureMonth(assets: readonly SoftwareAsset[]): string | null {
  let earliest: string | null = null;
  for (const asset of assets) {
    const start = assetStartMonth(asset);
    if (!start) continue;
    if (!earliest || compareMonthKeys(start, earliest) < 0) earliest = start;
  }
  return earliest;
}

function enumerateMonths(from: string, to: string): string[] {
  if (compareMonthKeys(from, to) > 0) return [];
  const months: string[] = [];
  let cursor = from;
  while (compareMonthKeys(cursor, to) <= 0) {
    months.push(cursor);
    cursor = addMonthsToKey(cursor, 1);
  }
  return months;
}

function monthTotal(
  assets: readonly SoftwareAsset[],
  month: string,
  throughMonth: string,
): number {
  let total = 0;
  for (const asset of assets) {
    if (!assetInForceInMonth(asset, month, throughMonth)) continue;
    total += assetMonthlyAmount(asset);
  }
  return roundMoney(total);
}

function assetAmountInMonth(
  asset: SoftwareAsset,
  month: string,
  throughMonth: string,
): number {
  if (!assetInForceInMonth(asset, month, throughMonth)) return 0;
  return roundMoney(assetMonthlyAmount(asset));
}

/**
 * Build the executive 6-tile dashboard from software register records.
 * Uses only existing asset costs — never invents provider-specific figures.
 */
export function buildSoftwareSaasExecutiveDashboard(input: {
  assets: readonly SoftwareAsset[];
  /** Override "today" for tests (ISO or Date). */
  now?: string | Date;
}): SoftwareSaasExecutiveDashboard {
  const nowDate =
    input.now == null
      ? new Date()
      : typeof input.now === "string"
        ? new Date(input.now)
        : input.now;
  const currentMonth = toMonthKey(nowDate);
  const lastMonthKey = addMonthsToKey(currentMonth, -1);
  const monthBeforeLast = addMonthsToKey(currentMonth, -2);
  const currency = resolveCurrency(input.assets);
  const firstExpenditureMonth = earliestExpenditureMonth(input.assets);

  if (!firstExpenditureMonth) {
    return {
      currency,
      lastMonth: 0,
      upcoming: 0,
      spendToDate: 0,
      firstExpenditureMonth: null,
      monthlyTrend: [],
      biggestIncreaseLastMonth: null,
      highestSpendSoftware: null,
      thisMonth: 0,
    };
  }

  const trendStart =
    compareMonthKeys(firstExpenditureMonth, currentMonth) <= 0
      ? firstExpenditureMonth
      : currentMonth;
  const months = enumerateMonths(trendStart, currentMonth);

  const monthlyTrend: SoftwareSaasMonthlyPoint[] = months.map((month) => ({
    month,
    label: formatMonthLabel(month),
    amount: monthTotal(input.assets, month, currentMonth),
  }));

  const lastMonth = monthTotal(input.assets, lastMonthKey, currentMonth);
  const thisMonth = monthTotal(input.assets, currentMonth, currentMonth);
  const spendToDate = roundMoney(monthlyTrend.reduce((sum, point) => sum + point.amount, 0));

  // Upcoming = estimated run-rate of Active/Trial products currently in force.
  let upcoming = 0;
  for (const asset of input.assets) {
    if (asset.status !== "Active" && asset.status !== "Trial") continue;
    if (!assetInForceInMonth(asset, currentMonth, currentMonth)) continue;
    upcoming += assetMonthlyAmount(asset);
  }
  upcoming = roundMoney(upcoming);

  let biggestIncreaseLastMonth: SoftwareSaasBiggestIncrease | null = null;
  let highestSpendSoftware: SoftwareSaasHighestSpend | null = null;
  for (const asset of input.assets) {
    const last = assetAmountInMonth(asset, lastMonthKey, currentMonth);
    const prior = assetAmountInMonth(asset, monthBeforeLast, currentMonth);
    const increase = roundMoney(last - prior);
    if (increase > 0) {
      if (
        !biggestIncreaseLastMonth ||
        increase > biggestIncreaseLastMonth.increase
      ) {
        biggestIncreaseLastMonth = {
          softwareName: asset.name || asset.vendor || "Unknown software",
          softwareId: asset.id,
          increase,
        };
      }
    }
    if (last > 0) {
      if (!highestSpendSoftware || last > highestSpendSoftware.amount) {
        highestSpendSoftware = {
          softwareName: asset.name || asset.vendor || "Unknown software",
          softwareId: asset.id,
          amount: last,
        };
      }
    }
  }

  return {
    currency,
    lastMonth,
    upcoming,
    spendToDate,
    firstExpenditureMonth: trendStart,
    monthlyTrend,
    biggestIncreaseLastMonth,
    highestSpendSoftware,
    thisMonth,
  };
}
