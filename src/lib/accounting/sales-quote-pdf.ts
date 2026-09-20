import { jsPDF } from "jspdf";

import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";

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

export function buildSalesQuotePdf(quote: SalesQuote, seller?: SalesQuoteSellerProfile): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(seller?.companyName?.trim() || "Sales quote", MARGIN, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  if (seller?.address) {
    doc.text(seller.address, MARGIN, y);
    y += 4;
  }
  const sellerLocation = [seller?.city, seller?.region, seller?.country].filter(Boolean).join(", ");
  if (sellerLocation) {
    doc.text(sellerLocation, MARGIN, y);
    y += 4;
  }
  if (seller?.email) {
    doc.text(seller.email, MARGIN, y);
    y += 4;
  }
  if (seller?.phone) {
    doc.text(seller.phone, MARGIN, y);
    y += 4;
  }
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Sales Quote", PAGE_W - MARGIN - 40, MARGIN);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quote ${quote.quoteNumber}`, PAGE_W - MARGIN - 40, MARGIN + 7);
  if (quote.issueDate) doc.text(`Date ${quote.issueDate}`, PAGE_W - MARGIN - 40, MARGIN + 12);
  if (quote.validUntil) doc.text(`Valid until ${quote.validUntil}`, PAGE_W - MARGIN - 40, MARGIN + 17);
  if (quote.reference) doc.text(`Ref ${quote.reference}`, PAGE_W - MARGIN - 40, MARGIN + 22);

  y = Math.max(y, MARGIN + 26);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Bill to", MARGIN, y);
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

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Description", MARGIN, y);
  doc.text("Qty", MARGIN + 78, y);
  doc.text("Unit", MARGIN + 92, y);
  doc.text("Rate", MARGIN + 108, y);
  doc.text("Disc", MARGIN + 128, y);
  doc.text("Tax", MARGIN + 142, y);
  doc.text("Total", PAGE_W - MARGIN - 18, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  for (const line of quote.lineItems) {
    const wrapped = doc.splitTextToSize(line.description, 72);
    doc.text(wrapped, MARGIN, y);
    doc.text(String(line.quantity), MARGIN + 78, y);
    doc.text(line.unit ?? "—", MARGIN + 92, y);
    doc.text(money(line.unitPrice, quote.currency), MARGIN + 108, y);
    doc.text(money(line.discountAmount ?? 0, quote.currency), MARGIN + 128, y);
    doc.text(money(line.taxAmount ?? 0, quote.currency), MARGIN + 142, y);
    doc.text(money(line.amount, quote.currency), PAGE_W - MARGIN - 18, y);
    y += Math.max(6, wrapped.length * 4.5);
    if (y > 250) {
      doc.addPage();
      y = MARGIN;
    }
  }

  y += 6;
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: ${money(quote.subtotal, quote.currency)}`, PAGE_W - MARGIN - 70, y);
  y += 5;
  if (quote.discountAmount > 0) {
    doc.text(`Discount: ${money(quote.discountAmount, quote.currency)}`, PAGE_W - MARGIN - 70, y);
    y += 5;
  }
  doc.text(`Tax: ${money(quote.taxAmount, quote.currency)}`, PAGE_W - MARGIN - 70, y);
  y += 5;
  doc.text(`Total: ${money(quote.totalAmount, quote.currency)}`, PAGE_W - MARGIN - 70, y);

  if (quote.paymentTerms?.trim()) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Payment terms", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(quote.paymentTerms.trim(), PAGE_W - MARGIN * 2), MARGIN, y);
    y += 8;
  }

  if (quote.notes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const notes = doc.splitTextToSize(quote.notes.trim(), PAGE_W - MARGIN * 2);
    doc.text(notes, MARGIN, y);
    y += notes.length * 4 + 4;
  }

  if (quote.termsAndConditions?.trim()) {
    if (y > 230) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Terms & conditions", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(quote.termsAndConditions.trim(), PAGE_W - MARGIN * 2), MARGIN, y);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
