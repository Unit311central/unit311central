import {
  buildProviderInvoiceKey,
  withFinalInvoiceAmount,
  type ProviderBillingInvoiceDraft,
} from "@/lib/software-billing/billing-invoice-model";
import { VERCEL_PROVIDER_SLUG } from "@/lib/software-billing/types";
import { fetchVercelTeamBillingDetails } from "@/lib/software-billing/vercel-client";
import { fetchVercelUpcomingInvoicePreview } from "@/lib/software-billing/vercel-upcoming-invoice";

export type VercelInvoiceDraftResult = ProviderBillingInvoiceDraft & {
  dataQuality: "actual" | "unavailable";
  note: string;
};

export type VercelInvoiceDiscoveryReport = {
  teamId: string;
  teamSlug: string;
  currency: string;
  planName: string;
  /** Only the current open billing period is auto-discovered. Historical invoices require manual import. */
  invoices: VercelInvoiceDraftResult[];
  gaps: string[];
  historicalPeriodsSkipped: number;
};

function formatPeriodLabel(startIso: string, endIso: string) {
  return `${startIso.slice(0, 10)} → ${endIso.slice(0, 10)}`;
}

/**
 * Discover the current Vercel upcoming invoice only.
 *
 * Historical billing periods are NOT auto-reconciled — Vercel FOCUS returns
 * costs_not_found for pre-current periods and raw usage is not an invoice amount.
 * Use manual invoice/receipt import for historical paid invoices.
 */
export async function discoverVercelBillingInvoices(input: {
  workspaceId: string;
  softwareAssetId: string | null;
}): Promise<VercelInvoiceDiscoveryReport> {
  const gaps = [
    "Vercel does not expose a public historical invoice list API or downloadable invoice PDFs via REST.",
    "Historical paid invoices must be imported manually from the Vercel dashboard billing page.",
    "Raw FOCUS/usage charge totals are stored for reference only — they are not invoice amounts.",
    "Source document attachment is unavailable via API; attach receipts during manual import.",
  ];

  const team = await fetchVercelTeamBillingDetails();
  const preview = await fetchVercelUpcomingInvoicePreview();
  const invoiceKey = buildProviderInvoiceKey(VERCEL_PROVIDER_SLUG, [
    team.teamId,
    "billing-period",
    team.periodStart.slice(0, 10),
  ]);

  const accountingLayers = {
    rawUsageAmount: preview.rawUsageAmount,
    creditsAndAllowancesAmount: preview.creditsAndAllowancesAmount,
    subscriptionAmount: preview.subscriptionTotal,
    netOnDemandAmount: preview.netOnDemandAmount,
    upcomingInvoiceAmount: preview.upcomingInvoiceTotal,
    subscriptionLineItems: preview.subscriptionLineItems,
  };

  const invoice: VercelInvoiceDraftResult = withFinalInvoiceAmount(
    {
      workspaceId: input.workspaceId,
      providerSlug: "vercel",
      softwareAssetId: input.softwareAssetId,
      providerInvoiceKey: invoiceKey,
      providerTransactionId: null,
      invoiceNumber: null,
      invoiceStatus: "upcoming",
      invoiceDate: null,
      billingPeriodStart: preview.billingPeriodStart,
      billingPeriodEnd: preview.billingPeriodEnd,
      paymentDate: null,
      scheduledPaymentDate: preview.scheduledPaymentDate,
      amount: preview.upcomingInvoiceTotal,
      currency: preview.currency,
      taxAmount: null,
      description: `Vercel upcoming invoice — ${formatPeriodLabel(preview.billingPeriodStart, preview.billingPeriodEnd)}`,
      category: "Software",
      paymentMethod: "personally_paid",
      sourceDocumentRef: null,
      sourceDocumentStatus: "unavailable",
      rawSummary: {
        vendorName: "Vercel",
        planName: team.plan,
        planIteration: team.planIteration,
        note: preview.note,
        dataQuality: "actual",
      },
      source: "vercel_invoice_adapter",
      dataQuality: "actual",
      note: preview.note,
    },
    accountingLayers,
  );

  return {
    teamId: team.teamId,
    teamSlug: team.teamSlug,
    currency: team.currency,
    planName: team.plan,
    invoices: [invoice],
    gaps,
    historicalPeriodsSkipped: 0,
  };
}
