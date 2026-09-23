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
import {
  formatSellerPdfCompanyLines,
  formatSellerPdfFooterLine,
} from "@/lib/accounting/sales-quote-pdf-seller-lines";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";
import { loadWorkspaceDocumentLogoRasterForPdf } from "@/lib/workspace-document-logo-service";

/** ~140px equivalent — clear in print without oversized header block. */
const LOGO_WIDTH_MM = 42;

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const FOOTER_Y = PAGE_H - 12;
const CONTENT_BOTTOM = PAGE_H - 18;
const COL_GUTTER = 10;
const LEFT_COL_W = 98;
const RIGHT_COL_X = MARGIN + LEFT_COL_W + COL_GUTTER;
const RIGHT_COL_W = PAGE_W - MARGIN - RIGHT_COL_X;

const COLOR = {
  primary: [30, 64, 175] as const,
  text: [30, 41, 59] as const,
  charcoal: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  secondary: [113, 128, 150] as const,
  rule: [226, 232, 240] as const,
  panelFill: [248, 250, 252] as const,
  scopeHeadFill: [241, 245, 249] as const,
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

function hRule(doc: jsPDF, y: number, x1 = MARGIN, x2 = PAGE_W - MARGIN) {
  setStroke(doc, COLOR.rule);
  doc.line(x1, y, x2, y);
}

async function embedWorkspaceDocumentLogo(
  doc: jsPDF,
  quote: SalesQuote,
  workspaceSlug: string | null | undefined,
  x: number,
  y: number,
): Promise<number> {
  const raster = await loadWorkspaceDocumentLogoRasterForPdf({
    workspaceId: quote.workspaceId,
    workspaceSlug: workspaceSlug ?? null,
  });
  if (!raster) return y;
  const aspect = raster.widthPx / Math.max(raster.heightPx, 1);
  const heightMm = LOGO_WIDTH_MM / aspect;
  const base64 = Buffer.from(raster.bytes).toString("base64");
  const dataUrl = `data:image/${raster.format.toLowerCase()};base64,${base64}`;
  doc.addImage(dataUrl, raster.format, x, y, LOGO_WIDTH_MM, heightMm);
  return y + heightMm + 2.5;
}

function drawCompanyUnderLogo(doc: jsPDF, seller: SalesQuoteSellerProfile | undefined, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.text);
  const lineGap = 3.35;
  for (const line of formatSellerPdfCompanyLines(seller)) {
    const isBrand = line === (seller?.brandName?.trim() || seller?.companyName?.trim());
    if (isBrand) {
      doc.setFont("helvetica", "bold");
      setText(doc, COLOR.charcoal);
    } else {
      doc.setFont("helvetica", "normal");
      setText(doc, COLOR.text);
    }
    doc.text(line, MARGIN, y);
    y += lineGap;
  }
  return y;
}

/** Label above value, right-aligned — avoids side-by-side form fields. */
function drawRightMetaStack(
  doc: jsPDF,
  topY: number,
  items: Array<{ label: string; value: string }>,
): number {
  const rightX = PAGE_W - MARGIN;
  let y = topY;
  for (const item of items) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLOR.muted);
    doc.text(item.label, rightX, y, { align: "right" });
    y += 3.2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setText(doc, COLOR.charcoal);
    doc.text(item.value, rightX, y, { align: "right" });
    y += 5.2;
  }
  return y;
}

async function drawDocumentHeader(
  doc: jsPDF,
  quote: SalesQuote,
  seller: SalesQuoteSellerProfile | undefined,
  workspaceSlug: string | null | undefined,
): Promise<number> {
  let leftY = MARGIN;
  leftY = await embedWorkspaceDocumentLogo(doc, quote, workspaceSlug, MARGIN, leftY);
  const leftBottom = drawCompanyUnderLogo(doc, seller, leftY);

  const rightX = PAGE_W - MARGIN;
  let rightY = MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setText(doc, COLOR.primary);
  doc.text("SALES QUOTE", rightX, rightY, { align: "right" });
  rightY += 10;

  rightY = drawRightMetaStack(doc, rightY, [
    { label: "Quote #:", value: quote.quoteNumber },
    { label: "Date:", value: formatSalesQuoteDisplayDate(quote.issueDate) },
    { label: "Valid Until:", value: formatSalesQuoteDisplayDate(quote.validUntil) },
    { label: "Currency:", value: quote.currency.toUpperCase() },
  ]);

  const headerBottom = Math.max(leftBottom, rightY) + 3;
  hRule(doc, headerBottom);
  return headerBottom + 5;
}

function drawInfoBand(doc: jsPDF, quote: SalesQuote, y: number): number {
  const bandTop = y;
  const halfW = (PAGE_W - MARGIN * 2 - COL_GUTTER) / 2;
  const leftX = MARGIN + 4;
  const rightX = MARGIN + halfW + COL_GUTTER + 4;
  const detailLines = [
    `Quote # ${quote.quoteNumber}`,
    `Date ${formatSalesQuoteDisplayDate(quote.issueDate)}`,
    `Valid until ${formatSalesQuoteDisplayDate(quote.validUntil)}`,
  ];

  let leftBottom = bandTop + 9.5 + 4.5;
  if (quote.contactName?.trim()) leftBottom += 4;
  if (quote.contactEmail?.trim()) leftBottom += 4;
  const rightBottom = bandTop + 9.5 + detailLines.length * 4;
  const bandBottom = Math.max(leftBottom, rightBottom) + 5;

  setFill(doc, COLOR.panelFill);
  doc.rect(MARGIN, bandTop, PAGE_W - MARGIN * 2, bandBottom - bandTop, "F");
  setStroke(doc, COLOR.primary, 0.35);
  doc.line(leftX - 2, bandTop + 2, leftX - 2, bandBottom - 2);
  doc.line(rightX - 2, bandTop + 2, rightX - 2, bandBottom - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, COLOR.primary);
  doc.text("PREPARED FOR", leftX, bandTop + 5);
  doc.text("QUOTE DETAILS", rightX, bandTop + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText(doc, COLOR.charcoal);
  doc.text(quote.companyName, leftX, bandTop + 9.5);

  let ly = bandTop + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, COLOR.text);
  if (quote.contactName?.trim()) {
    doc.text(quote.contactName.trim(), leftX, ly);
    ly += 4;
  }
  if (quote.contactEmail?.trim()) {
    setText(doc, COLOR.muted);
    doc.text(quote.contactEmail.trim(), leftX, ly);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, COLOR.text);
  let ry = bandTop + 9.5;
  for (const line of detailLines) {
    doc.text(line, rightX, ry);
    ry += 4;
  }

  return bandBottom + 5;
}

function drawQuoteProjectTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setText(doc, COLOR.charcoal);
  doc.text(title, MARGIN, y);
  y += 2.5;
  setStroke(doc, COLOR.primary, 0.6);
  doc.line(MARGIN, y, MARGIN + 28, y);
  return y + 6;
}

function drawContinuationBanner(doc: jsPDF, quote: SalesQuote): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.muted);
  doc.text(`${quote.quoteNumber}`, PAGE_W - MARGIN, MARGIN + 2, { align: "right" });
  hRule(doc, MARGIN + 6);
  return MARGIN + 10;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, quote: SalesQuote): number {
  if (y + needed <= CONTENT_BOTTOM) return y;
  doc.addPage();
  return drawContinuationBanner(doc, quote);
}

function scopeHeadingText(description: string): string {
  return description.trim();
}

function drawScopeServices(doc: jsPDF, quote: SalesQuote, y: number): number {
  y = ensureSpace(doc, y, 12, quote);
  const headH = 6.5;
  setFill(doc, COLOR.scopeHeadFill);
  doc.rect(MARGIN, y - 3.2, PAGE_W - MARGIN * 2, headH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setText(doc, COLOR.primary);
  doc.text("SERVICE / SCOPE", MARGIN + 3, y + 1);
  y += headH + 2;

  const textW = PAGE_W - MARGIN * 2 - 6;
  const sorted = [...quote.lineItems].sort((a, b) => a.lineNumber - b.lineNumber);
  const itemGap = 3.2;

  for (let i = 0; i < sorted.length; i += 1) {
    const line = sorted[i]!;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    const titleLines = doc.splitTextToSize(scopeHeadingText(line.description), textW);
    let detailLines: string[] = [];
    if (line.detailText?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      detailLines = doc.splitTextToSize(line.detailText.trim(), textW);
    }
    const blockH =
      titleLines.length * 3.3 + (detailLines.length ? 1.2 + detailLines.length * 3 : 0) + itemGap;
    y = ensureSpace(doc, y, blockH, quote);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    setText(doc, COLOR.charcoal);
    doc.text(titleLines, MARGIN + 3, y);

    let itemBottom = y + titleLines.length * 3.3;
    if (detailLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      setText(doc, COLOR.muted);
      doc.text(detailLines, MARGIN + 3, itemBottom + 1.2);
      itemBottom += 1.2 + detailLines.length * 3;
    }

    y = itemBottom + itemGap;
    if (i < sorted.length - 1) {
      setStroke(doc, COLOR.rule, 0.08);
      doc.line(MARGIN + 3, y - itemGap / 2, PAGE_W - MARGIN - 3, y - itemGap / 2);
    }
  }
  return y + 1;
}

function drawDetailedLineTable(doc: jsPDF, quote: SalesQuote, y: number): number {
  const visibility = normalizeLineColumnVisibility(quote.lineColumnVisibility);
  y = ensureSpace(doc, y, 12, quote);
  setFill(doc, COLOR.scopeHeadFill);
  doc.rect(MARGIN, y - 3.5, PAGE_W - MARGIN * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setText(doc, COLOR.primary);
  doc.text("DESCRIPTION", MARGIN + 3, y + 1.2);
  let x = MARGIN + 88;
  if (visibility.showQuantity) {
    doc.text("QTY", x, y + 1.2);
    x += 14;
  }
  if (visibility.showUnit) {
    doc.text("UNIT", x, y + 1.2);
    x += 16;
  }
  if (visibility.showRate) {
    doc.text("RATE", x, y + 1.2);
    x += 22;
  }
  if (visibility.showDiscount) {
    doc.text("DISC", x, y + 1.2);
    x += 14;
  }
  if (visibility.showTax) {
    doc.text("TAX", x, y + 1.2);
  }
  doc.text("TOTAL", PAGE_W - MARGIN - 3, y + 1.2, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, COLOR.text);
  for (const line of quote.lineItems) {
    const descWidth = 84;
    const wrapped = doc.splitTextToSize(line.description, descWidth);
    const blockHeight = wrapped.length * 3.8 + (line.detailText?.trim() ? 7 : 0) + 5;
    y = ensureSpace(doc, y, blockHeight, quote);
    doc.setFont("helvetica", "bold");
    doc.text(wrapped, MARGIN + 3, y);
    let lineY = y + wrapped.length * 3.8;
    if (line.detailText?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(doc, COLOR.secondary);
      const detail = doc.splitTextToSize(line.detailText.trim(), PAGE_W - MARGIN * 2 - 6);
      doc.text(detail, MARGIN + 3, lineY);
      lineY += detail.length * 3.2;
      doc.setFontSize(8.5);
      setText(doc, COLOR.text);
    }
    doc.setFont("helvetica", "normal");
    let colX = MARGIN + 88;
    if (visibility.showQuantity) {
      doc.text(String(line.quantity), colX, y);
      colX += 14;
    }
    if (visibility.showUnit) {
      doc.text(line.unit ?? "—", colX, y);
      colX += 16;
    }
    if (visibility.showRate) {
      doc.text(money(line.unitPrice, quote.currency), colX, y);
      colX += 22;
    }
    if (visibility.showDiscount) {
      doc.text(money(line.discountAmount ?? 0, quote.currency), colX, y);
      colX += 14;
    }
    if (visibility.showTax) {
      doc.text(money(line.taxAmount ?? 0, quote.currency), colX, y);
    }
    doc.text(money(line.amount, quote.currency), PAGE_W - MARGIN - 3, y, { align: "right" });
    y = lineY + 3;
    hRule(doc, y, MARGIN + 3, PAGE_W - MARGIN - 3);
    y += 4;
  }
  return y;
}

function drawCommercialTotal(doc: jsPDF, quote: SalesQuote, y: number, scopeStyle: boolean): number {
  y = ensureSpace(doc, y, 24, quote);
  const blockLeft = PAGE_W - MARGIN - 58;
  const blockRight = PAGE_W - MARGIN;

  hRule(doc, y, blockLeft, blockRight);
  y += 6;

  if (scopeStyle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLOR.muted);
    doc.text("TOTAL", blockLeft, y);
    y += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    setText(doc, COLOR.primary);
    doc.text(moneyWithCurrencyCode(quote.totalAmount, quote.currency), blockRight, y, {
      align: "right",
    });
    y += 3;
    hRule(doc, y, blockLeft, blockRight);
    return y + 4;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, COLOR.text);
  doc.text("Subtotal", blockLeft, y);
  doc.text(money(quote.subtotal, quote.currency), blockRight, y, { align: "right" });
  y += 4.5;
  if (quote.discountAmount > 0) {
    doc.text("Discount", blockLeft, y);
    doc.text(money(quote.discountAmount, quote.currency), blockRight, y, { align: "right" });
    y += 4.5;
  }
  doc.text("Tax", blockLeft, y);
  doc.text(money(quote.taxAmount, quote.currency), blockRight, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "bold");
  setText(doc, COLOR.primary);
  doc.text("TOTAL", blockLeft, y);
  doc.setFontSize(12);
  doc.text(money(quote.totalAmount, quote.currency), blockRight, y, { align: "right" });
  y += 4;
  hRule(doc, y, blockLeft, blockRight);
  return y + 8;
}

function drawTermsBlock(doc: jsPDF, quote: SalesQuote, y: number): number {
  const chunks: string[] = [];
  if (quote.paymentTerms?.trim()) chunks.push(quote.paymentTerms.trim());
  if (quote.notes?.trim()) chunks.push(quote.notes.trim());
  if (quote.termsAndConditions?.trim()) chunks.push(quote.termsAndConditions.trim());
  if (!chunks.length) return y;

  y = ensureSpace(doc, y, 14, quote);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, COLOR.charcoal);
  doc.text("TERMS & CONDITIONS", MARGIN, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.muted);
  const body = chunks.join("\n\n");
  const lines = doc.splitTextToSize(body, PAGE_W - MARGIN * 2);
  for (const line of lines) {
    y = ensureSpace(doc, y, 4, quote);
    doc.text(line, MARGIN, y);
    y += 3.4;
  }
  return y + 4;
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

  y = ensureSpace(doc, y, 12, quote);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, COLOR.charcoal);
  doc.text("BANK DETAILS", MARGIN, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLOR.muted);
  const lines = doc.splitTextToSize(rows.join("\n"), PAGE_W - MARGIN * 2);
  for (const line of lines) {
    y = ensureSpace(doc, y, 4, quote);
    doc.text(line, MARGIN, y);
    y += 3.4;
  }
  return y + 3;
}

function drawFooters(doc: jsPDF, seller?: SalesQuoteSellerProfile) {
  const pageCount = doc.getNumberOfPages();
  const footerLine = formatSellerPdfFooterLine(seller);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setStroke(doc, COLOR.rule, 0.1);
    doc.line(MARGIN, FOOTER_Y - 3.5, PAGE_W - MARGIN, FOOTER_Y - 3.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLOR.secondary);
    doc.text(footerLine, MARGIN, FOOTER_Y);
    doc.text(`Page ${page} of ${pageCount}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
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
  const workspaceSlug = options?.workspaceSlug ?? null;

  let y = await drawDocumentHeader(doc, quote, seller, workspaceSlug);
  y = drawInfoBand(doc, quote, y);

  if (quote.title?.trim()) {
    y = ensureSpace(doc, y, 12, quote);
    y = drawQuoteProjectTitle(doc, quote.title.trim(), y);
  }

  y = scopeStyle ? drawScopeServices(doc, quote, y) : drawDetailedLineTable(doc, quote, y);
  y = drawCommercialTotal(doc, quote, y, scopeStyle);
  y = drawTermsBlock(doc, quote, y);

  const bank = normalizeBankDetails(quote.bankDetails);
  if (bank) {
    y = drawBankDetails(doc, quote, y, bank);
  }

  drawFooters(doc, seller);
  return new Uint8Array(doc.output("arraybuffer"));
}

export async function appendTermsPdfToQuote(mainPdf: Uint8Array, termsPdf: Uint8Array): Promise<Uint8Array> {
  const main = await PDFDocument.load(mainPdf);
  const terms = await PDFDocument.load(termsPdf);
  const pages = await main.copyPages(terms, terms.getPageIndices());
  for (const page of pages) main.addPage(page);
  return new Uint8Array(await main.save());
}
