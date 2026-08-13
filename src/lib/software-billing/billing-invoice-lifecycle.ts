import type {
  ProviderBillingInvoice,
  ProviderBillingInvoiceDraft,
} from "@/lib/software-billing/billing-invoice-model";
import { isExpenseEligibleInvoice } from "@/lib/software-billing/billing-invoice-model";
import { createFinancialExpenseForPaidInvoice } from "@/lib/software-billing/invoice-expense-bridge";
import { upsertProviderInvoice } from "@/lib/software-billing/invoice-db";

export type ProviderInvoiceSyncOutcome = {
  invoice: ProviderBillingInvoice;
  expenseId: string | null;
  expenseCreated: boolean;
  skippedReason?: string;
};

/**
 * Generic invoice lifecycle:
 * 1. Upsert invoice record (idempotent on provider_invoice_key)
 * 2. If PAID + final confirmed amount + valid identity → create financial_expenses row
 * 3. If upcoming → never create expense (even when amount is a final upcoming total)
 */
export async function syncProviderInvoiceLifecycle(
  draft: ProviderBillingInvoiceDraft,
): Promise<ProviderInvoiceSyncOutcome> {
  const invoice = await upsertProviderInvoice(draft);

  if (!isExpenseEligibleInvoice(invoice)) {
    return {
      invoice,
      expenseId: invoice.financialExpenseId,
      expenseCreated: false,
      skippedReason:
        invoice.invoiceStatus !== "paid"
          ? "Invoice is not paid — not an expense until payment is confirmed."
          : "Invoice is not expense-eligible (requires paid status, final confirmed amount, and provider identity).",
    };
  }

  const expenseResult = await createFinancialExpenseForPaidInvoice(invoice);
  return {
    invoice: {
      ...invoice,
      financialExpenseId: expenseResult.expenseId || invoice.financialExpenseId,
    },
    expenseId: expenseResult.expenseId || null,
    expenseCreated: expenseResult.created,
    skippedReason: expenseResult.skippedReason,
  };
}

export async function syncProviderInvoiceBatch(
  drafts: ProviderBillingInvoiceDraft[],
): Promise<ProviderInvoiceSyncOutcome[]> {
  const outcomes: ProviderInvoiceSyncOutcome[] = [];
  for (const draft of drafts) {
    outcomes.push(await syncProviderInvoiceLifecycle(draft));
  }
  return outcomes;
}
