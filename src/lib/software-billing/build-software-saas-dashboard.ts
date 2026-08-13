/**

 * Assemble the generic Software & SaaS dashboard from existing billing summary data.

 * Does not perform provider sync or call external APIs.

 */



import { adaptCursorToProviderBillingRow } from "@/lib/software-billing/adapters/cursor-to-dashboard";

import { adaptOpenAiToProviderBillingRow } from "@/lib/software-billing/adapters/openai-to-dashboard";

import { adaptSupabaseToProviderBillingRow } from "@/lib/software-billing/adapters/supabase-to-dashboard";

import {

  adaptVercelToProviderBillingRow,

  plannedProviderBillingRow,

} from "@/lib/software-billing/adapters/vercel-to-dashboard";

import {

  SOFTWARE_SAAS_PROVIDER_CATALOG,

  emptyActualSpend,

  emptyProjectedSpend,

  emptySpendToDate,

  roundMoney,

  type ActualSpendBreakdown,

  type ProjectedSpendBreakdown,

  type SoftwareSaasActualChargeRecord,

  type SoftwareSaasDashboard,

  type SoftwareSaasDashboardSummary,

  type SoftwareSaasProviderBillingRow,

  type SpendToDateState,

} from "@/lib/software-billing/dashboard-model";

import type {

  ProviderBillingContext,

  ProviderPeriodSnapshot,

  SoftwareBillingSummary,

  SoftwareProviderSlug,

} from "@/lib/software-billing/types";
import type { ProviderBillingInvoice } from "@/lib/software-billing/billing-invoice-model";
import { buildTotalSoftwareAccountingFromInvoices } from "@/lib/software-billing/invoice-dashboard-helpers";

function sumActual(
  rows: SoftwareSaasProviderBillingRow[],

  currency: string,

  note?: string,

): ActualSpendBreakdown {

  let total = 0;

  let subscription = 0;

  let additional = 0;

  for (const row of rows) {

    if (row.connectionStatus === "planned" || row.connectionStatus === "not_configured") {

      continue;

    }

    total += row.lastMonth.total;

    subscription += row.lastMonth.subscription;

    additional += row.lastMonth.additionalUsageOrCredits;

  }

  return {

    kind: "actual",

    total: roundMoney(total),

    subscription: roundMoney(subscription),

    additionalUsageOrCredits: roundMoney(additional),

    currency,

    note,

  };

}



function sumProjected(

  rows: SoftwareSaasProviderBillingRow[],

  currency: string,

  note?: string,

): ProjectedSpendBreakdown {

  let expectedTotal = 0;

  let subscription = 0;

  let projectedAdditional = 0;

  for (const row of rows) {

    if (row.connectionStatus === "planned" || row.connectionStatus === "not_configured") {

      continue;

    }

    expectedTotal += row.upcoming.expectedTotal;

    subscription += row.upcoming.subscription;

    projectedAdditional += row.upcoming.projectedAdditionalUsageOrCredits;

  }

  return {

    kind: "projected",

    expectedTotal: roundMoney(expectedTotal),

    subscription: roundMoney(subscription),

    projectedAdditionalUsageOrCredits: roundMoney(projectedAdditional),

    currency,

    isEstimate: true,

    note,

  };

}



function mergeSpendToDate(

  rows: SoftwareSaasProviderBillingRow[],

  currency: string,

): SpendToDateState {

  const active = rows.filter(

    (row) => row.connectionStatus === "connected" || row.connectionStatus === "error",

  );

  if (active.length === 0) {

    return emptySpendToDate(

      currency,

      "No connected providers with tracked actual spend yet.",

      "none",

    );

  }



  let totalActual = 0;

  let invoiceCount = 0;

  let earliest: string | null = null;

  let anyIncomplete = false;

  let anyComplete = false;

  let historical = 0;

  let current = 0;

  const labels: string[] = [];



  for (const row of active) {

    totalActual += row.spendToDate.totalActual;

    historical += row.spendToDate.historicalInvoicesActualIncluded;

    current += row.spendToDate.currentPeriodActualIncluded;

    if (row.spendToDate.invoiceOrReceiptCount != null) {

      invoiceCount += row.spendToDate.invoiceOrReceiptCount;

    }

    anyIncomplete = anyIncomplete || row.spendToDate.historicalImportIncomplete;

    anyComplete = anyComplete || row.spendToDate.coverage === "complete";

    if (row.spendToDate.trackedFrom) {

      if (!earliest || row.spendToDate.trackedFrom < earliest) {

        earliest = row.spendToDate.trackedFrom;

      }

    }

    if (row.spendToDate.statusLabel) {

      labels.push(`${row.displayName}: ${row.spendToDate.statusLabel}`);

    }

  }



  const coverage =

    !anyIncomplete && anyComplete

      ? ("complete" as const)

      : anyIncomplete

        ? ("partial_import_in_progress" as const)

        : ("awaiting_historical_import" as const);



  return {

    totalActual: roundMoney(totalActual),

    currency,

    trackedFrom: earliest,

    coverage,

    historicalImportIncomplete: anyIncomplete,

    statusLabel:

      labels.length === 1

        ? labels[0]!

        : coverage === "complete"

          ? earliest

            ? `Complete actual spend tracked from ${earliest} across connected providers.`

            : "Complete actual spend across connected providers."

          : earliest

            ? `Tracked from ${earliest} — historical invoice/receipt import still required for complete Spend to Date.`

            : "Historical invoice/receipt import still required for complete Spend to Date.",

    invoiceOrReceiptCount: invoiceCount > 0 ? invoiceCount : null,

    currentPeriodActualIncluded: roundMoney(current),

    historicalInvoicesActualIncluded: roundMoney(historical),

  };

}



function adaptProviderRow(

  slug: SoftwareSaasProviderBillingRow["slug"],

  displayName: string,

  currency: string,

  input: {

    summary: SoftwareBillingSummary | null;

    providerContexts?: Partial<Record<SoftwareProviderSlug, ProviderBillingContext>>;

    completedSnapshots?: ProviderPeriodSnapshot[];

    inProgressSnapshot?: ProviderPeriodSnapshot | null;

    actualCharges?: readonly SoftwareSaasActualChargeRecord[];

    historicalImportComplete?: boolean;

    providerInvoices?: readonly ProviderBillingInvoice[];

  },

): SoftwareSaasProviderBillingRow {

  const context = input.providerContexts?.[slug as SoftwareProviderSlug];

  const providerInvoices = input.providerInvoices?.filter((row) => row.providerSlug === slug);

  if (slug === "vercel" && input.summary) {

    return adaptVercelToProviderBillingRow({

      summary: input.summary,

      completedSnapshots: input.completedSnapshots,

      inProgressSnapshot: input.inProgressSnapshot,

      actualCharges: input.actualCharges,

      historicalImportComplete: input.historicalImportComplete,

      providerInvoices,

    });

  }



  if (slug === "openai" && context) {

    return adaptOpenAiToProviderBillingRow(context);

  }



  if (slug === "cursor" && context) {

    return adaptCursorToProviderBillingRow(context);

  }



  if (slug === "supabase" && context) {

    return adaptSupabaseToProviderBillingRow(context);

  }



  return plannedProviderBillingRow(slug, displayName, currency);

}



export function buildSoftwareSaasDashboard(input: {

  summary: SoftwareBillingSummary | null;

  providerContexts?: Partial<Record<SoftwareProviderSlug, ProviderBillingContext>>;

  completedSnapshots?: ProviderPeriodSnapshot[];

  inProgressSnapshot?: ProviderPeriodSnapshot | null;

  /** Preferred actual invoice/receipt charges for Spend to Date (Vercel and future providers). */

  actualChargesByProvider?: Partial<

    Record<SoftwareSaasProviderBillingRow["slug"], readonly SoftwareSaasActualChargeRecord[]>

  >;

  historicalImportCompleteByProvider?: Partial<

    Record<SoftwareSaasProviderBillingRow["slug"], boolean>

  >;

  /** Accounting-backed provider invoices (paid + upcoming). */

  providerInvoices?: readonly ProviderBillingInvoice[];

}): SoftwareSaasDashboard {

  const currency = input.summary?.currency ?? "USD";

  const providers: SoftwareSaasProviderBillingRow[] = SOFTWARE_SAAS_PROVIDER_CATALOG.map(

    (entry) =>

      adaptProviderRow(entry.slug, entry.displayName, currency, {

        summary: input.summary,

        providerContexts: input.providerContexts,

        completedSnapshots: entry.slug === "vercel" ? input.completedSnapshots : undefined,

        inProgressSnapshot: entry.slug === "vercel" ? input.inProgressSnapshot : undefined,

        actualCharges: input.actualChargesByProvider?.[entry.slug],

        historicalImportComplete: input.historicalImportCompleteByProvider?.[entry.slug],

        providerInvoices: input.providerInvoices,

      }),

  );



  if (!input.summary) {

    const summary: SoftwareSaasDashboardSummary = {

      currency,

      lastMonth: emptyActualSpend(currency),

      upcoming: emptyProjectedSpend(currency),

      spendToDate: emptySpendToDate(currency, "Billing summary not loaded."),

      lastSuccessfulSyncAt: null,

      syncStatus: "never",

      syncError: null,

    };

    return { summary, providers };

  }



  const invoiceAccounting =
    input.providerInvoices && input.providerInvoices.length > 0
      ? buildTotalSoftwareAccountingFromInvoices({
          currency,
          invoices: input.providerInvoices,
        })
      : null;

  const dashboardSummary: SoftwareSaasDashboardSummary = {

    currency,

    lastMonth: invoiceAccounting
      ? invoiceAccounting.lastMonth
      : sumActual(
          providers,
          currency,
          "Completed billing actuals across connected providers",
        ),

    upcoming: invoiceAccounting
      ? invoiceAccounting.upcoming
      : sumProjected(
          providers,
          currency,
          "Projected estimates for upcoming / in-progress billing periods",
        ),

    spendToDate: invoiceAccounting
      ? invoiceAccounting.spendToDate
      : mergeSpendToDate(providers, currency),

    lastSuccessfulSyncAt: input.summary.lastSuccessfulSyncAt,

    syncStatus: input.summary.syncStatus,

    syncError: input.summary.syncError,

  };



  return { summary: dashboardSummary, providers };

}


