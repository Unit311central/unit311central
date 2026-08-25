import type { SalesQuote } from "@/lib/accounting/types";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

const WS = "saec-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

const SEED_QUOTES: SalesQuote[] = [
  {
    id: "saec-quote-001",
    workspaceId: WS,
    quoteNumber: "Q-2026-SAEC-0088",
    crmLeadId: "b1000001-0001-4001-8001-000000000001",
    clientId: null,
    companyName: "Hyprop Investments",
    contactName: "Annelize Fourie",
    contactEmail: "annelize.fourie@hyprop.demo",
    title: "Centurion Mall KLK installation",
    currency: SAEC_REPORTING_CURRENCY,
    subtotal: 7_200_000,
    taxAmount: 1_080_000,
    totalAmount: 8_280_000,
    status: "sent",
    validUntil: "2026-09-30",
    pdfPath: null,
    invoiceId: null,
    stripePaymentLinkUrl: null,
    notes: "Includes commissioning and 12-month maintenance onboarding.",
    lineItems: [
      {
        id: "saec-quote-001-line-1",
        lineNumber: 1,
        description: "KLK passenger lift package",
        quantity: 1,
        unitPrice: 6_400_000,
        amount: 6_400_000,
      },
      {
        id: "saec-quote-001-line-2",
        lineNumber: 2,
        description: "Installation & commissioning",
        quantity: 1,
        unitPrice: 800_000,
        amount: 800_000,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "saec-quote-002",
    workspaceId: WS,
    quoteNumber: "Q-2026-SAEC-0089",
    crmLeadId: "b1000001-0001-4001-8001-000000000002",
    clientId: null,
    companyName: "Growthpoint Properties",
    contactName: "Thabo Mokoena",
    contactEmail: "thabo.mokoena@growthpoint.demo",
    title: "Ponte City modernisation phase 1",
    currency: SAEC_REPORTING_CURRENCY,
    subtotal: 5_800_000,
    taxAmount: 870_000,
    totalAmount: 6_670_000,
    status: "draft",
    validUntil: "2026-09-15",
    pdfPath: null,
    invoiceId: null,
    stripePaymentLinkUrl: null,
    notes: null,
    lineItems: [
      {
        id: "saec-quote-002-line-1",
        lineNumber: 1,
        description: "Machine room upgrade scope",
        quantity: 1,
        unitPrice: 5_800_000,
        amount: 5_800_000,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "saec-quote-003",
    workspaceId: WS,
    quoteNumber: "Q-2026-SAEC-0076",
    crmLeadId: "b1000001-0001-4001-8001-000000000007",
    clientId: null,
    companyName: "Killarney Mall",
    contactName: "Elaine Fourie",
    contactEmail: "e.fourie@killarneymall.demo",
    title: "Escalator engineering package — accepted",
    currency: SAEC_REPORTING_CURRENCY,
    subtotal: 4_200_000,
    taxAmount: 630_000,
    totalAmount: 4_830_000,
    status: "accepted",
    validUntil: "2026-07-31",
    pdfPath: null,
    invoiceId: null,
    stripePaymentLinkUrl: null,
    notes: "Accepted — commissioning in progress.",
    lineItems: [
      {
        id: "saec-quote-003-line-1",
        lineNumber: 1,
        description: "Escalator modernisation package",
        quantity: 1,
        unitPrice: 4_200_000,
        amount: 4_200_000,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function getSaecSalesQuotes(): SalesQuote[] {
  return SEED_QUOTES.map((row) => ({ ...row, lineItems: row.lineItems.map((line) => ({ ...line })) }));
}

export function getSaecSalesQuoteById(id: string): SalesQuote | null {
  const quote = SEED_QUOTES.find((row) => row.id === id);
  if (!quote) return null;
  return { ...quote, lineItems: quote.lineItems.map((line) => ({ ...line })) };
}

export function upsertSaecSalesQuote(quote: SalesQuote): SalesQuote {
  const index = SEED_QUOTES.findIndex((row) => row.id === quote.id);
  if (index >= 0) SEED_QUOTES[index] = quote;
  else SEED_QUOTES.push(quote);
  return quote;
}
