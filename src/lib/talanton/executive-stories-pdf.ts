/**
 * Impact / portfolio / journey stories PDF for Talanton EA.
 */

import { jsPDF } from "jspdf";

import {
  drawAssistantPdfFooter,
  drawAssistantPdfHeader,
  resolveAssistantPdfBrand,
} from "@/lib/ai-operating-assistant/pdf-brand";
import type { StoriesQueryResult } from "@/lib/talanton/executive-stories-intelligence";
import { describeScope } from "@/lib/talanton/executive-stories-intelligence";

export function talantonStoriesReportFilename(): string {
  const d = new Date().toISOString().slice(0, 10);
  return `Talanton-Impact-Stories-${d}.pdf`;
}

export async function buildTalantonStoriesReportPdf(
  result: StoriesQueryResult,
  organisationName?: string | null,
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const brand = await resolveAssistantPdfBrand("talantonimpact");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 40;
  const usable = pageWidth - 80;
  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName,
    title: "Impact Stories Report",
    subtitle: describeScope(result.scope),
    metaRight: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });

  const { colors } = brand;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.navy);
  doc.text("Summary", left, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  const summaryLines = doc.splitTextToSize(
    `${result.rows.length} stories (${result.counts.portfolio} portfolio, ${result.counts.journey} journey) across ${result.counts.companies} companies and ${result.counts.categories} themes.`,
    usable,
  );
  doc.text(summaryLines, left, y);
  y += summaryLines.length * 12 + 10;

  for (const row of result.rows.slice(0, 20)) {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.navy);
    const titleLines = doc.splitTextToSize(row.title, usable);
    doc.text(titleLines, left, y);
    y += titleLines.length * 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(
      `${row.kind} · ${row.companyNames.join(", ")} · ${row.country} · ${row.status} · ${row.categoryOrSector} · ${row.date}`,
      left,
      y,
    );
    y += 12;

    doc.setTextColor(...colors.text);
    const bodyLines = doc.splitTextToSize(row.summary, usable);
    doc.text(bodyLines, left, y);
    y += bodyLines.length * 11 + 10;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    drawAssistantPdfFooter(doc, brand, `Page ${p} of ${pages}`);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
