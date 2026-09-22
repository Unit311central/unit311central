import "server-only";

import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";

import {
  isScopeStyleQuote,
  normalizeLineColumnVisibility,
  normalizeBankDetails,
  type SalesQuoteBankDetails,
} from "@/lib/accounting/sales-quote-display";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";
import { loadWorkspaceDocumentLogoRasterForPdf } from "@/lib/workspace-document-logo-service";

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const FOOTER_Y = PAGE_H - 10;
const CONTENT_BOTTOM = PAGE_H - 16;

function money(amount: number, currency: string) {
  const code = currency.toUpperCase();
  try {
    const locale = code === "USD" ? "en-US" : code === "AUD" ? "en-AU" : "en-GB";
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

async function embedWorkspaceDocumentLogo(
  doc: jsPDF,
  quote: SalesQuote,
  x: number,
  y: number,
  widthMm = 52,
): Promise<number> {
  const raster = await loadWorkspaceDocumentLogoRasterForPdf({
    workspaceId: quote.workspaceId,
    workspaceSlug: null,
  });
  if (!raster) return y;
  const aspect = raster.widthPx / Math.max(raster.heightPx, 1);
  const heightMm = widthMm / aspect;
  const base64 = Buffer.from(raster.bytes).toString("base64");
  const dataUrl = `data:image/${raster.format.toLowerCase()};base64,${base64}`;
  doc.addImage(dataUrl, raster.format, x, y, widthMm, heightMm);
  return y + heightMm + 2;
}

function footerText(seller?: SalesQuoteSellerProfile) {
  const email = seller?.email?.trim() || "paul@unit311central.com";
  return `Unit311 Central  |  ${email}`;
}

function drawFooter(doc: jsPDF, seller?: SalesQuoteSellerProfile) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(footerText(seller), MARGIN, FOOTER_Y);
  }
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= CONTENT_BOTTOM) return y;
  doc.addPage();
  return MARGIN;
}

function drawLinesTableHeader(
  doc: jsPDF,
  y: number,
  visibility: ReturnType<typeof normalizeLineColumnVisibility>,
  scopeStyle: boolean,
): number {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("Description", MARGIN, y);
  let x = MARGIN + 92;
  if (!scopeStyle && visibility.showQuantity) {
    doc.text("Qty", x, y);
    x += 14;
  }
  if (!scopeStyle && visibility.showUnit) {
    doc.text("Unit", x, y);
    x += 16;
  }
  if (!scopeStyle && visibility.showRate) {
    doc.text("Rate", x, y);
    x += 22;
  }
  if (!scopeStyle && visibility.showDiscount) {
    doc.text("Disc", x, y);
    x += 16;
  }
  if (!scopeStyle && visibility.showTax) {
    doc.text("Tax", x, y);
    x += 14;
  }
  if (!scopeStyle) {
    doc.text("Total", PAGE_W - MARGIN - 18, y);
  }
  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  return y + 5;
}

function drawBankDetails(doc: jsPDF, y: number, bank: SalesQuoteBankDetails): number {
  y = ensureSpace(doc, y, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Bank details", MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const rows: string[] = [];
  if (bank.accountName) rows.push(`Account name: ${bank.accountName}`);
  if (bank.bankName) rows.push(`Bank: ${bank.bankName}`);
  if (bank.accountNumber) rows.push(`Account number: ${bank.accountNumber}`);
  if (bank.sortCode) rows.push(`Sort code: ${bank.sortCode}`);
  if (bank.iban) rows.push(`IBAN: ${bank.iban}`);
  if (bank.swiftBic) rows.push(`SWIFT/BIC: ${bank.swiftBic}`);
  if (bank.other) rows.push(bank.other);
  for (const row of rows) {
    y = ensureSpace(doc, y, 5);
    doc.text(doc.splitTextToSize(row, PAGE_W - MARGIN * 2), MARGIN, y);
    y += 4;
  }
  return y + 4;
}

export async function buildSalesQuotePdfDocument(
  quote: SalesQuote,
  seller?: SalesQuoteSellerProfile,
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const visibility = normalizeLineColumnVisibility(quote.lineColumnVisibility);
  const scopeStyle = isScopeStyleQuote(quote.pricingStyle, visibility);
  let y = MARGIN;
  const afterLogo = await embedWorkspaceDocumentLogo(doc, quote, MARGIN, y - 2, 52);
  y = afterLogo > MARGIN ? afterLogo : MARGIN + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(seller?.brandName?.trim() || seller?.companyName?.trim() || "Unit311 Central", MARGIN, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  if (seller?.legalCompanyName?.trim()) {
    doc.text(seller.legalCompanyName.trim(), MARGIN, y);
    y += 4;
  }
  if (seller?.address?.trim()) {
    for (const line of doc.splitTextToSize(seller.address.trim(), 88)) {
      doc.text(line, MARGIN, y);
      y += 3.8;
    }
  }
  if (seller?.companyNumber?.trim()) {
    doc.text(`Company No: ${seller.companyNumber.trim()}`, MARGIN, y);
    y += 4;
  }
  if (seller?.country?.trim()) {
    doc.text(seller.country.trim(), MARGIN, y);
    y += 4;
  }
  if (seller?.email?.trim()) {
    doc.text(seller.email.trim(), MARGIN, y);
    y += 4;
  }

  const headerRightX = PAGE_W - MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("SALES QUOTE", headerRightX, MARGIN + 2, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  let ry = MARGIN + 9;
  doc.text(`Quote ${quote.quoteNumber}`, headerRightX, ry, { align: "right" });
  ry += 4.5;
  if (quote.issueDate) {
    doc.text(`Date ${quote.issueDate}`, headerRightX, ry, { align: "right" });
    ry += 4.5;
  }
  if (quote.validUntil) {
    doc.text(`Valid until ${quote.validUntil}`, headerRightX, ry, { align: "right" });
    ry += 4.5;
  }
  doc.text(`Currency ${quote.currency}`, headerRightX, ry, { align: "right" });

  y = Math.max(y, MARGIN + 28) + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("BILL TO", MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(quote.companyName, MARGIN, y);
  y += 4.5;
  if (quote.contactName) {
    doc.text(quote.contactName, MARGIN, y);
    y += 4.5;
  }
  if (quote.contactEmail) {
    doc.text(quote.contactEmail, MARGIN, y);
    y += 4.5;
  }
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(quote.title, MARGIN, y);
  y += 8;

  y = drawLinesTableHeader(doc, y, visibility, scopeStyle);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  for (const line of quote.lineItems) {
    const descWidth = scopeStyle ? PAGE_W - MARGIN * 2 : 86;
    const wrapped = doc.splitTextToSize(line.description, descWidth);
    const blockHeight = wrapped.length * 4.2 + (line.detailText?.trim() ? 8 : 0) + 4;
    y = ensureSpace(doc, y, blockHeight);
    doc.setFont("helvetica", "bold");
    doc.text(wrapped, MARGIN, y);
    let lineY = y + wrapped.length * 4.2;
    if (line.detailText?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const detail = doc.splitTextToSize(line.detailText.trim(), descWidth);
      doc.text(detail, MARGIN, lineY);
      lineY += detail.length * 3.6;
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
    }
    if (!scopeStyle) {
      doc.setFont("helvetica", "normal");
      let x = MARGIN + 92;
      if (visibility.showQuantity) {
        doc.text(String(line.quantity), x, y);
        x += 14;
      }
      if (visibility.showUnit) {
        doc.text(line.unit ?? "—", x, y);
        x += 16;
      }
      if (visibility.showRate) {
        doc.text(money(line.unitPrice, quote.currency), x, y);
        x += 22;
      }
      if (visibility.showDiscount) {
        doc.text(money(line.discountAmount ?? 0, quote.currency), x, y);
        x += 16;
      }
      if (visibility.showTax) {
        doc.text(money(line.taxAmount ?? 0, quote.currency), x, y);
      }
      doc.text(money(line.amount, quote.currency), PAGE_W - MARGIN - 18, y);
    }
    y = lineY + 5;
  }

  y = ensureSpace(doc, y, 18);
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  if (scopeStyle) {
    doc.text(`Total: ${money(quote.totalAmount, quote.currency)}`, PAGE_W - MARGIN, y, { align: "right" });
    y += 6;
  } else {
    doc.text(`Subtotal: ${money(quote.subtotal, quote.currency)}`, PAGE_W - MARGIN, y, { align: "right" });
    y += 5;
    if (quote.discountAmount > 0) {
      doc.text(`Discount: ${money(quote.discountAmount, quote.currency)}`, PAGE_W - MARGIN, y, { align: "right" });
      y += 5;
    }
    doc.text(`Tax: ${money(quote.taxAmount, quote.currency)}`, PAGE_W - MARGIN, y, { align: "right" });
    y += 5;
    doc.text(`Total: ${money(quote.totalAmount, quote.currency)}`, PAGE_W - MARGIN, y, { align: "right" });
    y += 6;
  }

  if (quote.paymentTerms?.trim()) {
    y = ensureSpace(doc, y, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Payment terms", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const terms = doc.splitTextToSize(quote.paymentTerms.trim(), PAGE_W - MARGIN * 2);
    doc.text(terms, MARGIN, y);
    y += terms.length * 3.8 + 4;
  }

  if (quote.notes?.trim()) {
    y = ensureSpace(doc, y, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notes", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const notes = doc.splitTextToSize(quote.notes.trim(), PAGE_W - MARGIN * 2);
    doc.text(notes, MARGIN, y);
    y += notes.length * 3.8 + 4;
  }

  if (quote.termsAndConditions?.trim()) {
    y = ensureSpace(doc, y, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Terms & conditions", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const tc = doc.splitTextToSize(quote.termsAndConditions.trim(), PAGE_W - MARGIN * 2);
    doc.text(tc, MARGIN, y);
    y += tc.length * 3.8 + 4;
  }

  const bank = normalizeBankDetails(quote.bankDetails);
  if (bank) {
    y = drawBankDetails(doc, y, bank);
  }

  drawFooter(doc, seller);
  return new Uint8Array(doc.output("arraybuffer"));
}

export async function appendTermsPdfToQuote(mainPdf: Uint8Array, termsPdf: Uint8Array): Promise<Uint8Array> {
  const main = await PDFDocument.load(mainPdf);
  const terms = await PDFDocument.load(termsPdf);
  const pages = await main.copyPages(terms, terms.getPageIndices());
  for (const page of pages) main.addPage(page);
  return new Uint8Array(await main.save());
}
