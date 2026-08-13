/**
 * Dry-run Vercel upcoming invoice preview for reporting.
 * Usage: node --import tsx scripts/vercel-legacy-import-preview.ts
 */
import { discoverVercelBillingInvoices } from "@/lib/software-billing/adapters/vercel-invoice-adapter";
import { fetchVercelUpcomingInvoicePreview } from "@/lib/software-billing/vercel-upcoming-invoice";

const workspaceId = process.env.UNIT311_INTERNAL_WORKSPACE_ID ?? "00000000-0000-0000-0000-000000000001";

async function main() {
  if (!process.env.VERCEL_API_TOKEN?.trim()) {
    console.error("VERCEL_API_TOKEN is not set.");
    process.exit(1);
  }

  const [preview, discovery] = await Promise.all([
    fetchVercelUpcomingInvoicePreview(),
    discoverVercelBillingInvoices({ workspaceId, softwareAssetId: null }),
  ]);

  const upcoming = discovery.invoices.filter((row) => row.invoiceStatus === "upcoming");

  const report = {
    upcomingInvoice: {
      total: preview.upcomingInvoiceTotal,
      subscriptionTotal: preview.subscriptionTotal,
      subscriptionLineItems: preview.subscriptionLineItems,
      netOnDemandAmount: preview.netOnDemandAmount,
      rawUsageAmount: preview.rawUsageAmount,
      creditsAndAllowancesAmount: preview.creditsAndAllowancesAmount,
      scheduledPaymentDate: preview.scheduledPaymentDate,
      billingPeriod: `${preview.billingPeriodStart.slice(0, 10)} → ${preview.billingPeriodEnd.slice(0, 10)}`,
      status: "upcoming",
      includedInSpendToDate: false,
      expenseWouldBeCreated: false,
    },
    historicalAutoImport: {
      count: 0,
      note: "Historical invoices are not auto-imported. Use POST /api/internal/software-billing/invoices/manual-import.",
    },
    documentGaps: discovery.gaps,
    invoiceRecordsFromDiscovery: upcoming.map((row) => ({
      key: row.providerInvoiceKey,
      amount: row.amount,
      invoiceAmountKind: row.rawSummary.invoiceAmountKind,
      accountingLayers: row.rawSummary.accountingLayers,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
