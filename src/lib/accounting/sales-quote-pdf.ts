import { jsPDF } from "jspdf";

import type { SalesQuote } from "@/lib/accounting/types";

const MARGIN = 18;
const PAGE_W = 210;

function money(amount: number, currency: string) {
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function buildSalesQuotePdf(quote: SalesQuote): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Sales Quote", MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Quote ${quote.quoteNumber}`, MARGIN, y);
  y += 10;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Prepared for", MARGIN, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(quote.companyName, MARGIN, y);
  y += 5;
  if (quote.contactName) {
    doc.text(quote.contactName, MARGIN, y);
    y += 5;
  }
  if (quote.contactEmail) {
    doc.text(quote.contactEmail, MARGIN, y);
    y += 5;
  }
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.text(quote.title, MARGIN, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Description", MARGIN, y);
  doc.text("Qty", MARGIN + 100, y);
  doc.text("Unit", MARGIN + 118, y);
  doc.text("Amount", PAGE_W - MARGIN - 24, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  for (const line of quote.lineItems) {
    const wrapped = doc.splitTextToSize(line.description, 92);
    doc.text(wrapped, MARGIN, y);
    doc.text(String(line.quantity), MARGIN + 100, y);
    doc.text(money(line.unitPrice, quote.currency), MARGIN + 118, y);
    doc.text(money(line.amount, quote.currency), PAGE_W - MARGIN - 24, y);
    y += Math.max(6, wrapped.length * 5);
    if (y > 260) {
      doc.addPage();
      y = MARGIN;
    }
  }

  y += 6;
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: ${money(quote.subtotal, quote.currency)}`, PAGE_W - MARGIN - 70, y);
  y += 6;
  doc.text(`Tax: ${money(quote.taxAmount, quote.currency)}`, PAGE_W - MARGIN - 70, y);
  y += 6;
  doc.text(`Total: ${money(quote.totalAmount, quote.currency)}`, PAGE_W - MARGIN - 70, y);

  if (quote.validUntil) {
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Valid until ${quote.validUntil}`, MARGIN, y);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
