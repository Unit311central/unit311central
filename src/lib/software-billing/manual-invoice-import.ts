/**
 * Manual provider invoice / receipt import.
 * Used when provider APIs do not expose historical invoices (e.g. Vercel pre-FOCUS periods).
 */

import { syncProviderInvoiceLifecycle } from "@/lib/software-billing/billing-invoice-lifecycle";
import type { ProviderInvoiceSyncOutcome } from "@/lib/software-billing/billing-invoice-lifecycle";
import {
  buildProviderInvoiceKey,
  withFinalInvoiceAmount,
  type ProviderBillingInvoiceDraft,
  type ProviderInvoiceStatus,
} from "@/lib/software-billing/billing-invoice-model";
import { findProviderSoftwareAssetId } from "@/lib/software-billing/provider-db";
import type { SoftwareProviderSlug } from "@/lib/software-billing/types";

export type ManualProviderInvoiceInput = {
  providerSlug: SoftwareProviderSlug;
  /** Stable idempotency key part — e.g. invoice number or billing-period start date */
  idempotencyPart: string;
  invoiceNumber?: string | null;
  providerTransactionId?: string | null;
  invoiceStatus: ProviderInvoiceStatus;
  invoiceDate?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  paymentDate?: string | null;
  scheduledPaymentDate?: string | null;
  amount: number;
  currency?: string;
  taxAmount?: number | null;
  description: string;
  category?: string;
  paymentMethod?: string;
  /** Storage path from internal-files upload */
  sourceDocumentRef?: string | null;
  sourceDocumentStatus?: "available" | "unavailable" | "pending";
  rawSummary?: Record<string, unknown>;
};

export type ManualImportResult = {
  imported: number;
  skipped: number;
  outcomes: ProviderInvoiceSyncOutcome[];
  errors: string[];
};

export function validateManualInvoice(row: ManualProviderInvoiceInput): string | null {
  if (!row.providerSlug?.trim()) return "providerSlug is required.";
  if (!row.idempotencyPart?.trim()) return "idempotencyPart is required.";
  if (!row.description?.trim()) return "description is required.";
  if (Number(row.amount) < 0 || Number.isNaN(Number(row.amount))) {
    return "amount must be a non-negative number.";
  }
  if (row.invoiceStatus === "paid" && Number(row.amount) <= 0) {
    return "paid invoices require a confirmed amount greater than zero.";
  }
  if (row.invoiceStatus === "upcoming" && Number(row.amount) <= 0) {
    return "upcoming invoices require a confirmed invoice amount greater than zero.";
  }
  return null;
}

export function buildManualInvoiceDraft(
  workspaceId: string,
  softwareAssetId: string | null,
  input: ManualProviderInvoiceInput,
): ProviderBillingInvoiceDraft {
  const providerInvoiceKey = buildProviderInvoiceKey(input.providerSlug, [
    "manual",
    input.idempotencyPart.trim(),
  ]);

  return withFinalInvoiceAmount(
    {
      workspaceId,
      providerSlug: input.providerSlug,
      softwareAssetId,
      providerInvoiceKey,
      providerTransactionId: input.providerTransactionId ?? null,
      invoiceNumber: input.invoiceNumber ?? null,
      invoiceStatus: input.invoiceStatus,
      invoiceDate: input.invoiceDate ?? null,
      billingPeriodStart: input.billingPeriodStart ?? null,
      billingPeriodEnd: input.billingPeriodEnd ?? null,
      paymentDate: input.paymentDate ?? null,
      scheduledPaymentDate: input.scheduledPaymentDate ?? null,
      amount: Number(input.amount),
      currency: (input.currency ?? "USD").toUpperCase(),
      taxAmount: input.taxAmount ?? null,
      description: input.description.trim(),
      category: input.category ?? "Software",
      paymentMethod: input.paymentMethod ?? "personally_paid",
      sourceDocumentRef: input.sourceDocumentRef ?? null,
      sourceDocumentStatus:
        input.sourceDocumentStatus ?? (input.sourceDocumentRef ? "available" : "unavailable"),
      rawSummary: {
        vendorName: input.providerSlug,
        ...(input.rawSummary ?? {}),
      },
      source: "manual_import",
    },
    {
      upcomingInvoiceAmount: input.invoiceStatus === "upcoming" ? Number(input.amount) : null,
      confirmedPaidAmount: input.invoiceStatus === "paid" ? Number(input.amount) : null,
    },
  );
}

export async function importManualProviderInvoices(
  workspaceId: string,
  invoices: readonly ManualProviderInvoiceInput[],
): Promise<ManualImportResult> {
  const outcomes: ProviderInvoiceSyncOutcome[] = [];
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (const row of invoices) {
    const validationError = validateManualInvoice(row);
    if (validationError) {
      errors.push(`${row.idempotencyPart}: ${validationError}`);
      skipped += 1;
      continue;
    }

    const softwareAssetId = await findProviderSoftwareAssetId(workspaceId, row.providerSlug);
    const draft = buildManualInvoiceDraft(workspaceId, softwareAssetId, row);

    try {
      const outcome = await syncProviderInvoiceLifecycle(draft);
      outcomes.push(outcome);
      if (outcome.expenseCreated || outcome.invoice) imported += 1;
      else skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed.";
      errors.push(`${row.idempotencyPart}: ${message}`);
      skipped += 1;
    }
  }

  return { imported, skipped, outcomes, errors };
}
