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

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const FOOTER_TOP = PAGE_H - 14;
const CONTENT_BOTTOM = PAGE_H - 20;
const GUTTER = 8;
const LEFT_BLOCK_W = 96;
const RIGHT_BLOCK_X = MARGIN + LEFT_BLOCK_W + GUTTER;

const COLOR = {
  primary: [30, 64, 175] as const,
  text: [31, 41, 55] as const,
  muted: [71, 85, 105] as const,
  secondary: [100, 116, 139] as const,
  line: [226, 232, 240] as const,
  tableHeadBg: [239, 246, 255] as const,
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

/** Scope-total quotes show an explicit currency code (e.g. USD 40,000.00). */
function moneyWithCurrencyCode(amount: number, currency: string) {
  const code = currency.toUpperCase();
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${code} ${formatted}`;
}

export type BuildSalesQuotePdfOptions = {
  workspaceSlug?: string | null;
};

async function embedWorkspaceDocumentLogo(
  doc: jsPDF,
  quote: SalesQuote,
  workspaceSlug: string | null | undefined,
  x: number,
  y: number,
  widthMm = 46,
): Promise<number> {
  const raster = await loadWorkspaceDocumentLogoRasterForPdf({
    workspaceId: quote.workspaceId,
    workspaceSlug: workspaceSlug ?? null,
  });
  if (!raster) return y;
  const aspect = raster.widthPx / Math.max(raster.heightPx, 1);
  const heightMm = widthMm / aspect;
  const base64 = Buffer.from(raster.bytes).toString("base64");
  const dataUrl = `data:image/${raster.format.toLowerCase()};base64,${base64}`;
  doc.addImage(dataUrl, raster.format, x, y, widthMm, heightMm);
  return y + heightMm + 3;
}

function setTextColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawHorizontalRule(doc: jsPDF, y: number) {
  doc.setDrawColor(COLOR.line[0], COLOR.line[1], COLOR.line[2]);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

function drawLabelValueBlock(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  rows: Array<{ label: string; value: string }>,
  lineHeight = 4.2,
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (const row of rows) {
    setTextColor(doc, COLOR.muted);
    doc.text(`${row.label}`, x, y);
    setTextColor(doc, COLOR.text);
    const valueX = x + 22;
    const wrapped = doc.splitTextToSize(row.value, width - 22);
    doc.text(wrapped, valueX, y);
    y += Math.max(lineHeight, wrapped.length * lineHeight);
  }
  return y;
}

function drawPanelHeading(doc: jsPDF, x: number, y: number, title: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTextColor(doc, COLOR.primary);
  doc.text(title.toUpperCase(), x, y);
  return y + 5;
}

function drawCompanyBlock(doc: jsPDF, seller: SalesQuoteSellerProfile | undefined, startY: number): number {
  let y = startY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTextColor(doc, COLOR.text);
  for (const line of formatSellerPdfCompanyLines(seller)) {
    const wrapped = doc.splitTextToSize(line, LEFT_BLOCK_W);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 3.8;
  }
  return y;
}

function drawPageHeader(
  doc: jsPDF,
  quote: SalesQuote,
  seller: SalesQuoteSellerProfile | undefined,
  workspaceSlug: string | null | undefined,
): Promise<number> {
  return (async () => {
    let leftY = MARGIN;
    leftY = await embedWorkspaceDocumentLogo(doc, quote, workspaceSlug, MARGIN, leftY, 46);
    const companyBottom = drawCompanyBlock(doc, seller, leftY);

    const rightX = PAGE_W - MARGIN;
    let rightY = MARGIN + 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    setTextColor(doc, COLOR.primary);
    doc.text("Sales Quote", rightX, rightY, { align: "right" });
    rightY += 7;

    drawHorizontalRule(doc, rightY);
    rightY += 5;

    rightY = drawLabelValueBlock(
      doc,
      RIGHT_BLOCK_X,
      rightY,
      PAGE_W - MARGIN - RIGHT_BLOCK_X,
      [
        { label: "Quote:", value: quote.quoteNumber },
        { label: "Date:", value: formatSalesQuoteDisplayDate(quote.issueDate) },
        { label: "Valid until:", value: formatSalesQuoteDisplayDate(quote.validUntil) },
        { label: "Currency:", value: quote.currency.toUpperCase() },
      ],
      4.5,
    );

    const headerBottom = Math.max(companyBottom, rightY) + 4;
    drawHorizontalRule(doc, headerBottom);
    return headerBottom + 6;
  })();
}

function drawContinuationBanner(doc: jsPDF, quote: SalesQuote): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTextColor(doc, COLOR.secondary);
  doc.text(`${quote.quoteNumber} — continued`, MARGIN, MARGIN + 3);
  drawHorizontalRule(doc, MARGIN + 5);
  return MARGIN + 10;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, quote: SalesQuote): number {
  if (y + needed <= CONTENT_BOTTOM) return y;
  doc.addPage();
  return drawContinuationBanner(doc, quote);
}

function drawCustomerPanels(doc: jsPDF, quote: SalesQuote, y: number): number {
  y = ensureSpace(doc, y, 34, quote);
  const panelTop = y;
  const panelW = (PAGE_W - MARGIN * 2 - GUTTER) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + panelW + GUTTER;

  let leftY = drawPanelHeading(doc, leftX, panelTop, "Bill to");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(doc, COLOR.text);
  doc.text(quote.companyName, leftX, leftY);
  leftY += 4.5;
  if (quote.contactName?.trim()) {
    doc.text(quote.contactName.trim(), leftX, leftY);
    leftY += 4.5;
  }
  if (quote.contactEmail?.trim()) {
    setTextColor(doc, COLOR.muted);
    doc.text(quote.contactEmail.trim(), leftX, leftY);
    leftY += 4.5;
  }

  let rightY = drawPanelHeading(doc, rightX, panelTop, "Quote overview");
  rightY = drawLabelValueBlock(
    doc,
    rightX,
    rightY,
    panelW,
    [
      { label: "Quote Ref:", value: quote.quoteNumber },
      { label: "Date Issued:", value: formatSalesQuoteDisplayDate(quote.issueDate) },
      { label: "Valid Until:", value: formatSalesQuoteDisplayDate(quote.validUntil) },
      { label: "Currency:", value: quote.currency.toUpperCase() },
    ],
    4.3,
  );

  return Math.max(leftY, rightY) + 6;
}

function drawScopeTable(doc: jsPDF, quote: SalesQuote, y: number, scopeStyle: boolean): number {
  const visibility = normalizeLineColumnVisibility(quote.lineColumnVisibility);
  if (scopeStyle) {
    y = ensureSpace(doc, y, 14, quote);
    const tableTop = y;
    doc.setFillColor(COLOR.tableHeadBg[0], COLOR.tableHeadBg[1], COLOR.tableHeadBg[2]);
    doc.rect(MARGIN, tableTop - 4, PAGE_W - MARGIN * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTextColor(doc, COLOR.primary);
    doc.text("Description / Service scope", MARGIN + 2, tableTop + 1.5);
    y = tableTop + 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const width = PAGE_W - MARGIN * 2 - 4;
    const sorted = [...quote.lineItems].sort((a, b) => a.lineNumber - b.lineNumber);

    for (const line of sorted) {
      const descWrapped = doc.splitTextToSize(line.description.trim(), width);
      let detailWrapped: string[] = [];
      if (line.detailText?.trim()) {
        doc.setFontSize(8);
        detailWrapped = doc.splitTextToSize(line.detailText.trim(), width);
      }
      const rowHeight = descWrapped.length * 4.2 + detailWrapped.length * 3.4 + 6;
      y = ensureSpace(doc, y, rowHeight, quote);

      setTextColor(doc, COLOR.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(descWrapped, MARGIN + 2, y);

      let lineY = y + descWrapped.length * 4.2;
      if (detailWrapped.length) {
        setTextColor(doc, COLOR.secondary);
        doc.setFontSize(8);
        doc.text(detailWrapped, MARGIN + 2, lineY);
        lineY += detailWrapped.length * 3.4;
        doc.setFontSize(9);
      }

      y = lineY + 3;
      drawHorizontalRule(doc, y);
      y += 5;
    }
    return y;
  }

  y = ensureSpace(doc, y, 14, quote);
  doc.setFillColor(COLOR.tableHeadBg[0], COLOR.tableHeadBg[1], COLOR.tableHeadBg[2]);
  doc.rect(MARGIN, y - 4, PAGE_W - MARGIN * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTextColor(doc, COLOR.primary);
  doc.text("Description", MARGIN + 2, y + 1.5);
  let x = MARGIN + 92;
  if (visibility.showQuantity) {
    doc.text("Qty", x, y + 1.5);
    x += 14;
  }
  if (visibility.showUnit) {
    doc.text("Unit", x, y + 1.5);
    x += 16;
  }
  if (visibility.showRate) {
    doc.text("Rate", x, y + 1.5);
    x += 22;
  }
  if (visibility.showDiscount) {
    doc.text("Disc", x, y + 1.5);
    x += 16;
  }
  if (visibility.showTax) {
    doc.text("Tax", x, y + 1.5);
  }
  doc.text("Total", PAGE_W - MARGIN - 2, y + 1.5, { align: "right" });
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(doc, COLOR.text);
  for (const line of quote.lineItems) {
    const descWidth = 86;
    const wrapped = doc.splitTextToSize(line.description, descWidth);
    const blockHeight = wrapped.length * 4.2 + (line.detailText?.trim() ? 8 : 0) + 6;
    y = ensureSpace(doc, y, blockHeight, quote);
    doc.setFont("helvetica", "bold");
    doc.text(wrapped, MARGIN + 2, y);
    let lineY = y + wrapped.length * 4.2;
    if (line.detailText?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setTextColor(doc, COLOR.secondary);
      const detail = doc.splitTextToSize(line.detailText.trim(), PAGE_W - MARGIN * 2 - 4);
      doc.text(detail, MARGIN + 2, lineY);
      lineY += detail.length * 3.4;
      doc.setFontSize(9);
      setTextColor(doc, COLOR.text);
    }
    doc.setFont("helvetica", "normal");
    let colX = MARGIN + 92;
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
      colX += 16;
    }
    if (visibility.showTax) {
      doc.text(money(line.taxAmount ?? 0, quote.currency), colX, y);
    }
    doc.text(money(line.amount, quote.currency), PAGE_W - MARGIN - 2, y, { align: "right" });
    y = lineY + 3;
    drawHorizontalRule(doc, y);
    y += 5;
  }
  return y;
}

function drawTotalBlock(doc: jsPDF, quote: SalesQuote, y: number, scopeStyle: boolean): number {
  y = ensureSpace(doc, y, 22, quote);
  const blockW = 72;
  const blockX = PAGE_W - MARGIN - blockW;
  drawHorizontalRule(doc, y);
  y += 8;

  if (scopeStyle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextColor(doc, COLOR.muted);
    doc.text("Total", blockX, y);
    doc.setFontSize(13);
    setTextColor(doc, COLOR.primary);
    doc.text(moneyWithCurrencyCode(quote.totalAmount, quote.currency), PAGE_W - MARGIN, y, {
      align: "right",
    });
    return y + 10;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(doc, COLOR.text);
  doc.text("Subtotal", blockX, y);
  doc.text(money(quote.subtotal, quote.currency), PAGE_W - MARGIN, y, { align: "right" });
  y += 5;
  if (quote.discountAmount > 0) {
    doc.text("Discount", blockX, y);
    doc.text(money(quote.discountAmount, quote.currency), PAGE_W - MARGIN, y, { align: "right" });
    y += 5;
  }
  doc.text("Tax", blockX, y);
  doc.text(money(quote.taxAmount, quote.currency), PAGE_W - MARGIN, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  setTextColor(doc, COLOR.primary);
  doc.text("Total", blockX, y);
  doc.setFontSize(12);
  doc.text(money(quote.totalAmount, quote.currency), PAGE_W - MARGIN, y, { align: "right" });
  return y + 10;
}

function drawTextSection(doc: jsPDF, quote: SalesQuote, y: number, title: string, body: string): number {
  y = ensureSpace(doc, y, 16, quote);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setTextColor(doc, COLOR.text);
  doc.text(title, MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTextColor(doc, COLOR.muted);
  const lines = doc.splitTextToSize(body.trim(), PAGE_W - MARGIN * 2);
  for (const chunk of lines) {
    y = ensureSpace(doc, y, 5, quote);
    doc.text(chunk, MARGIN, y);
    y += 4;
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
  return drawTextSection(doc, quote, y, "Bank details", rows.join("\n"));
}

function drawFooters(doc: jsPDF, seller?: SalesQuoteSellerProfile) {
  const pageCount = doc.getNumberOfPages();
  const footerLine = formatSellerPdfFooterLine(seller);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawHorizontalRule(doc, FOOTER_TOP - 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTextColor(doc, COLOR.secondary);
    doc.text(footerLine, MARGIN, FOOTER_TOP);
    doc.text(`Page ${page} of ${pageCount}`, PAGE_W - MARGIN, FOOTER_TOP, { align: "right" });
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

  let y = await drawPageHeader(doc, quote, seller, workspaceSlug);
  y = drawCustomerPanels(doc, quote, y);

  if (quote.title?.trim()) {
    y = ensureSpace(doc, y, 10, quote);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    setTextColor(doc, COLOR.text);
    doc.text(quote.title.trim(), MARGIN, y);
    y += 7;
  }

  y = drawScopeTable(doc, quote, y, scopeStyle);
  y = drawTotalBlock(doc, quote, y, scopeStyle);

  if (quote.paymentTerms?.trim()) {
    y = drawTextSection(doc, quote, y, "Payment terms", quote.paymentTerms);
  }
  if (quote.notes?.trim()) {
    y = drawTextSection(doc, quote, y, "Notes", quote.notes);
  }
  if (quote.termsAndConditions?.trim()) {
    y = drawTextSection(doc, quote, y, "Terms & conditions", quote.termsAndConditions);
  }

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
