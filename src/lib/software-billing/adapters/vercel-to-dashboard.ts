/**
 * Map existing Vercel billing summary into the generic Software & SaaS dashboard row.
 * Does not call Vercel APIs or change sync/auth.
 *
 * Spend to Date prefers actual invoice/receipt records when supplied.
 * Until historical invoices are imported, provisional period actuals may be used
 * with coverage marked incomplete — never permanently.
 */

import {
  buildSpendToDateFromActualCharges,
  emptyActualSpend,
  emptyProjectedSpend,
  emptySpendToDate,
  roundMoney,
  type ActualSpendBreakdown,
  type AllowanceUsageState,
  type ProjectedSpendBreakdown,
  type SoftwareSaasActualChargeRecord,
  type SoftwareSaasProviderBillingRow,
  type SpendToDateState,
} from "@/lib/software-billing/dashboard-model";
import type {
  ProviderPeriodSnapshot,
  SoftwareBillingSummary,
} from "@/lib/software-billing/types";

function formatIsoDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function formatHumanDate(iso: string | null | undefined): string {
  const day = formatIsoDate(iso);
  if (!day) return "unknown date";
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(day));
  } catch {
    return day;
  }
}

function actualSpend(input: {
  total: number;
  subscription: number;
  additional: number;
  currency: string;
  note?: string;
}): ActualSpendBreakdown {
  return {
    kind: "actual",
    total: roundMoney(input.total),
    subscription: roundMoney(Math.max(0, input.subscription)),
    additionalUsageOrCredits: roundMoney(Math.max(0, input.additional)),
    currency: input.currency,
    note: input.note,
  };
}

function projectedSpend(input: {
  expectedTotal: number;
  subscription: number;
  projectedAdditional: number;
  currency: string;
  note?: string;
}): ProjectedSpendBreakdown {
  return {
    kind: "projected",
    expectedTotal: roundMoney(input.expectedTotal),
    subscription: roundMoney(Math.max(0, input.subscription)),
    projectedAdditionalUsageOrCredits: roundMoney(Math.max(0, input.projectedAdditional)),
    currency: input.currency,
    isEstimate: true,
    note: input.note,
  };
}

function buildVercelAllowance(summary: SoftwareBillingSummary): AllowanceUsageState {
  const currency = summary.currency || "USD";
  const limit = summary.vercel.analyticsSpendLimitDollars;
  const used = summary.vercel.usageEffectiveCurrent;

  if (limit != null && limit > 0) {
    const remaining = roundMoney(Math.max(0, limit - used));
    const percentUsed = roundMoney((used / limit) * 100);
    return {
      kind: "monetary_remaining",
      label: "Analytics / usage allowance",
      remaining,
      limit,
      currency,
      used: roundMoney(used),
      percentUsed,
    };
  }

  if (used > 0) {
    return {
      kind: "usage_only",
      label: "Usage (effective)",
      usageAmount: roundMoney(used),
      currency,
      detail: "No published allowance available from Vercel for this workspace.",
    };
  }

  return {
    kind: "unavailable",
    label: "Usage",
    message: "No allowance or usage figure available for this period.",
  };
}

/**
 * Provisional Spend to Date from period actuals when invoice/receipt import
 * has not been supplied yet. Marked incomplete so UI does not claim completeness.
 */
function provisionalSpendToDateFromPeriodActuals(
  summary: SoftwareBillingSummary,
  completedSnapshots?: ProviderPeriodSnapshot[],
  inProgressSnapshot?: ProviderPeriodSnapshot | null,
): SpendToDateState {
  const currency = summary.currency || "USD";

  if (completedSnapshots && completedSnapshots.length > 0) {
    const periods = [...completedSnapshots].sort(
      (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
    );
    const historical = periods.reduce((sum, row) => sum + Number(row.billedAmount || 0), 0);
    const current = inProgressSnapshot ? Number(inProgressSnapshot.billedAmount || 0) : 0;
    const trackedFrom = formatIsoDate(periods[0]?.periodStart);
    return {
      totalActual: roundMoney(historical + current),
      currency,
      trackedFrom,
      coverage: "awaiting_historical_import",
      historicalImportIncomplete: true,
      statusLabel: trackedFrom
        ? `Tracked from ${formatHumanDate(trackedFrom)} using provisional period actuals — import historical invoices/receipts for complete Spend to Date.`
        : "Provisional period actuals only — import historical invoices/receipts for complete Spend to Date.",
      invoiceOrReceiptCount: null,
      currentPeriodActualIncluded: roundMoney(current),
      historicalInvoicesActualIncluded: roundMoney(historical),
    };
  }

  const history = [...(summary.history ?? [])].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
  );
  const historical = history.reduce((sum, row) => sum + Number(row.billedAmount || 0), 0);
  const current = Number(summary.vercel.currentSpend || 0);
  const trackedFrom =
    formatIsoDate(history[0]?.periodStart) ?? formatIsoDate(summary.vercel.billingPeriodStart);

  if (historical <= 0 && current <= 0) {
    return emptySpendToDate(
      currency,
      "Awaiting historical invoice / receipt import.",
      "awaiting_historical_import",
    );
  }

  return {
    totalActual: roundMoney(historical + current),
    currency,
    trackedFrom,
    coverage: "awaiting_historical_import",
    historicalImportIncomplete: true,
    statusLabel: trackedFrom
      ? `Tracked from ${formatHumanDate(trackedFrom)} using provisional period actuals — import historical invoices/receipts for complete Spend to Date.`
      : "Provisional period actuals only — import historical invoices/receipts for complete Spend to Date.",
    invoiceOrReceiptCount: null,
    currentPeriodActualIncluded: roundMoney(current),
    historicalInvoicesActualIncluded: roundMoney(historical),
  };
}

export function adaptVercelToProviderBillingRow(input: {
  summary: SoftwareBillingSummary;
  completedSnapshots?: ProviderPeriodSnapshot[];
  inProgressSnapshot?: ProviderPeriodSnapshot | null;
  /**
   * Preferred Spend to Date source: actual invoices/receipts + current-period actual charges.
   * When provided, these drive Spend to Date instead of provisional FOCUS/period history.
   */
  actualCharges?: readonly SoftwareSaasActualChargeRecord[];
  /** Set true once historical Vercel invoices/receipts have been fully imported. */
  historicalImportComplete?: boolean;
}): SoftwareSaasProviderBillingRow {
  const { summary } = input;
  const currency = summary.currency || "USD";
  const subscription = Number(summary.vercel.baseSubscriptionMonthly || 0);
  const lastMonthTotal = Number(summary.vercel.lastMonth || 0);
  const latestHistory = [...(summary.history ?? [])].sort(
    (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime(),
  )[0];
  const lastMonthAdditional =
    latestHistory != null
      ? Number(latestHistory.usageEffectiveAmount || 0)
      : Math.max(0, lastMonthTotal - subscription);

  const upcomingSubscription = subscription;
  const projectedAdditional = Math.max(0, Number(summary.vercel.usageEffectiveCurrent || 0));
  const upcomingExpected = Number(summary.vercel.upcomingProjected || 0);
  const upcomingAdditional =
    upcomingExpected > 0
      ? roundMoney(Math.max(projectedAdditional, Math.max(0, upcomingExpected - upcomingSubscription)))
      : projectedAdditional;
  const upcomingTotal =
    upcomingExpected > 0
      ? upcomingExpected
      : roundMoney(upcomingSubscription + upcomingAdditional);

  const spendToDate =
    input.actualCharges && input.actualCharges.length > 0
      ? buildSpendToDateFromActualCharges({
          currency,
          charges: input.actualCharges,
          historicalImportComplete: Boolean(input.historicalImportComplete),
          statusLabelWhenComplete: input.historicalImportComplete
            ? undefined
            : undefined,
        })
      : provisionalSpendToDateFromPeriodActuals(
          summary,
          input.completedSnapshots,
          input.inProgressSnapshot,
        );

  const connected =
    Boolean(summary.lastSuccessfulSyncAt) || lastMonthTotal > 0 || upcomingTotal > 0;

  return {
    slug: "vercel",
    displayName: "Vercel",
    connectionStatus:
      summary.syncError && !connected ? "error" : connected ? "connected" : "not_configured",
    currency,
    planLabel: summary.vercel.planName
      ? `${summary.vercel.planName}${summary.vercel.planIteration ? ` (${summary.vercel.planIteration})` : ""}`
      : null,
    allowanceUsage: buildVercelAllowance(summary),
    lastMonth: actualSpend({
      total: lastMonthTotal,
      subscription,
      additional: lastMonthAdditional,
      currency,
      note: "Previous completed billing period (actual)",
    }),
    upcoming: projectedSpend({
      expectedTotal: upcomingTotal,
      subscription: upcomingSubscription,
      projectedAdditional: upcomingAdditional,
      currency,
      note: "Projected estimate — not a finalized invoice",
    }),
    spendToDate,
    lastSuccessfulSyncAt: summary.lastSuccessfulSyncAt,
    syncError: summary.syncError,
  };
}

export function plannedProviderBillingRow(
  slug: SoftwareSaasProviderBillingRow["slug"],
  displayName: string,
  currency: string,
): SoftwareSaasProviderBillingRow {
  return {
    slug,
    displayName,
    connectionStatus: "planned",
    currency,
    planLabel: null,
    allowanceUsage: {
      kind: "unavailable",
      label: "Usage",
      message: "Provider integration not connected yet.",
    },
    lastMonth: emptyActualSpend(currency, "Awaiting provider integration"),
    upcoming: emptyProjectedSpend(currency, "Awaiting provider integration"),
    spendToDate: emptySpendToDate(
      currency,
      "Not tracked yet — provider integration not connected.",
      "none",
    ),
    lastSuccessfulSyncAt: null,
    syncError: null,
  };
}
