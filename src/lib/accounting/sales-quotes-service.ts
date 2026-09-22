import { postInvoiceIssueJournal } from "@/lib/accounting/posting-rules";
import {
  resolveSalesQuoteFinancials,
  type SalesQuoteLineInput,
} from "@/lib/accounting/sales-quote-calculations";
import {
  appendTermsPdfToQuote,
  buildSalesQuotePdfDocument,
} from "@/lib/accounting/sales-quote-pdf-build";
import {
  DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  normalizeBankDetails,
  normalizeLineColumnVisibility,
  type SalesQuoteBankDetails,
  type SalesQuoteLineColumnVisibility,
  type SalesQuotePricingStyle,
} from "@/lib/accounting/sales-quote-display";
import { downloadSalesQuoteTermsPdf } from "@/lib/accounting/sales-quote-terms-storage";
import type {
  LedgerInvoice,
  SalesQuote,
  SalesQuoteLineItem,
  SalesQuoteSellerProfile,
  SalesQuoteStatus,
} from "@/lib/accounting/types";
import { getNorthstarCrmLeads } from "@/lib/demo/module-fixtures";
import {
  getNorthstarSalesQuoteById,
  getNorthstarSalesQuotes,
  nextNorthstarQuoteNumber,
  upsertNorthstarSalesQuote,
} from "@/lib/demo/northstar-sales-quotes-fixtures";
import {
  getSaecSalesQuoteById,
  getSaecSalesQuotes,
  upsertSaecSalesQuote,
} from "@/lib/saec/demo/saec-sales-quotes-fixtures";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";
import { resolveAccountingFixtureSource } from "@/lib/workspace-accounting-fixtures";
import { resolveFinancialsWorkspaceId, type FinancialsWorkspaceScope } from "@/lib/financials-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { generateInvoiceNumber } from "@/lib/subscription-invoice-pdf";
import { getLeadById } from "@/lib/crm-leads-service";
import type { CompanyDetails } from "@/lib/company-details-data";
import { listCompanyDetails } from "@/lib/company-details-service";

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
    status: row.status as SalesQuoteStatus,
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

function entityLabel(row: CompanyDetails) {
  return `${row.tradingName} ${row.legalCompanyName}`.toLowerCase();
}

function pickBrandEntity(companies: CompanyDetails[]): CompanyDetails | null {
  const active = companies.filter((row) => !row.archivedAt);
  return (
    active.find((row) => /unit311|unit 311/.test(entityLabel(row))) ??
    active.find((row) => row.tradingName.trim()) ??
    null
  );
}

function pickLegalEntity(companies: CompanyDetails[]): CompanyDetails | null {
  const active = companies.filter((row) => !row.archivedAt);
  return (
    active.find((row) => /nakama/.test(entityLabel(row))) ??
    active.find((row) => /holdings/.test(entityLabel(row))) ??
    active[0] ??
    null
  );
}

function mapCompanyDetailsToSeller(
  brand: CompanyDetails | null,
  legal: CompanyDetails | null,
): SalesQuoteSellerProfile {
  const brandName =
    brand?.tradingName.trim() ||
    brand?.legalCompanyName.trim() ||
    "Unit311 Central";
  const addressSource = legal ?? brand;
  const address = addressSource
    ? addressSource.registeredOfficeAddress.trim() ||
      addressSource.principalBusinessAddress.trim() ||
      null
    : null;
  const email =
    legal?.primaryEmail.trim() ||
    brand?.primaryEmail.trim() ||
    null;
  return {
    brandName,
    legalCompanyName: legal?.legalCompanyName.trim() || null,
    tradingName: brand?.tradingName.trim() || null,
    companyNumber: legal?.companyNumber.trim() || brand?.companyNumber.trim() || null,
    vatTaxNumber: legal?.vatTaxNumber.trim() || brand?.vatTaxNumber.trim() || null,
    companyName: brandName,
    contactName: null,
    email,
    phone: legal?.primaryTelephone.trim() || brand?.primaryTelephone.trim() || null,
    address,
    city: null,
    region: null,
    country: legal?.countryOfRegistration.trim() || brand?.countryOfRegistration.trim() || null,
    website: brand?.website.trim() || legal?.website.trim() || null,
  };
}

export async function getSalesQuoteSellerProfile(
  workspaceId: string,
): Promise<SalesQuoteSellerProfile> {
  try {
    const companies = await listCompanyDetails({ workspaceId });
    const brand = pickBrandEntity(companies);
    const legal = pickLegalEntity(companies);
    if (brand || legal) return mapCompanyDetailsToSeller(brand, legal);
  } catch {
    // Fall through when Corporate Information schema is unavailable.
  }

  const supabase = requireSupabase();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .maybeSingle();

  const fallback = workspace?.name?.trim() || "Unit311 Central";
  return {
    brandName: fallback,
    legalCompanyName: null,
    tradingName: null,
    companyNumber: null,
    vatTaxNumber: null,
    companyName: fallback,
    contactName: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    region: null,
    country: null,
    website: null,
  };
}

type SalesQuoteWriteInput = {
  crmLeadId?: string | null;
  clientId?: string | null;
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  title?: string;
  currency?: string;
  issueDate?: string | null;
  validUntil?: string | null;
  reference?: string | null;
  paymentTerms?: string | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  discountAmount?: number;
  commercialTotal?: number | null;
  pricingStyle?: SalesQuotePricingStyle;
  lineColumnVisibility?: SalesQuoteLineColumnVisibility;
  bankDetails?: SalesQuoteBankDetails | null;
  termsPdfStoragePath?: string | null;
  termsPdfFilename?: string | null;
  lineItems: SalesQuoteLineInput[];
};

function validateLineDescriptions(lineItems: SalesQuoteLineInput[]) {
  if (!lineItems.length) throw new Error("At least one line item is required.");
  for (const line of lineItems) {
    if (!line.description?.trim()) throw new Error("Each line item requires a description.");
  }
}

function prepareQuoteFinancials(input: SalesQuoteWriteInput) {
  validateLineDescriptions(input.lineItems);
  return resolveSalesQuoteFinancials({
    pricingStyle: input.pricingStyle,
    lineColumnVisibility: input.lineColumnVisibility,
    commercialTotal: input.commercialTotal,
    quoteDiscountAmount: input.discountAmount ?? 0,
    lineItems: input.lineItems,
  });
}

function quoteDefaultsForFixture(quote: SalesQuote): SalesQuote {
  return {
    ...quote,
    pricingStyle: quote.pricingStyle ?? "detailed",
    lineColumnVisibility: quote.lineColumnVisibility ?? DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
    bankDetails: quote.bankDetails ?? null,
    termsPdfStoragePath: quote.termsPdfStoragePath ?? null,
    termsPdfFilename: quote.termsPdfFilename ?? null,
    lineItems: quote.lineItems.map((line) => ({
      ...line,
      detailText: line.detailText ?? null,
    })),
  };
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
  const grouped = await loadQuoteLines(ids, workspaceId);
  return (data ?? []).map((row) =>
    mapQuote(row as Record<string, unknown>, grouped.get(String(row.id)) ?? []),
  );
}

export async function getSalesQuoteById(id: string, scope: FinancialsWorkspaceScope): Promise<SalesQuote | null> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar") {
    const quote = getNorthstarSalesQuoteById(id);
    return quote ? quoteDefaultsForFixture(quote) : null;
  }
  if (fixture === "saec") {
    const quote = getSaecSalesQuoteById(id);
    return quote ? quoteDefaultsForFixture(quote) : null;
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

export async function deleteSalesQuote(id: string, scope: FinancialsWorkspaceScope): Promise<void> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar" || fixture === "saec") {
    throw new Error("Quote deletion is not available in demo fixture mode.");
  }
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("sales_quotes")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

function mapComputedLinesToQuoteItems(
  quoteId: string,
  lines: Awaited<ReturnType<typeof prepareQuoteFinancials>>["lines"],
): SalesQuoteLineItem[] {
  return lines.map((line, index) => ({
    id: `${quoteId}-line-${index + 1}`,
    lineNumber: index + 1,
    description: line.description.trim(),
    detailText: line.detailText?.trim() || null,
    quantity: line.quantity,
    unit: line.unit ?? null,
    unitPrice: line.unitPrice,
    discountAmount: line.discountAmount ?? 0,
    taxRate: line.taxRate ?? null,
    taxAmount: line.taxAmount,
    amount: line.amount,
  }));
}

function mapComputedLinesToDbRows(quoteId: string, lines: Awaited<ReturnType<typeof prepareQuoteFinancials>>["lines"]) {
  return lines.map((line, index) => ({
    quote_id: quoteId,
    line_number: index + 1,
    description: line.description.trim(),
    detail_text: line.detailText?.trim() || null,
    quantity: line.quantity,
    unit: line.unit?.trim() || null,
    unit_price: line.unitPrice,
    discount_amount: line.discountAmount ?? 0,
    tax_rate: line.taxRate ?? null,
    tax_amount: line.taxAmount,
    amount: line.amount,
  }));
}

export async function createSalesQuote(
  scope: FinancialsWorkspaceScope,
  input: SalesQuoteWriteInput,
): Promise<SalesQuote> {
  if (!input.title?.trim()) {
    throw new Error("Quote title is required.");
  }

  const totals = prepareQuoteFinancials(input);
  const subtotal = totals.subtotal;
  const taxAmount = totals.taxAmount;
  const totalAmount = totals.totalAmount;
  const visibility = normalizeLineColumnVisibility(input.lineColumnVisibility);
  const bankDetails = normalizeBankDetails(input.bankDetails);
  const now = new Date().toISOString();
  const issueDate = input.issueDate?.trim() || now.slice(0, 10);
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);

  if (fixture === "northstar" || fixture === "saec") {
    const id = `${fixture === "saec" ? "saec" : "nst"}-quote-${Date.now()}`;
    const quote: SalesQuote = {
      id,
      workspaceId: fixture === "saec" ? "saec-workspace" : "demo-workspace",
      quoteNumber:
        fixture === "saec"
          ? `Q-2026-SAEC-${String(Date.now()).slice(-4)}`
          : nextNorthstarQuoteNumber(),
      crmLeadId: input.crmLeadId ?? null,
      clientId: input.clientId ?? null,
      companyName: input.companyName,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      title: input.title.trim(),
      currency: input.currency ?? (fixture === "saec" ? SAEC_REPORTING_CURRENCY : "GBP"),
      subtotal,
      taxAmount,
      totalAmount,
      status: "draft",
      issueDate,
      validUntil: input.validUntil ?? addDays(issueDate, 30),
      reference: input.reference ?? null,
      paymentTerms: input.paymentTerms ?? null,
      termsAndConditions: input.termsAndConditions ?? null,
      discountAmount: totals.discountAmount,
      pricingStyle: totals.pricingStyle,
      lineColumnVisibility: visibility,
      bankDetails,
      termsPdfStoragePath: input.termsPdfStoragePath ?? null,
      termsPdfFilename: input.termsPdfFilename ?? null,
      pdfPath: null,
      invoiceId: null,
      stripePaymentLinkUrl: null,
      notes: input.notes ?? null,
      lineItems: mapComputedLinesToQuoteItems(id, totals.lines),
      createdAt: now,
      updatedAt: now,
    };
    return quoteDefaultsForFixture(
      fixture === "saec" ? upsertSaecSalesQuote(quote) : upsertNorthstarSalesQuote(quote),
    );
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
      title: input.title.trim(),
      currency: input.currency ?? "GBP",
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      discount_amount: totals.discountAmount,
      status: "draft",
      issue_date: issueDate,
      valid_until: input.validUntil ?? addDays(issueDate, 30),
      reference: input.reference?.trim() || null,
      payment_terms: input.paymentTerms?.trim() || null,
      terms_and_conditions: input.termsAndConditions?.trim() || null,
      notes: input.notes ?? null,
      pricing_style: totals.pricingStyle,
      line_column_visibility: visibility,
      bank_details: bankDetails,
      terms_pdf_storage_path: input.termsPdfStoragePath ?? null,
      terms_pdf_filename: input.termsPdfFilename ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const quoteId = String(quoteRow.id);
  const lineRows = mapComputedLinesToDbRows(quoteId, totals.lines);
  const { error: lineError } = await supabase.from("sales_quote_line_items").insert(lineRows);
  if (lineError) throw new Error(lineError.message);

  return (await getSalesQuoteById(quoteId, scope))!;
}

export async function updateSalesQuote(
  id: string,
  scope: FinancialsWorkspaceScope,
  input: SalesQuoteWriteInput,
): Promise<SalesQuote> {
  const existing = await getSalesQuoteById(id, scope);
  if (!existing) throw new Error("Quote not found.");
  if (existing.status === "accepted") {
    throw new Error("Accepted quotes cannot be edited.");
  }
  if (existing.status === "declined" || existing.status === "expired") {
    throw new Error(`Quote is ${existing.status} and cannot be edited.`);
  }

  if (!input.title?.trim()) {
    throw new Error("Quote title is required.");
  }

  const totals = prepareQuoteFinancials(input);
  const visibility = normalizeLineColumnVisibility(input.lineColumnVisibility);
  const bankDetails = normalizeBankDetails(input.bankDetails);
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);

  if (fixture === "northstar" || fixture === "saec") {
    const updated: SalesQuote = {
      ...existing,
      crmLeadId: input.crmLeadId ?? null,
      clientId: input.clientId ?? null,
      companyName: input.companyName,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      title: input.title.trim(),
      currency: input.currency ?? existing.currency,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      discountAmount: totals.discountAmount,
      issueDate: input.issueDate?.trim() || existing.issueDate,
      validUntil: input.validUntil ?? existing.validUntil,
      reference: input.reference ?? null,
      paymentTerms: input.paymentTerms ?? null,
      termsAndConditions: input.termsAndConditions ?? null,
      notes: input.notes ?? null,
      pricingStyle: totals.pricingStyle,
      lineColumnVisibility: visibility,
      bankDetails,
      termsPdfStoragePath: input.termsPdfStoragePath ?? existing.termsPdfStoragePath,
      termsPdfFilename: input.termsPdfFilename ?? existing.termsPdfFilename,
      lineItems: mapComputedLinesToQuoteItems(existing.id, totals.lines),
      updatedAt: new Date().toISOString(),
    };
    return quoteDefaultsForFixture(
      fixture === "saec" ? upsertSaecSalesQuote(updated) : upsertNorthstarSalesQuote(updated),
    );
  }

  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = requireSupabase();
  const issueDate = input.issueDate?.trim() || existing.issueDate || new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("sales_quotes")
    .update({
      crm_lead_id: input.crmLeadId ?? null,
      client_id: input.clientId ?? null,
      company_name: input.companyName,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      title: input.title.trim(),
      currency: input.currency ?? existing.currency,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      discount_amount: totals.discountAmount,
      issue_date: issueDate,
      valid_until: input.validUntil ?? existing.validUntil,
      reference: input.reference?.trim() || null,
      payment_terms: input.paymentTerms?.trim() || null,
      terms_and_conditions: input.termsAndConditions?.trim() || null,
      notes: input.notes ?? null,
      pricing_style: totals.pricingStyle,
      line_column_visibility: visibility,
      bank_details: bankDetails,
      terms_pdf_storage_path: input.termsPdfStoragePath ?? existing.termsPdfStoragePath,
      terms_pdf_filename: input.termsPdfFilename ?? existing.termsPdfFilename,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);

  const { error: deleteLinesError } = await supabase
    .from("sales_quote_line_items")
    .delete()
    .eq("quote_id", id);
  if (deleteLinesError) throw new Error(deleteLinesError.message);

  const lineRows = mapComputedLinesToDbRows(id, totals.lines);
  const { error: lineError } = await supabase.from("sales_quote_line_items").insert(lineRows);
  if (lineError) throw new Error(lineError.message);

  return (await getSalesQuoteById(id, scope))!;
}

export async function createSalesQuoteFromLead(
  scope: FinancialsWorkspaceScope,
  input: { leadId: string; clientId?: string | null; title?: string; currency?: string },
): Promise<SalesQuote> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  const lead =
    fixture === "northstar"
      ? getNorthstarCrmLeads().find((row) => row.id === input.leadId) ?? null
      : await getLeadById(input.leadId, { workspaceId: scope.workspaceId });

  if (!lead) throw new Error("CRM lead not found.");

  const estimatedValue = lead.estimatedValue ?? 50_000;
  const subtotal = Math.round((estimatedValue / 1.2) * 100) / 100;
  const unitPrice = subtotal;

  return createSalesQuote(scope, {
    crmLeadId: lead.id,
    clientId: input.clientId ?? null,
    companyName: lead.companyName,
    contactName: lead.contactName,
    contactEmail: lead.email,
    title: input.title ?? `${lead.companyName} — platform proposal`,
    currency: input.currency ?? (fixture === "saec" ? SAEC_REPORTING_CURRENCY : "GBP"),
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

  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar" || fixture === "saec") {
    const defaultClientId = fixture === "saec" ? "saec-cli-hyprop" : "nst-cli-001";
    const invoiceId = `${fixture === "saec" ? "saec" : "nst"}-inv-quote-${quote.id}`;
    const paymentReference = `INV-${generateInvoiceNumber()}`;
    const accepted: SalesQuote = {
      ...quote,
      status: "accepted",
      invoiceId,
      clientId: quote.clientId ?? defaultClientId,
      paymentReference,
      updatedAt: new Date().toISOString(),
    };
    if (fixture === "saec") upsertSaecSalesQuote(accepted);
    else upsertNorthstarSalesQuote(accepted);
    return {
      quote: accepted,
      invoice: {
        id: invoiceId,
        invoiceNumber:
          fixture === "saec"
            ? `SAEC-2026-${generateInvoiceNumber()}`
            : `NST-2026-${generateInvoiceNumber()}`,
        clientId: quote.clientId ?? defaultClientId,
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

export async function renderSalesQuotePdf(quote: SalesQuote, seller?: SalesQuoteSellerProfile) {
  const main = await buildSalesQuotePdfDocument(quote, seller);
  if (!quote.termsPdfStoragePath) return main;
  const terms = await downloadSalesQuoteTermsPdf(quote.termsPdfStoragePath);
  if (!terms) return main;
  return appendTermsPdfToQuote(main, terms);
}

export async function markSalesQuoteSent(id: string, scope: FinancialsWorkspaceScope) {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar" || fixture === "saec") {
    const quote =
      fixture === "saec" ? getSaecSalesQuoteById(id) : getNorthstarSalesQuoteById(id);
    if (!quote) throw new Error("Quote not found.");
    const updated = { ...quote, status: "sent" as const, updatedAt: new Date().toISOString() };
    return fixture === "saec" ? upsertSaecSalesQuote(updated) : upsertNorthstarSalesQuote(updated);
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
