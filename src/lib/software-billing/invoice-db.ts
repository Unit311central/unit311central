import {
  SOFTWARE_PROVIDER_BILLING_MIGRATION_PATH,
  ensureSoftwareProviderInvoiceTables,
  withSoftwareProviderBillingTables,
} from "@/lib/internal-db-migrations";
import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import type {
  ProviderBillingInvoice,
  ProviderBillingInvoiceDraft,
  ProviderInvoiceStatus,
} from "@/lib/software-billing/billing-invoice-model";

function requireServiceClient() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

function mapInvoice(row: Record<string, unknown>): ProviderBillingInvoice {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    providerSlug: String(row.provider_slug) as ProviderBillingInvoice["providerSlug"],
    softwareAssetId: row.software_asset_id ? String(row.software_asset_id) : null,
    providerInvoiceKey: String(row.provider_invoice_key),
    providerTransactionId: row.provider_transaction_id ? String(row.provider_transaction_id) : null,
    invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
    invoiceStatus: row.invoice_status as ProviderInvoiceStatus,
    invoiceDate: row.invoice_date ? String(row.invoice_date) : null,
    billingPeriodStart: row.billing_period_start ? String(row.billing_period_start) : null,
    billingPeriodEnd: row.billing_period_end ? String(row.billing_period_end) : null,
    paymentDate: row.payment_date ? String(row.payment_date) : null,
    scheduledPaymentDate: row.scheduled_payment_date
      ? String(row.scheduled_payment_date)
      : null,
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "USD"),
    taxAmount: row.tax_amount == null ? null : Number(row.tax_amount),
    description: String(row.description ?? ""),
    category: String(row.category ?? "Software"),
    paymentMethod: String(row.payment_method ?? "personally_paid"),
    sourceDocumentRef: row.source_document_ref ? String(row.source_document_ref) : null,
    sourceDocumentStatus: (row.source_document_status ??
      "unavailable") as ProviderBillingInvoice["sourceDocumentStatus"],
    financialExpenseId: row.financial_expense_id ? String(row.financial_expense_id) : null,
    rawSummary: (row.raw_summary as Record<string, unknown>) ?? {},
    source: String(row.source ?? "provider_api"),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function ensureProviderInvoiceTablesReady() {
  await ensureSoftwareProviderInvoiceTables();
  return withSoftwareProviderBillingTables(async () => {
    const supabase = requireServiceClient();
    const { error } = await supabase.from("software_provider_invoices").select("id").limit(1);
    if (error && error.message.includes("does not exist")) {
      throw new Error(
        "software_provider_invoices table is missing. Apply migration 139_software_provider_invoices.sql.",
      );
    }
    if (error) throw new Error(error.message);
  });
}

export async function upsertProviderInvoice(
  draft: ProviderBillingInvoiceDraft,
): Promise<ProviderBillingInvoice> {
  await ensureProviderInvoiceTablesReady();
  const supabase = requireServiceClient();
  const payload = {
    workspace_id: draft.workspaceId,
    provider_slug: draft.providerSlug,
    software_asset_id: draft.softwareAssetId,
    provider_invoice_key: draft.providerInvoiceKey,
    provider_transaction_id: draft.providerTransactionId,
    invoice_number: draft.invoiceNumber,
    invoice_status: draft.invoiceStatus,
    invoice_date: draft.invoiceDate,
    billing_period_start: draft.billingPeriodStart,
    billing_period_end: draft.billingPeriodEnd,
    payment_date: draft.paymentDate,
    scheduled_payment_date: draft.scheduledPaymentDate,
    amount: draft.amount,
    currency: draft.currency,
    tax_amount: draft.taxAmount,
    description: draft.description,
    category: draft.category,
    payment_method: draft.paymentMethod,
    source_document_ref: draft.sourceDocumentRef,
    source_document_status: draft.sourceDocumentStatus,
    financial_expense_id: draft.financialExpenseId ?? null,
    raw_summary: draft.rawSummary,
    source: draft.source,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("software_provider_invoices")
    .upsert(payload, {
      onConflict: "workspace_id,provider_slug,provider_invoice_key",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapInvoice(data);
}

export async function getProviderInvoiceByKey(input: {
  workspaceId: string;
  providerSlug: string;
  providerInvoiceKey: string;
}): Promise<ProviderBillingInvoice | null> {
  await ensureProviderInvoiceTablesReady();
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("software_provider_invoices")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("provider_slug", input.providerSlug)
    .eq("provider_invoice_key", input.providerInvoiceKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapInvoice(data) : null;
}

export async function listProviderInvoices(
  workspaceId: string,
  providerSlug?: string,
): Promise<ProviderBillingInvoice[]> {
  await ensureProviderInvoiceTablesReady();
  const supabase = requireServiceClient();
  let query = supabase
    .from("software_provider_invoices")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("billing_period_start", { ascending: false });
  if (providerSlug) query = query.eq("provider_slug", providerSlug);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapInvoice(row));
}

export async function linkInvoiceToExpense(input: {
  invoiceId: string;
  financialExpenseId: string;
}) {
  const supabase = requireServiceClient();
  const { error } = await supabase
    .from("software_provider_invoices")
    .update({
      financial_expense_id: input.financialExpenseId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.invoiceId);
  if (error) throw new Error(error.message);
}

export { SOFTWARE_PROVIDER_BILLING_MIGRATION_PATH };
