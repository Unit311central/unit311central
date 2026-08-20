import { postInvoiceIssueJournal } from "@/lib/accounting/posting-rules";
import { buildSalesQuotePdf } from "@/lib/accounting/sales-quote-pdf";
import type { LedgerInvoice, SalesQuote, SalesQuoteLineItem, SalesQuoteStatus } from "@/lib/accounting/types";
import { getNorthstarCrmLeads } from "@/lib/demo/module-fixtures";
import {
  getNorthstarSalesQuoteById,
  getNorthstarSalesQuotes,
  nextNorthstarQuoteNumber,
  upsertNorthstarSalesQuote,
} from "@/lib/demo/northstar-sales-quotes-fixtures";
import { usesNorthstarStyleAccountingFixtures } from "@/lib/workspace-accounting-fixtures";
import { resolveFinancialsWorkspaceId, type FinancialsWorkspaceScope } from "@/lib/financials-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { generateInvoiceNumber } from "@/lib/subscription-invoice-pdf";
import { getLeadById } from "@/lib/crm-leads-service";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mapLineItem(row: Record<string, unknown>): SalesQuoteLineItem {
  return {
    id: String(row.id),
    lineNumber: Number(row.line_number) || 0,
    description: String(row.description),
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
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
    status: row.status as SalesQuoteStatus,
    validUntil: row.valid_until ? String(row.valid_until) : null,
    pdfPath: row.pdf_path ? String(row.pdf_path) : null,
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    stripePaymentLinkUrl: row.stripe_payment_link_url ? String(row.stripe_payment_link_url) : null,
    notes: row.notes ? String(row.notes) : null,
    lineItems,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function sumLines(lines: Array<{ quantity: number; unitPrice: number }>) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

async function loadQuoteLines(quoteIds: string[], workspaceId: string) {
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

export async function listSalesQuotes(scope: FinancialsWorkspaceScope): Promise<SalesQuote[]> {
  if (usesNorthstarStyleAccountingFixtures(scope.workspaceSlug)) {
    return getNorthstarSalesQuotes();
  }

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_quotes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => String(row.id));
  const grouped = await loadQuoteLines(ids, workspaceId);
  return (data ?? []).map((row) =>
    mapQuote(row as Record<string, unknown>, grouped.get(String(row.id)) ?? []),
  );
}

export async function getSalesQuoteById(id: string, scope: FinancialsWorkspaceScope): Promise<SalesQuote | null> {
  if (usesNorthstarStyleAccountingFixtures(scope.workspaceSlug)) {
    return getNorthstarSalesQuoteById(id);
  }

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("sales_quotes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const grouped = await loadQuoteLines([id], workspaceId);
  return mapQuote(data as Record<string, unknown>, grouped.get(id) ?? []);
}

export async function createSalesQuote(
  scope: FinancialsWorkspaceScope,
  input: {
    crmLeadId?: string | null;
    clientId?: string | null;
    companyName: string;
    contactName?: string | null;
    contactEmail?: string | null;
    title?: string;
    currency?: string;
    validUntil?: string | null;
    notes?: string | null;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  },
): Promise<SalesQuote> {
  const subtotal = sumLines(input.lineItems);
  const taxAmount = Math.round(subtotal * 0.2 * 100) / 100;
  const totalAmount = subtotal + taxAmount;
  const now = new Date().toISOString();

  if (usesNorthstarStyleAccountingFixtures(scope.workspaceSlug)) {
    const id = `nst-quote-${Date.now()}`;
    const quote: SalesQuote = {
      id,
      workspaceId: "demo-workspace",
      quoteNumber: nextNorthstarQuoteNumber(),
      crmLeadId: input.crmLeadId ?? null,
      clientId: input.clientId ?? null,
      companyName: input.companyName,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      title: input.title ?? "Sales quote",
      currency: input.currency ?? "GBP",
      subtotal,
      taxAmount,
      totalAmount,
      status: "draft",
      validUntil: input.validUntil ?? addDays(now.slice(0, 10), 30),
      pdfPath: null,
      invoiceId: null,
      stripePaymentLinkUrl: null,
      notes: input.notes ?? null,
      lineItems: input.lineItems.map((line, index) => ({
        id: `${id}-line-${index + 1}`,
        lineNumber: index + 1,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.quantity * line.unitPrice,
      })),
      createdAt: now,
      updatedAt: now,
    };
    return upsertNorthstarSalesQuote(quote);
  }

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const quoteNumber = `Q-${new Date().getFullYear()}-${generateInvoiceNumber()}`;
  const { data: quoteRow, error } = await supabase
    .from("sales_quotes")
    .insert({
      workspace_id: workspaceId,
      quote_number: quoteNumber,
      crm_lead_id: input.crmLeadId ?? null,
      client_id: input.clientId ?? null,
      company_name: input.companyName,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      title: input.title ?? "Sales quote",
      currency: input.currency ?? "GBP",
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: "draft",
      valid_until: input.validUntil ?? addDays(now.slice(0, 10), 30),
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const quoteId = String(quoteRow.id);
  const lineRows = input.lineItems.map((line, index) => ({
    quote_id: quoteId,
    line_number: index + 1,
    description: line.description,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    amount: line.quantity * line.unitPrice,
  }));
  const { error: lineError } = await supabase.from("sales_quote_line_items").insert(lineRows);
  if (lineError) throw new Error(lineError.message);

  return (await getSalesQuoteById(quoteId, scope))!;
}

export async function createSalesQuoteFromLead(
  scope: FinancialsWorkspaceScope,
  input: { leadId: string; title?: string; currency?: string },
): Promise<SalesQuote> {
  const lead =
    usesNorthstarStyleAccountingFixtures(scope.workspaceSlug)
      ? getNorthstarCrmLeads().find((row) => row.id === input.leadId) ?? null
      : await getLeadById(input.leadId, { workspaceId: scope.workspaceId });

  if (!lead) throw new Error("CRM lead not found.");

  const estimatedValue = lead.estimatedValue ?? 50_000;
  const subtotal = Math.round((estimatedValue / 1.2) * 100) / 100;
  const unitPrice = subtotal;

  return createSalesQuote(scope, {
    crmLeadId: lead.id,
    companyName: lead.companyName,
    contactName: lead.contactName,
    contactEmail: lead.email,
    title: input.title ?? `${lead.companyName} — platform proposal`,
    currency: input.currency ?? "GBP",
    lineItems: [
      {
        description: "Atlas platform licence & onboarding",
        quantity: 1,
        unitPrice,
      },
    ],
  });
}

async function issueInvoiceForQuote(
  quote: SalesQuote,
  scope: FinancialsWorkspaceScope,
): Promise<LedgerInvoice> {
  if (!quote.clientId) {
    throw new Error("Link a client before accepting this quote.");
  }

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const issueDate = new Date().toISOString().slice(0, 10);
  const dueDate = addDays(issueDate, 30);
  const invoiceNumber = generateInvoiceNumber();
  const paymentReference = `INV-${invoiceNumber}`;

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      workspace_id: workspaceId,
      invoice_number: invoiceNumber,
      client_id: quote.clientId,
      issue_date: issueDate,
      due_date: dueDate,
      currency: quote.currency,
      amount: quote.totalAmount,
      status: "issued",
      payment_reference: paymentReference,
      pdf_path: quote.pdfPath,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const journal = await postInvoiceIssueJournal({
    invoiceId: String(data.id),
    invoiceNumber,
    clientId: quote.clientId,
    amount: quote.totalAmount,
    currency: quote.currency,
    journalDate: issueDate,
    workspaceId,
  });

  const { data: updated, error: updateError } = await supabase
    .from("invoices")
    .update({ journal_entry_id: journal.id, updated_at: new Date().toISOString() })
    .eq("id", String(data.id))
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);

  return {
    id: String(updated.id),
    invoiceNumber: String(updated.invoice_number),
    clientId: String(updated.client_id),
    organisationId: updated.organisation_id ? String(updated.organisation_id) : null,
    workspaceId: String(updated.workspace_id),
    issueDate: String(updated.issue_date),
    dueDate: String(updated.due_date),
    currency: String(updated.currency),
    amount: Number(updated.amount) || 0,
    status: updated.status as LedgerInvoice["status"],
    paymentReference: String(updated.payment_reference),
    pdfPath: updated.pdf_path ? String(updated.pdf_path) : null,
    journalEntryId: journal.id,
    paymentJournalEntryId: null,
    paymentMethod: null,
    wiseMatched: false,
    wiseMatchedAt: null,
    wiseTransactionId: null,
    paidAt: null,
    createdAt: String(updated.created_at),
    updatedAt: String(updated.updated_at),
  };
}

export async function acceptSalesQuote(
  id: string,
  scope: FinancialsWorkspaceScope,
): Promise<{ quote: SalesQuote; invoice: LedgerInvoice | null }> {
  const quote = await getSalesQuoteById(id, scope);
  if (!quote) throw new Error("Quote not found.");
  if (quote.status === "accepted" && quote.invoiceId) {
    return { quote, invoice: null };
  }
  if (quote.status === "declined" || quote.status === "expired") {
    throw new Error(`Quote is ${quote.status} and cannot be accepted.`);
  }

  if (usesNorthstarStyleAccountingFixtures(scope.workspaceSlug)) {
    const invoiceId = `nst-inv-quote-${quote.id}`;
    const paymentReference = `INV-${generateInvoiceNumber()}`;
    const accepted: SalesQuote = {
      ...quote,
      status: "accepted",
      invoiceId,
      clientId: quote.clientId ?? "nst-cli-001",
      paymentReference,
      updatedAt: new Date().toISOString(),
    };
    upsertNorthstarSalesQuote(accepted);
    return {
      quote: accepted,
      invoice: {
        id: invoiceId,
        invoiceNumber: `NST-2026-${generateInvoiceNumber()}`,
        clientId: quote.clientId ?? "nst-cli-001",
        clientName: quote.companyName,
        organisationId: null,
        workspaceId: quote.workspaceId,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: addDays(new Date().toISOString().slice(0, 10), 30),
        currency: quote.currency,
        amount: quote.totalAmount,
        status: "issued",
        paymentReference,
        pdfPath: null,
        journalEntryId: null,
        paymentJournalEntryId: null,
        paymentMethod: null,
        wiseMatched: false,
        wiseMatchedAt: null,
        wiseTransactionId: null,
        paidAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const invoice = await issueInvoiceForQuote(quote, scope);
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("sales_quotes")
    .update({
      status: "accepted",
      invoice_id: invoice.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  return { quote: (await getSalesQuoteById(id, scope))!, invoice };
}

export function renderSalesQuotePdf(quote: SalesQuote) {
  return buildSalesQuotePdf(quote);
}

export async function markSalesQuoteSent(id: string, scope: FinancialsWorkspaceScope) {
  if (usesNorthstarStyleAccountingFixtures(scope.workspaceSlug)) {
    const quote = getNorthstarSalesQuoteById(id);
    if (!quote) throw new Error("Quote not found.");
    return upsertNorthstarSalesQuote({ ...quote, status: "sent", updatedAt: new Date().toISOString() });
  }

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("sales_quotes")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  return (await getSalesQuoteById(id, scope))!;
}
