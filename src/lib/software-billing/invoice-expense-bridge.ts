import { getInternalUserById } from "@/lib/expenses-data";
import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import {
  isExpenseEligibleInvoice,
  type ProviderBillingInvoice,
} from "@/lib/software-billing/billing-invoice-model";
import { linkInvoiceToExpense } from "@/lib/software-billing/invoice-db";

const DEFAULT_SYSTEM_SUBMITTER_USER_ID = "user-paul";

function requireServiceClient() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

export type SoftwareBillingExpenseCreateResult = {
  expenseId: string;
  created: boolean;
  skippedReason?: string;
};

/**
 * Idempotently create a financial_expenses row for a paid provider invoice.
 * Never creates duplicates when the same provider_invoice_key already exists.
 */
export async function createFinancialExpenseForPaidInvoice(
  invoice: ProviderBillingInvoice,
): Promise<SoftwareBillingExpenseCreateResult> {
  if (!isExpenseEligibleInvoice(invoice)) {
    return {
      expenseId: invoice.financialExpenseId ?? "",
      created: false,
      skippedReason:
        invoice.invoiceStatus !== "paid"
          ? "Invoice is not paid."
          : "Invoice is not expense-eligible (requires paid status, final confirmed amount, and provider identity).",
    };
  }

  if (invoice.financialExpenseId) {
    return {
      expenseId: invoice.financialExpenseId,
      created: false,
      skippedReason: "Invoice already linked to financial expense.",
    };
  }

  const supabase = requireServiceClient();

  const { data: existingByKey } = await supabase
    .from("financial_expenses")
    .select("id")
    .eq("workspace_id", invoice.workspaceId)
    .eq("provider_slug", invoice.providerSlug)
    .eq("provider_invoice_key", invoice.providerInvoiceKey)
    .maybeSingle();

  if (existingByKey?.id) {
    await linkInvoiceToExpense({
      invoiceId: invoice.id,
      financialExpenseId: String(existingByKey.id),
    });
    return {
      expenseId: String(existingByKey.id),
      created: false,
      skippedReason: "Financial expense already exists for provider invoice key.",
    };
  }

  const submitterUserId = process.env.SOFTWARE_BILLING_EXPENSE_SUBMITTER_USER_ID?.trim() ||
    DEFAULT_SYSTEM_SUBMITTER_USER_ID;
  const submitter = getInternalUserById(submitterUserId);
  const expenseDate =
    invoice.paymentDate ?? invoice.invoiceDate ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("financial_expenses")
    .insert({
      workspace_id: invoice.workspaceId,
      submitter_user_id: submitterUserId,
      submitter_name: submitter?.fullName ?? "Unit311 System",
      purpose_description: invoice.description,
      amount: invoice.amount,
      currency: invoice.currency,
      date_submitted: expenseDate,
      expense_date: expenseDate,
      paid: true,
      supplier: invoice.rawSummary.vendorName
        ? String(invoice.rawSummary.vendorName)
        : invoice.providerSlug,
      category_account_code: "5090",
      payment_method: invoice.paymentMethod,
      reference: invoice.invoiceNumber ?? invoice.providerTransactionId ?? invoice.providerInvoiceKey,
      attachment_path: invoice.sourceDocumentRef,
      software_asset_id: invoice.softwareAssetId,
      provider_slug: invoice.providerSlug,
      provider_invoice_key: invoice.providerInvoiceKey,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const expenseId = String(data.id);
  await linkInvoiceToExpense({ invoiceId: invoice.id, financialExpenseId: expenseId });

  if (invoice.softwareAssetId) {
    await supabase
      .from("software_assets")
      .update({
        linked_expense_id: expenseId,
        last_payment_amount: invoice.amount,
        last_payment_date: expenseDate,
        integration_connected: true,
        integration_sync_status: `Expense linked ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.softwareAssetId);
  }

  return { expenseId, created: true };
}
