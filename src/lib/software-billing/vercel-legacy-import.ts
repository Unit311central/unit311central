import { syncProviderInvoiceBatch } from "@/lib/software-billing/billing-invoice-lifecycle";
import type { ProviderInvoiceSyncOutcome } from "@/lib/software-billing/billing-invoice-lifecycle";
import { discoverVercelBillingInvoices } from "@/lib/software-billing/adapters/vercel-invoice-adapter";
import { isExpenseEligibleInvoice } from "@/lib/software-billing/billing-invoice-model";
import { findProviderSoftwareAssetId } from "@/lib/software-billing/provider-db";
import { VERCEL_PROVIDER_SLUG } from "@/lib/software-billing/types";
import { isVercelBillingConfigured } from "@/lib/software-billing/vercel-config";

export type VercelLegacyImportReport = {
  ok: boolean;
  error?: string;
  discovery: Awaited<ReturnType<typeof discoverVercelBillingInvoices>> | null;
  upcomingCount: number;
  paidCount: number;
  expensesCreated: number;
  expensesSkipped: number;
  expensesEligible: number;
  outcomes: ProviderInvoiceSyncOutcome[];
};

export async function previewVercelLegacyImport(
  workspaceId: string,
): Promise<VercelLegacyImportReport> {
  if (!isVercelBillingConfigured()) {
    return {
      ok: false,
      error: "VERCEL_API_TOKEN is not configured on the server.",
      discovery: null,
      paidCount: 0,
      upcomingCount: 0,
      expensesCreated: 0,
      expensesSkipped: 0,
      expensesEligible: 0,
      outcomes: [],
    };
  }

  const softwareAssetId = await findProviderSoftwareAssetId(workspaceId, VERCEL_PROVIDER_SLUG);
  const discovery = await discoverVercelBillingInvoices({ workspaceId, softwareAssetId });
  const upcomingCount = discovery.invoices.filter((row) => row.invoiceStatus === "upcoming").length;
  const paidCount = discovery.invoices.filter((row) => row.invoiceStatus === "paid").length;
  const expensesEligible = discovery.invoices.filter((row) => isExpenseEligibleInvoice(row)).length;

  return {
    ok: true,
    discovery,
    paidCount,
    upcomingCount,
    expensesCreated: 0,
    expensesSkipped: 0,
    expensesEligible,
    outcomes: [],
  };
}

export async function runVercelLegacyImport(
  workspaceId: string,
  options?: { dryRun?: boolean },
): Promise<VercelLegacyImportReport> {
  const preview = await previewVercelLegacyImport(workspaceId);
  if (!preview.ok || !preview.discovery) return preview;
  if (options?.dryRun) return preview;

  const outcomes = await syncProviderInvoiceBatch(preview.discovery.invoices);
  const expensesCreated = outcomes.filter((row) => row.expenseCreated).length;
  const expensesSkipped = outcomes.filter((row) => !row.expenseCreated).length;

  return {
    ...preview,
    expensesCreated,
    expensesSkipped,
    expensesEligible: preview.expensesEligible,
    outcomes,
  };
}
