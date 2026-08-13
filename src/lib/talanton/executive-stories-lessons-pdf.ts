/**
 * Management-lessons PDF from synthesised Talanton field stories (not inventory report).
 */

import { jsPDF } from "jspdf";

import {
  drawAssistantPdfFooter,
  drawAssistantPdfHeader,
  resolveAssistantPdfBrand,
} from "@/lib/ai-operating-assistant/pdf-brand";
import type { StoriesLessonsAnalysis } from "@/lib/talanton/executive-stories-lessons";

export function talantonStoriesLessonsPdfFilename(): string {
  const d = new Date().toISOString().slice(0, 10);
  return `Talanton-Field-Stories-Management-Lessons-${d}.pdf`;
}

export async function buildTalantonStoriesLessonsPdf(
  analysis: StoriesLessonsAnalysis,
  organisationName?: string | null,
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const brand = await resolveAssistantPdfBrand("talantonimpact", "Talanton Impact");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 40;
  const usable = pageWidth - 80;
  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: organisationName ?? "Talanton Impact",
    title: analysis.documentTitle,
    subtitle: analysis.scopeLabel,
    metaRight: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });

  const { colors } = brand;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  const introLines = doc.splitTextToSize(analysis.intro, usable);
  doc.text(introLines, left, y);
  y += introLines.length * 12 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.muted);
  doc.text(
    `${analysis.storyCount} stories reviewed (${analysis.portfolioCount} portfolio, ${analysis.journeyCount} journey). Talanton Impact data only.`,
    left,
    y,
  );
  y += 18;

  for (let i = 0; i < analysis.lessons.length; i += 1) {
    const lesson = analysis.lessons[i]!;

    if (y > pageHeight - 120) {
      doc.addPage();
      y = 48;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.navy);
    doc.text(`Lesson ${i + 1}: ${lesson.title}`, left, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    const explLines = doc.splitTextToSize(lesson.explanation, usable);
    doc.text(explLines, left, y);
    y += explLines.length * 12 + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text("Supporting field evidence", left, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const ev of lesson.evidence) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 48;
      }
      doc.setTextColor(...colors.navy);
      const head = `${ev.storyTitle} — ${ev.company}`;
      const headLines = doc.splitTextToSize(head, usable);
      doc.text(headLines, left, y);
      y += headLines.length * 11;

      doc.setTextColor(...colors.text);
      const detailLines = doc.splitTextToSize(ev.detail, usable);
      doc.text(detailLines, left, y);
      y += detailLines.length * 11 + 8;
    }

    y += 6;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    drawAssistantPdfFooter(doc, brand, `Page ${p} of ${pages}`);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
