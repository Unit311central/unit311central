import "server-only";

import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";

import {
  isScopeStyleQuote,
  normalizeLineColumnVisibility,
  normalizeBankDetails,
  type SalesQuoteBankDetails,
} from "@/lib/accounting/sales-quote-display";
import { formatSalesQuoteDisplayDate } from "@/lib/accounting/sales-quote-pdf-format";
import { formatSellerPdfCompanyLines } from "@/lib/accounting/sales-quote-pdf-seller-lines";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";
import { isPlatformDefaultDocumentLogoSlug } from "@/lib/workspace-document-logo-data";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const RIGHT_EDGE = PAGE_W - MARGIN;
const FOOTER_Y = PAGE_H - 11;
const CONTENT_BOTTOM = PAGE_H - 16;

const LOGO_WIDTH_MM = 40;
const SECTION_GAP = 4;

const COLOR = {
  primary: [30, 64, 175] as const,
  text: [30, 41, 59] as const,
  charcoal: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  rule: [226, 232, 240] as const,
  panelFill: [248, 250, 252] as const,
  tableHead: [241, 245, 249] as const,
};

export type BuildSalesQuotePdfOptions = {
  workspaceSlug?: string | null;
};

function money(amount: number, currency: string) {
  const code = currency.toUpperCase();
  try {
    const locale = code === "USD" ? "en-US" : code === "AUD" ? "en-AU" : "en-GB";
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

function moneyWithCurrencyCode(amount: number, currency: string) {
  const code = currency.toUpperCase();
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${code} ${formatted}`;
}

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function setStroke(doc: jsPDF, rgb: readonly [number, number, number], width = 0.15) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(width);
}

function hRule(doc: jsPDF, y: number) {
  setStroke(doc, COLOR.rule);
  doc.line(MARGIN, y, RIGHT_EDGE, y);
}

async function resolveLogoRaster(
  quote: SalesQuote,
  workspaceSlug: string | null | undefined,
) {
  const logo = await import("@/lib/workspace-document-logo-pdf-raster");
  const raster = await logo.loadWorkspaceDocumentLogoRasterForPdf({
    workspaceId: quote.workspaceId,
    workspaceSlug: workspaceSlug ?? null,
  });
  if (raster) return raster;
  if (isPlatformDefaultDocumentLogoSlug(workspaceSlug)) {
    return logo.loadDefaultUnit311DocumentLogoRasterForPdf();
  }
  return null;
}

async function embedLogo(
  doc: jsPDF,
  quote: SalesQuote,
  workspaceSlug: string | null | undefined,
  x: number,
  y: number,
): Promise<number> {
  const raster = await resolveLogoRaster(quote, workspaceSlug);
  if (!raster?.bytes?.length) return y;
  const aspect = raster.widthPx / Math.max(raster.heightPx, 1);
  const heightMm = LOGO_WIDTH_MM / aspect;
  const format = raster.format === "JPEG" ? "JPEG" : "PNG";
  const base64 = Buffer.from(raster.bytes).toString("base64");
  const mime = format === "JPEG" ? "jpeg" : "png";
  doc.addImage(`data:image/${mime};base64,${base64}`, format, x, y, LOGO_WIDTH_MM, heightMm);
  return y + heightMm + 2;
}

function drawSellerBlock(doc: jsPDF, seller: SalesQuoteSellerProfile | undefined, y: number): number {
  const lineGap = 3.5;
  for (const line of formatSellerPdfCompanyLines(seller)) {
    const isBrand = line === (seller?.brandName?.trim() || seller?.companyName?.trim());
    doc.setFont("helvetica", isBrand ? "bold" : "normal");
    doc.setFontSize(isBrand ? 8.5 : 8);
    setText(doc, isBrand ? COLOR.charcoal : COLOR.text);
    doc.text(line, MARGIN, y);
    y += lineGap;
  }
  return y;
}

/** Compact horizontal label/value rows, right-aligned block. */
function drawQuoteMetaGrid(doc: jsPDF, topY: number, quote: SalesQuote): number {
  const labelX = RIGHT_EDGE - 52;
  const valueX = RIGHT_EDGE;
  const rows: Array<[string, string]> = [
    ["Quote #", quote.quoteNumber],
    ["Date", formatSalesQuoteDisplayDate(quote.issueDate)],
    ["Valid until", formatSalesQuoteDisplayDate(quote.validUntil)],
    ["Currency", quote.currency.toUpperCase()],
  ];

  let y = topY;
  doc.setFont("helvetica", "normal");
  for (const [label, value] of rows) {
    doc.setFontSize(7.5);
    setText(doc, COLOR.muted);
    doc.text(label, labelX, y, { align: "right" });
    doc.setFontSize(8);
    setText(doc, COLOR.text);
    doc.text(value, valueX, y, { align: "right" });
    y += 4.2;
  }
  return y;
}

async function drawPageHeader(
  doc: jsPDF,
  quote: SalesQuote,
  seller: SalesQuoteSellerProfile | undefined,
  workspaceSlug: string | null | undefined,
): Promise<number> {
  const headerTop = MARGIN;
  const logoBottom = await embedLogo(doc, quote, workspaceSlug, MARGIN, headerTop);
  const sellerBottom = drawSellerBlock(doc, seller, logoBottom);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setText(doc, COLOR.primary);
  doc.text("SALES QUOTE", RIGHT_EDGE, headerTop + 4, { align: "right" });
  const metaBottom = drawQuoteMetaGrid(doc, headerTop + 9, quote);

  const headerBottom = Math.max(sellerBottom, metaBottom) + 3;
  hRule(doc, headerBottom);
  return headerBottom + SECTION_GAP;
}

function drawBillTo(doc: jsPDF, quote: SalesQuote, y: number): number {
  const pad = 2.5;
  const innerX = MARGIN + pad;
  const labelY = y + pad + 2;
  let textY = labelY + 6.5;
  if (quote.contactName?.trim()) textY += 3.4;
  if (quote.contactEmail?.trim()) textY += 3.4;
  const boxBottom = textY + pad;

  setFill(doc, COLOR.panelFill);
  setStroke(doc, COLOR.rule, 0.12);
  doc.rect(MARGIN, y, CONTENT_W, boxBottom - y, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, COLOR.primary);
  doc.text("BILL TO", innerX, labelY);
  doc.setFontSize(9);
  setText(doc, COLOR.charcoal);
  doc.text(quote.companyName, innerX, labelY + 4);

  textY = labelY + 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, COLOR.text);
  if (quote.contactName?.trim()) {
    doc.text(quote.contactName.trim(), innerX, textY);
    textY += 3.4;
  }
  if (quote.contactEmail?.trim()) {
    setText(doc, COLOR.muted);
    doc.text(quote.contactEmail.trim(), innerX, textY);
  }

  return boxBottom + SECTION_GAP;
}

function drawQuoteProjectHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, COLOR.primary);
  doc.text("QUOTE / PROJECT", MARGIN, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setText(doc, COLOR.charcoal);
  doc.text(title, MARGIN, y + 5);
  return y + 9;
}

function drawContinuation(doc: jsPDF, quote: SalesQuote): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.muted);
  doc.text(quote.quoteNumber, RIGHT_EDGE, MARGIN + 2, { align: "right" });
  hRule(doc, MARGIN + 6);
  return MARGIN + 9;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, quote: SalesQuote): number {
  if (y + needed <= CONTENT_BOTTOM) return y;
  doc.addPage();
  return drawContinuation(doc, quote);
}

function drawScopeTable(doc: jsPDF, quote: SalesQuote, y: number): number {
  y = ensureSpace(doc, y, 14, quote);
  const tableTop = y;
  const headH = 7;
  const cellPadX = 3;
  const textW = CONTENT_W - cellPadX * 2;

  setStroke(doc, COLOR.rule, 0.12);
  doc.line(MARGIN, tableTop, RIGHT_EDGE, tableTop);
  setFill(doc, COLOR.tableHead);
  doc.rect(MARGIN, tableTop, CONTENT_W, headH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setText(doc, COLOR.primary);
  doc.text("DESCRIPTION / SERVICE SCOPE", MARGIN + cellPadX, tableTop + 4.8);

  y = tableTop + headH;
  const sorted = [...quote.lineItems].sort((a, b) => a.lineNumber - b.lineNumber);

  for (let i = 0; i < sorted.length; i += 1) {
    const line = sorted[i]!;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const titleLines = doc.splitTextToSize(line.description.trim(), textW);
    let detailLines: string[] = [];
    if (line.detailText?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      detailLines = doc.splitTextToSize(line.detailText.trim(), textW);
    }
    const rowH =
      2.5 +
      titleLines.length * 3.4 +
      (detailLines.length ? 1 + detailLines.length * 3 : 0) +
      2.5;
    y = ensureSpace(doc, y, rowH + 1, quote);

    const rowTop = y;
    let textY = rowTop + 2.8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLOR.charcoal);
    doc.text(titleLines, MARGIN + cellPadX, textY);
    textY += titleLines.length * 3.4;

    if (detailLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(doc, COLOR.muted);
      doc.text(detailLines, MARGIN + cellPadX, textY + 0.8);
      textY += 0.8 + detailLines.length * 3;
    }

    y = rowTop + rowH;
    setStroke(doc, COLOR.rule, 0.1);
    doc.line(MARGIN, y, RIGHT_EDGE, y);
  }

  return y + 1;
}

function drawDetailedLineTable(doc: jsPDF, quote: SalesQuote, y: number): number {
  const visibility = normalizeLineColumnVisibility(quote.lineColumnVisibility);
  y = ensureSpace(doc, y, 12, quote);
  const tableTop = y;
  setFill(doc, COLOR.tableHead);
  setStroke(doc, COLOR.rule, 0.15);
  doc.rect(MARGIN, tableTop, CONTENT_W, 7, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setText(doc, COLOR.primary);
  doc.text("DESCRIPTION", MARGIN + 3, tableTop + 4.8);
  y = tableTop + 7;

  for (const line of quote.lineItems) {
    const wrapped = doc.splitTextToSize(line.description, 80);
    const blockH = wrapped.length * 3.6 + 5;
    y = ensureSpace(doc, y, blockH, quote);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLOR.text);
    doc.text(wrapped, MARGIN + 3, y + 3.5);
    let colX = MARGIN + 88;
    doc.setFont("helvetica", "normal");
    if (visibility.showQuantity) {
      doc.text(String(line.quantity), colX, y + 3.5);
      colX += 14;
    }
    if (visibility.showUnit) doc.text(line.unit ?? "—", colX, y + 3.5);
    doc.text(money(line.amount, quote.currency), RIGHT_EDGE - 3, y + 3.5, { align: "right" });
    y += blockH;
    doc.line(MARGIN, y, RIGHT_EDGE, y);
  }
  doc.line(MARGIN, tableTop, MARGIN, y);
  doc.line(RIGHT_EDGE, tableTop, RIGHT_EDGE, y);
  return y + 4;
}

function drawTotalBlock(doc: jsPDF, quote: SalesQuote, y: number, scopeStyle: boolean): number {
  y = ensureSpace(doc, y, 14, quote);
  const labelX = RIGHT_EDGE - 58;

  setStroke(doc, COLOR.charcoal, 0.35);
  doc.line(MARGIN, y, RIGHT_EDGE, y);
  y += 4.5;

  if (scopeStyle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLOR.muted);
    doc.text("TOTAL", labelX, y);
    doc.setFontSize(9.5);
    setText(doc, COLOR.primary);
    doc.text(moneyWithCurrencyCode(quote.totalAmount, quote.currency), RIGHT_EDGE, y, {
      align: "right",
    });
    y += 4;
    setStroke(doc, COLOR.rule, 0.1);
    doc.line(MARGIN, y, RIGHT_EDGE, y);
    return y + SECTION_GAP + 2;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, COLOR.text);
  doc.text("Subtotal", labelX, y);
  doc.text(money(quote.subtotal, quote.currency), RIGHT_EDGE, y, { align: "right" });
  y += 4.5;
  doc.text("Tax", labelX, y);
  doc.text(money(quote.taxAmount, quote.currency), RIGHT_EDGE, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "bold");
  setText(doc, COLOR.primary);
  doc.text("TOTAL", labelX, y);
  doc.text(money(quote.totalAmount, quote.currency), RIGHT_EDGE, y, { align: "right" });
  y += 4;
  hRule(doc, y);
  return y + 6;
}

function drawTerms(doc: jsPDF, quote: SalesQuote, y: number): number {
  const parts: string[] = [];
  if (quote.paymentTerms?.trim()) parts.push(quote.paymentTerms.trim());
  if (quote.notes?.trim()) parts.push(quote.notes.trim());
  if (quote.termsAndConditions?.trim()) parts.push(quote.termsAndConditions.trim());
  if (!parts.length) return y;

  y = ensureSpace(doc, y, 12, quote);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, COLOR.charcoal);
  doc.text("TERMS & CONDITIONS", MARGIN, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.muted);
  for (const chunk of doc.splitTextToSize(parts.join("\n\n"), CONTENT_W)) {
    y = ensureSpace(doc, y, 4, quote);
    doc.text(chunk, MARGIN, y);
    y += 3.3;
  }
  return y + 3;
}

function drawBankDetails(doc: jsPDF, quote: SalesQuote, y: number, bank: SalesQuoteBankDetails): number {
  const rows: string[] = [];
  if (bank.accountName) rows.push(`Account name: ${bank.accountName}`);
  if (bank.bankName) rows.push(`Bank: ${bank.bankName}`);
  if (bank.accountNumber) rows.push(`Account number: ${bank.accountNumber}`);
  if (bank.sortCode) rows.push(`Sort code: ${bank.sortCode}`);
  if (bank.iban) rows.push(`IBAN: ${bank.iban}`);
  if (bank.swiftBic) rows.push(`SWIFT/BIC: ${bank.swiftBic}`);
  if (bank.other) rows.push(bank.other);
  if (!rows.length) return y;
  y = ensureSpace(doc, y, 10, quote);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, COLOR.charcoal);
  doc.text("BANK DETAILS", MARGIN, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.muted);
  for (const line of doc.splitTextToSize(rows.join("\n"), CONTENT_W)) {
    doc.text(line, MARGIN, y);
    y += 3.3;
  }
  return y + 3;
}

function drawFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    setStroke(doc, COLOR.rule, 0.08);
    doc.line(MARGIN, FOOTER_Y - 3, RIGHT_EDGE, FOOTER_Y - 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLOR.muted);
    doc.text(`Page ${p} of ${pages}`, RIGHT_EDGE, FOOTER_Y, { align: "right" });
  }
}

export async function buildSalesQuotePdfDocument(
  quote: SalesQuote,
  seller?: SalesQuoteSellerProfile,
  options?: BuildSalesQuotePdfOptions,
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const visibility = normalizeLineColumnVisibility(quote.lineColumnVisibility);
  const scopeStyle = isScopeStyleQuote(quote.pricingStyle, visibility);

  let y = await drawPageHeader(doc, quote, seller, options?.workspaceSlug ?? null);
  y = drawBillTo(doc, quote, y);
  if (quote.title?.trim()) {
    y = ensureSpace(doc, y, 10, quote);
    y += 2;
    y = drawQuoteProjectHeading(doc, quote.title.trim(), y);
  }
  y = scopeStyle ? drawScopeTable(doc, quote, y) : drawDetailedLineTable(doc, quote, y);
  y = drawTotalBlock(doc, quote, y, scopeStyle);
  y = drawTerms(doc, quote, y);
  const bank = normalizeBankDetails(quote.bankDetails);
  if (bank) y = drawBankDetails(doc, quote, y, bank);
  drawFooters(doc);
  return new Uint8Array(doc.output("arraybuffer"));
}

export async function appendTermsPdfToQuote(mainPdf: Uint8Array, termsPdf: Uint8Array): Promise<Uint8Array> {
  const main = await PDFDocument.load(mainPdf);
  const terms = await PDFDocument.load(termsPdf);
  const pages = await main.copyPages(terms, terms.getPageIndices());
  for (const page of pages) main.addPage(page);
  return new Uint8Array(await main.save());
}
