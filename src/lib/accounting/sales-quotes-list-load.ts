import "server-only";

import type { SalesQuote, SalesQuoteLineItem } from "@/lib/accounting/types";
import {
  getNorthstarSalesQuotes,
} from "@/lib/demo/northstar-sales-quotes-fixtures";
import {
  getSaecSalesQuotes,
} from "@/lib/saec/demo/saec-sales-quotes-fixtures";
import { resolveFinancialsWorkspaceId, type FinancialsWorkspaceScope } from "@/lib/financials-workspace";
import { resolveAccountingFixtureSource } from "@/lib/workspace-accounting-fixtures";
import {
  normalizeBankDetails,
  normalizeLineColumnVisibility,
  type SalesQuotePricingStyle,
} from "@/lib/accounting/sales-quote-display";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

function mapLineItem(row: Record<string, unknown>): SalesQuoteLineItem {
  return {
    id: String(row.id),
    lineNumber: Number(row.line_number) || 0,
    description: String(row.description),
    detailText: row.detail_text ? String(row.detail_text) : null,
    quantity: Number(row.quantity) || 0,
    unit: row.unit ? String(row.unit) : null,
    unitPrice: Number(row.unit_price) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    taxRate: row.tax_rate != null ? Number(row.tax_rate) : null,
    taxAmount: Number(row.tax_amount) || 0,
    amount: Number(row.amount) || 0,
  };
}

function mapQuote(row: Record<string, unknown>, lineItems: SalesQuoteLineItem[]): SalesQuote {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    quoteNumber: String(row.quote_number),
    crmLeadId: row.crm_lead_id ? String(row.crm_lead_id) : null,
    clientId: row.client_id ? String(row.client_id) : null,
    companyName: String(row.company_name),
    contactName: row.contact_name ? String(row.contact_name) : null,
    contactEmail: row.contact_email ? String(row.contact_email) : null,
    title: String(row.title ?? "Sales quote"),
    currency: String(row.currency ?? "GBP"),
    subtotal: Number(row.subtotal) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    status: row.status as SalesQuote["status"],
    validUntil: row.valid_until ? String(row.valid_until) : null,
    pdfPath: row.pdf_path ? String(row.pdf_path) : null,
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    stripePaymentLinkUrl: row.stripe_payment_link_url ? String(row.stripe_payment_link_url) : null,
    notes: row.notes ? String(row.notes) : null,
    issueDate: row.issue_date ? String(row.issue_date) : null,
    reference: row.reference ? String(row.reference) : null,
    paymentTerms: row.payment_terms ? String(row.payment_terms) : null,
    termsAndConditions: row.terms_and_conditions ? String(row.terms_and_conditions) : null,
    discountAmount: Number(row.discount_amount) || 0,
    pricingStyle: (row.pricing_style === "scope_total" ? "scope_total" : "detailed") as SalesQuotePricingStyle,
    lineColumnVisibility: normalizeLineColumnVisibility(row.line_column_visibility),
    bankDetails: normalizeBankDetails(row.bank_details),
    termsPdfStoragePath: row.terms_pdf_storage_path ? String(row.terms_pdf_storage_path) : null,
    termsPdfFilename: row.terms_pdf_filename ? String(row.terms_pdf_filename) : null,
    lineItems,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function loadQuoteLines(quoteIds: string[]) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_quote_line_items")
    .select("*")
    .in("quote_id", quoteIds)
    .order("line_number", { ascending: true });
  if (error) throw new Error(error.message);
  const grouped = new Map<string, SalesQuoteLineItem[]>();
  for (const row of data ?? []) {
    const quoteId = String(row.quote_id);
    const items = grouped.get(quoteId) ?? [];
    items.push(mapLineItem(row as Record<string, unknown>));
    grouped.set(quoteId, items);
  }
  return grouped;
}

/** List quotes for a workspace — no PDF, sharp, or invoice PDF dependencies. */
export async function listSalesQuotes(scope: FinancialsWorkspaceScope): Promise<SalesQuote[]> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar") return getNorthstarSalesQuotes();
  if (fixture === "saec") return getSaecSalesQuotes();

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_quotes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => String(row.id));
  const grouped = await loadQuoteLines(ids);
  return (data ?? []).map((row) =>
    mapQuote(row as Record<string, unknown>, grouped.get(String(row.id)) ?? []),
  );
}
