/**
 * Northstar demo — sales quote fixtures for Track C money workflows.
 */

import type { SalesQuote } from "@/lib/accounting/types";

const WS = "demo-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

const SEED_QUOTES: SalesQuote[] = [
  {
    id: "nst-quote-001",
    workspaceId: WS,
    quoteNumber: "Q-2026-0142",
    crmLeadId: "nst-lead-sheffield",
    clientId: null,
    companyName: "Sheffield Precision Engineering",
    contactName: "James Whitfield",
    contactEmail: "j.whitfield@sheffieldprecision.demo",
    title: "Atlas edge monitoring — annual platform licence",
    currency: "GBP",
    subtotal: 84_000,
    taxAmount: 16_800,
    totalAmount: 100_800,
    status: "sent",
    validUntil: "2026-09-30",
    pdfPath: null,
    invoiceId: null,
    stripePaymentLinkUrl: null,
    notes: "Includes onboarding workshop and 12-month support.",
    lineItems: [
      {
        id: "nst-quote-001-line-1",
        lineNumber: 1,
        description: "Atlas platform licence (250 sensors)",
        quantity: 1,
        unitPrice: 72_000,
        amount: 72_000,
      },
      {
        id: "nst-quote-001-line-2",
        lineNumber: 2,
        description: "Implementation & onboarding",
        quantity: 1,
        unitPrice: 12_000,
        amount: 12_000,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-quote-002",
    workspaceId: WS,
    quoteNumber: "Q-2026-0143",
    crmLeadId: "nst-lead-bristol",
    clientId: null,
    companyName: "Bristol Composites Ltd",
    contactName: "Elena Hart",
    contactEmail: "e.hart@bristolcomposites.demo",
    title: "Pilot deployment — 60-day proof of value",
    currency: "GBP",
    subtotal: 18_500,
    taxAmount: 3_700,
    totalAmount: 22_200,
    status: "draft",
    validUntil: "2026-08-31",
    pdfPath: null,
    invoiceId: null,
    stripePaymentLinkUrl: null,
    notes: null,
    lineItems: [
      {
        id: "nst-quote-002-line-1",
        lineNumber: 1,
        description: "Pilot edge kit (12 sensors + gateway)",
        quantity: 1,
        unitPrice: 14_000,
        amount: 14_000,
      },
      {
        id: "nst-quote-002-line-2",
        lineNumber: 2,
        description: "Professional services — install & training",
        quantity: 1,
        unitPrice: 4_500,
        amount: 4_500,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

let quotes = [...SEED_QUOTES];

export function getNorthstarSalesQuotes(): SalesQuote[] {
  return quotes.map((quote) => ({
    ...quote,
    lineItems: quote.lineItems.map((line) => ({ ...line })),
  }));
}

export function getNorthstarSalesQuoteById(id: string): SalesQuote | null {
  return getNorthstarSalesQuotes().find((quote) => quote.id === id) ?? null;
}

export function upsertNorthstarSalesQuote(quote: SalesQuote) {
  const index = quotes.findIndex((row) => row.id === quote.id);
  if (index >= 0) quotes[index] = quote;
  else quotes.push(quote);
  return quote;
}

export function nextNorthstarQuoteNumber(): string {
  const year = new Date().getFullYear();
  const max = quotes.reduce((acc, quote) => {
    const match = quote.quoteNumber.match(/Q-\d{4}-(\d+)/);
    return Math.max(acc, match ? Number(match[1]) : 0);
  }, 143);
  return `Q-${year}-${String(max + 1).padStart(4, "0")}`;
}
