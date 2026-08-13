/**
 * Generic Software & SaaS dashboard model.
 *
 * Architecture (target):
 *   Provider API / invoice import
 *     → Provider adapter
 *     → Common billing/usage + invoice ledger model
 *     → Dashboard
 *     → Expense ledger (separate from financial_expenses accounting)
 *
 * ACTUAL vs PROJECTED are kept as separate types throughout.
 * Spend to Date is based on actual invoices/receipts + current-period actual charges —
 * not FOCUS/API period history alone. Historical invoice import is a first-class path.
 *
 * Provider integrations beyond the existing Vercel summary adapter are not implemented here.
 */

/** Known Software & SaaS providers (catalog only — most are not connected yet). */
export const SOFTWARE_SAAS_PROVIDER_SLUGS = [
  "vercel",
  "supabase",
  "openai",
  "zoho",
  "zoho-campaigns",
  "snovio",
  "cursor",
  "linkedin-sales-navigator",
] as const;

export type SoftwareSaasProviderSlug = (typeof SOFTWARE_SAAS_PROVIDER_SLUGS)[number];

export type SoftwareSaasProviderConnectionStatus =
  | "connected"
  | "planned"
  | "not_configured"
  | "error";

export type SoftwareSaasProviderCatalogEntry = {
  slug: SoftwareSaasProviderSlug;
  displayName: string;
  shortName: string;
};

export const SOFTWARE_SAAS_PROVIDER_CATALOG: readonly SoftwareSaasProviderCatalogEntry[] = [
  { slug: "vercel", displayName: "Vercel", shortName: "Vercel" },
  { slug: "supabase", displayName: "Supabase", shortName: "Supabase" },
  { slug: "openai", displayName: "OpenAI", shortName: "OpenAI" },
  { slug: "zoho", displayName: "Zoho", shortName: "Zoho" },
  { slug: "zoho-campaigns", displayName: "Zoho Campaigns", shortName: "Zoho Campaigns" },
  { slug: "snovio", displayName: "Snov.io", shortName: "Snov.io" },
  { slug: "cursor", displayName: "Cursor", shortName: "Cursor" },
  {
    slug: "linkedin-sales-navigator",
    displayName: "LinkedIn Sales Navigator",
    shortName: "LinkedIn Sales Nav",
  },
] as const;

/**
 * ACTUAL spend only — paid invoices/receipts or finalized/current actual charges.
 * Never mix projected figures into this type.
 */
export type ActualSpendBreakdown = {
  kind: "actual";
  total: number;
  subscription: number;
  additionalUsageOrCredits: number;
  currency: string;
  note?: string;
};

/**
 * PROJECTED / expected spend only — estimates for upcoming periods.
 * Never mix finalized invoice totals into this type.
 */
export type ProjectedSpendBreakdown = {
  kind: "projected";
  expectedTotal: number;
  subscription: number;
  projectedAdditionalUsageOrCredits: number;
  currency: string;
  /** Always true for projected figures — UI should label as Estimate. */
  isEstimate: true;
  note?: string;
};

/**
 * Flexible allowance / usage presentation.
 * Providers expose very different signals — never invent an allowance.
 */
export type AllowanceUsageState =
  | {
      kind: "monetary_remaining";
      label: string;
      remaining: number;
      limit: number;
      currency: string;
      used?: number;
      percentUsed?: number;
    }
  | {
      kind: "percent_used";
      label: string;
      percentUsed: number;
      usedLabel?: string;
      limitLabel?: string;
    }
  | {
      kind: "credits";
      label: string;
      includedCredits: number;
      usedCredits?: number;
      remainingCredits?: number;
      unitLabel?: string;
    }
  | {
      kind: "usage_only";
      label: string;
      usageAmount: number;
      currency: string;
      detail?: string;
    }
  | {
      kind: "unavailable";
      label: string;
      message: string;
    };

/**
 * Provenance for an actual charge that feeds Spend to Date.
 * Historical invoices/receipts are the durable source of truth once imported.
 */
export type SoftwareSaasActualChargeSource =
  | "historical_invoice"
  | "historical_receipt"
  | "current_period_actual"
  | "provider_invoice_import"
  | "manual_receipt"
  | "provisional_period_actual";

/**
 * One actual invoice / receipt / current-period charge line.
 * Spend to Date is the sum of these records — not FOCUS period history alone.
 */
export type SoftwareSaasActualChargeRecord = {
  id: string;
  provider: SoftwareSaasProviderSlug;
  source: SoftwareSaasActualChargeSource;
  /** Invoice or receipt date (ISO). */
  invoiceDate: string;
  /** Inclusive billing period when known. */
  billingPeriod: { start: string; end: string } | null;
  description: string;
  amount: number;
  currency: string;
  taxAmount: number | null;
  invoiceReceiptReference: string | null;
  /** Provider-native invoice / transaction id when available. */
  providerTransactionId: string | null;
  /** Storage key / URL / file id for the source document. */
  sourceDocumentRef: string | null;
};

export type SpendToDateCoverage =
  | "complete"
  | "partial_import_in_progress"
  | "awaiting_historical_import"
  | "none";

/**
 * Spend to Date = actual cumulative paid/charged amount.
 *
 * Intended formula once invoice import exists:
 *   sum(historical invoices/receipts) + sum(current-period actual charges)
 *
 * Coverage becomes `complete` after historical invoices/receipts have been imported.
 * Until then adapters may use provisional period actuals, but must mark coverage incomplete.
 */
export type SpendToDateState = {
  /** Actual cumulative spend only — never includes projections. */
  totalActual: number;
  currency: string;
  /** Earliest invoice/receipt/charge date included in the total. */
  trackedFrom: string | null;
  coverage: SpendToDateCoverage;
  /**
   * True only while historical invoice/receipt import is incomplete.
   * Once import is complete, this must be false and coverage = "complete".
   */
  historicalImportIncomplete: boolean;
  /** Human-readable status for the UI. */
  statusLabel: string;
  invoiceOrReceiptCount: number | null;
  /** Optional current-period actual amount included in the total. */
  currentPeriodActualIncluded: number;
  /** Optional historical invoice/receipt amount included in the total. */
  historicalInvoicesActualIncluded: number;
};

export type SoftwareSaasProviderBillingRow = {
  slug: SoftwareSaasProviderSlug;
  displayName: string;
  connectionStatus: SoftwareSaasProviderConnectionStatus;
  currency: string;
  planLabel: string | null;
  allowanceUsage: AllowanceUsageState;
  /** Last month — ACTUAL only. */
  lastMonth: ActualSpendBreakdown;
  /** Upcoming — PROJECTED only. */
  upcoming: ProjectedSpendBreakdown;
  /** Spend to date — ACTUAL cumulative only. */
  spendToDate: SpendToDateState;
  lastSuccessfulSyncAt: string | null;
  syncError: string | null;
};

export type SoftwareSaasDashboardSummary = {
  currency: string;
  lastMonth: ActualSpendBreakdown;
  upcoming: ProjectedSpendBreakdown;
  spendToDate: SpendToDateState;
  lastSuccessfulSyncAt: string | null;
  syncStatus: "never" | "ok" | "stale" | "error";
  syncError: string | null;
};

export type SoftwareSaasDashboard = {
  summary: SoftwareSaasDashboardSummary;
  providers: SoftwareSaasProviderBillingRow[];
};

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function emptyActualSpend(currency: string, note?: string): ActualSpendBreakdown {
  return {
    kind: "actual",
    total: 0,
    subscription: 0,
    additionalUsageOrCredits: 0,
    currency,
    note,
  };
}

export function emptyProjectedSpend(
  currency: string,
  note?: string,
): ProjectedSpendBreakdown {
  return {
    kind: "projected",
    expectedTotal: 0,
    subscription: 0,
    projectedAdditionalUsageOrCredits: 0,
    currency,
    isEstimate: true,
    note,
  };
}

export function emptySpendToDate(
  currency: string,
  statusLabel: string,
  coverage: SpendToDateCoverage = "none",
): SpendToDateState {
  return {
    totalActual: 0,
    currency,
    trackedFrom: null,
    coverage,
    historicalImportIncomplete: coverage !== "complete",
    statusLabel,
    invoiceOrReceiptCount: null,
    currentPeriodActualIncluded: 0,
    historicalInvoicesActualIncluded: 0,
  };
}

/**
 * Build Spend to Date from actual charge records (invoices/receipts + current-period actuals).
 * This is the canonical path once historical import is available.
 */
export function buildSpendToDateFromActualCharges(input: {
  currency: string;
  charges: readonly SoftwareSaasActualChargeRecord[];
  /** When true, historical invoices/receipts have been fully imported for this provider. */
  historicalImportComplete: boolean;
  statusLabelWhenComplete?: string;
  statusLabelWhenIncomplete?: string;
}): SpendToDateState {
  const { currency, charges, historicalImportComplete } = input;
  if (charges.length === 0) {
    return emptySpendToDate(
      currency,
      historicalImportComplete
        ? "No actual charges recorded yet."
        : "Awaiting historical invoice / receipt import.",
      historicalImportComplete ? "complete" : "awaiting_historical_import",
    );
  }

  let total = 0;
  let historical = 0;
  let current = 0;
  let earliest: string | null = null;

  for (const charge of charges) {
    const amount = Number(charge.amount || 0);
    total += amount;
    if (
      charge.source === "current_period_actual" ||
      charge.source === "provisional_period_actual"
    ) {
      current += amount;
    } else {
      historical += amount;
    }
    const day = charge.invoiceDate.slice(0, 10);
    if (!earliest || day < earliest) earliest = day;
  }

  const coverage: SpendToDateCoverage = historicalImportComplete
    ? "complete"
    : "partial_import_in_progress";

  return {
    totalActual: roundMoney(total),
    currency,
    trackedFrom: earliest,
    coverage,
    historicalImportIncomplete: !historicalImportComplete,
    statusLabel: historicalImportComplete
      ? input.statusLabelWhenComplete ??
        (earliest
          ? `Complete actual spend tracked from ${earliest}.`
          : "Complete actual spend.")
      : input.statusLabelWhenIncomplete ??
        (earliest
          ? `Tracked from ${earliest} — historical invoice/receipt import still in progress.`
          : "Historical invoice/receipt import still in progress."),
    invoiceOrReceiptCount: charges.length,
    currentPeriodActualIncluded: roundMoney(current),
    historicalInvoicesActualIncluded: roundMoney(historical),
  };
}
