import type { SalesQuoteLineInput } from "@/lib/accounting/sales-quote-calculations";
import {
  normalizeBankDetails,
  normalizeLineColumnVisibility,
  type SalesQuoteBankDetails,
  type SalesQuoteLineColumnVisibility,
  type SalesQuotePricingStyle,
} from "@/lib/accounting/sales-quote-display";

export type SalesQuoteApiBody = {
  crmLeadId?: string | null;
  clientId?: string | null;
  companyName?: string;
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
  lineItems?: Array<{
    description: string;
    detailText?: string | null;
    quantity: number;
    unitPrice: number;
    unit?: string | null;
    discountAmount?: number;
    taxRate?: number | null;
  }>;
};

export function mapSalesQuoteApiBody(body: SalesQuoteApiBody) {
  const lineItems: SalesQuoteLineInput[] = (body.lineItems ?? []).map((line) => ({
    description: line.description,
    detailText: line.detailText ?? null,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    unit: line.unit ?? null,
    discountAmount: line.discountAmount ?? 0,
    taxRate: line.taxRate ?? null,
  }));

  return {
    crmLeadId: body.crmLeadId ?? null,
    clientId: body.clientId ?? null,
    companyName: body.companyName?.trim() ?? "",
    contactName: body.contactName ?? null,
    contactEmail: body.contactEmail ?? null,
    title: body.title,
    currency: body.currency,
    issueDate: body.issueDate ?? null,
    validUntil: body.validUntil ?? null,
    reference: body.reference ?? null,
    paymentTerms: body.paymentTerms ?? null,
    termsAndConditions: body.termsAndConditions ?? null,
    notes: body.notes ?? null,
    discountAmount: body.discountAmount ?? 0,
    commercialTotal: body.commercialTotal ?? null,
    pricingStyle: body.pricingStyle,
    lineColumnVisibility: normalizeLineColumnVisibility(body.lineColumnVisibility),
    bankDetails: normalizeBankDetails(body.bankDetails),
    termsPdfStoragePath: body.termsPdfStoragePath ?? null,
    termsPdfFilename: body.termsPdfFilename ?? null,
    lineItems,
  };
}
