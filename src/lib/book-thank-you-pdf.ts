import type { BookThankYouSelections } from "@/lib/book-thank-you-data";
import { getSelectedBookThankYouItems } from "@/lib/book-thank-you-data";
import { BOOK_FOCUS_GRID_ROWS, MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN } from "@/lib/book-focus-grid-data";
import { formatLondonDateTime } from "@/lib/founder-booking/slots";
import { jsPDF } from "jspdf";

const PAGE_W = 210;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

export type BookThankYouPdfInput = {
  contactName: string;
  organization: string;
  email: string;
  sessionWhenGmt: string;
  sessionWhenClient?: string | null;
  meetingLink: string;
  selections: BookThankYouSelections;
};

export function bookThankYouPdfFileName(organization: string) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  const safeOrg = organization.replace(/[<>:"/\\|?*]+/g, "").trim() || "Client";
  return `Session Focus Areas — ${safeOrg} — ${date}.pdf`;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed <= 280) return y;
  doc.addPage();
  return 24;
}

function renderCheckboxList(
  doc: jsPDF,
  items: readonly string[],
  selected: Set<string>,
  startY: number,
) {
  let y = startY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  for (const item of items) {
    y = ensureSpace(doc, y, 8);
    const checked = selected.has(item);
    doc.setFont("helvetica", checked ? "bold" : "normal");
    doc.setTextColor(checked ? 11 : 71, checked ? 45 : 85, checked ? 99 : 105);
    const prefix = checked ? "[x]" : "[ ]";
    const lines = wrapText(doc, `${prefix} ${item}`, CONTENT_W - 4);
    doc.text(lines, MARGIN + 2, y);
    y += lines.length * 4.5 + 1.5;
  }

  return y;
}

export async function buildBookThankYouFocusPdf(input: BookThankYouPdfInput): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const generatedAt = new Date().toISOString();
  const { byColumn, totalSelected } = getSelectedBookThankYouItems(input.selections);

  doc.setFillColor(11, 45, 99);
  doc.rect(0, 0, PAGE_W, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Discovery Session Focus Areas", MARGIN, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(147, 197, 253);
  doc.text("Unit311 Central", MARGIN, 24);
  doc.text(`Generated ${formatLondonDateTime(generatedAt)} GMT`, MARGIN, 30);

  let y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(input.organization.trim() || "Client organisation", MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Prepared for ${input.contactName.trim() || "Contact"}`, MARGIN, y);
  y += 5;
  doc.text(input.email.trim(), MARGIN, y);
  y += 10;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Session details", MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`When (GMT): ${input.sessionWhenGmt}`, MARGIN, y);
  y += 5;
  if (input.sessionWhenClient) {
    doc.text(`Client time: ${input.sessionWhenClient}`, MARGIN, y);
    y += 5;
  }
  const meetingLines = wrapText(doc, `Meeting link: ${input.meetingLink}`, CONTENT_W);
  doc.text(meetingLines, MARGIN, y);
  y += meetingLines.length * 5 + 8;

  const allColumns = [
    ...BOOK_FOCUS_GRID_ROWS.flat(),
    MODULE_REVIEW_EXECUTIVE_ASSISTANT_COLUMN,
  ];
  for (const column of allColumns) {
    const itemLabels = column.items
      .filter((entry) => entry.kind === "item")
      .map((entry) => entry.label);
    const selectedInColumn = byColumn[column.title] ?? [];
    const selectedSet = new Set(selectedInColumn);

    y = ensureSpace(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(column.tone === "emerald" ? 5 : 14, column.tone === "emerald" ? 150 : 116, column.tone === "emerald" ? 105 : 144);
    doc.text(column.title, MARGIN, y);
    y += 6;
    y = renderCheckboxList(doc, itemLabels, selectedSet, y) + 4;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const summary =
    totalSelected === 0
      ? "No specific focus areas were selected. The team will explore priorities during the discovery call."
      : `${totalSelected} focus area${totalSelected === 1 ? "" : "s"} selected for discussion.`;
  const summaryLines = wrapText(doc, summary, CONTENT_W);
  y = ensureSpace(doc, y, summaryLines.length * 5 + 4);
  doc.text(summaryLines, MARGIN, y);

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
