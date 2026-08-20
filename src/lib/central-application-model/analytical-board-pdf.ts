/**
 * Analytical board / executive PDF composed from gathered evidence.
 */

import { jsPDF } from "jspdf";

import {
  createArtifactId,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  drawAssistantPdfFooter,
  drawAssistantPdfHeader,
  resolveAssistantPdfBrand,
} from "@/lib/ai-operating-assistant/pdf-brand";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { EvidenceSnapshot } from "./evidence-snapshot";
import { formatMoney } from "./evidence-snapshot";

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((line, index) => doc.text(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function section(
  doc: jsPDF,
  y: number,
  left: number,
  usable: number,
  heading: string,
  bullets: string[],
  lineHeight: number,
  pageHeight: number,
  brand: Awaited<ReturnType<typeof resolveAssistantPdfBrand>>,
  title: string,
) {
  const ensureSpace = (need: number) => {
    if (y + need > pageHeight - 56) {
      drawAssistantPdfFooter(doc, brand, title);
      doc.addPage();
      y = 48;
    }
    return y;
  };

  y = ensureSpace(28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(heading, left, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const bullet of bullets) {
    y = ensureSpace(20);
    y = wrapText(doc, `• ${bullet}`, left, y, usable - 12, lineHeight) + 4;
  }
  return y + 8;
}

export async function renderAnalyticalBoardPdf(input: {
  business: AssistantBusinessContext;
  message: string;
  snapshot: EvidenceSnapshot;
  findings: string[];
  risks: string[];
  implications: string[];
  recommendations: string[];
}): Promise<import("@/lib/ai-operating-assistant/artifact-store").AssistantStoredArtifact> {
  const brand = await resolveAssistantPdfBrand(input.business.workspace.slug);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 40;
  const usable = pageWidth - 80;
  const lineHeight = 14;
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const title = "Board Analytical Report";

  let y = drawAssistantPdfHeader(doc, brand, {
    organisationName: input.business.organisation.name,
    title,
    subtitle: "Evidence-based management briefing",
    metaRight: dateLabel,
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  y = wrapText(doc, `Request: ${input.message.slice(0, 280)}`, left, y + 8, usable, lineHeight) + 12;

  const evidenceBullets: string[] = [];
  if (input.snapshot.cash !== undefined) evidenceBullets.push(`Cash: ${formatMoney(input.snapshot.cash)}`);
  if (input.snapshot.runwayMonths !== undefined) {
    evidenceBullets.push(`Runway: ~${input.snapshot.runwayMonths.toFixed(1)} months`);
  }
  if (input.snapshot.revenueLatest !== undefined) {
    evidenceBullets.push(`Latest revenue month: ${formatMoney(input.snapshot.revenueLatest)}`);
  }
  if (input.snapshot.expensesLatest !== undefined) {
    evidenceBullets.push(`Latest expenses month: ${formatMoney(input.snapshot.expensesLatest)}`);
  }
  if (input.snapshot.headcount !== undefined) evidenceBullets.push(`Headcount: ${input.snapshot.headcount}`);
  if (input.snapshot.pipelineValue !== undefined) {
    evidenceBullets.push(`Pipeline value: ${formatMoney(input.snapshot.pipelineValue)}`);
  }
  if (input.snapshot.overdueInvoiceCount) {
    evidenceBullets.push(
      `Overdue invoices: ${input.snapshot.overdueInvoiceCount}${input.snapshot.overdueInvoiceTotal ? ` (${formatMoney(input.snapshot.overdueInvoiceTotal)})` : ""}`,
    );
  }

  const trends: string[] = [];
  for (const series of input.snapshot.chartSeries.slice(0, 3)) {
    if (series.data.length >= 2) {
      const first = series.data[0];
      const last = series.data[series.data.length - 1];
      const direction = last > first ? "up" : last < first ? "down" : "flat";
      trends.push(`${series.label} trend is ${direction} over the selected period.`);
    }
  }
  if (!trends.length) trends.push("Trend lines derived from authorised chart evidence where available.");

  y = section(doc, y, left, usable, "Findings", input.findings.length ? input.findings : ["No findings extracted."], lineHeight, pageHeight, brand, title);
  y = section(
    doc,
    y,
    left,
    usable,
    "Key risks",
    input.risks.length ? input.risks : ["No acute risk flags in authorised live evidence."],
    lineHeight,
    pageHeight,
    brand,
    title,
  );
  y = section(
    doc,
    y,
    left,
    usable,
    "Supporting evidence",
    evidenceBullets.length ? evidenceBullets : ["Limited live evidence returned for this workspace."],
    lineHeight,
    pageHeight,
    brand,
    title,
  );
  y = section(doc, y, left, usable, "Trends", trends, lineHeight, pageHeight, brand, title);
  y = section(doc, y, left, usable, "Management implications", input.implications, lineHeight, pageHeight, brand, title);
  y = section(doc, y, left, usable, "Recommended actions", input.recommendations, lineHeight, pageHeight, brand, title);

  if (input.snapshot.limitations.length) {
    y = section(doc, y, left, usable, "Limitations", input.snapshot.limitations, lineHeight, pageHeight, brand, title);
  }

  drawAssistantPdfFooter(doc, brand, title);

  const filename = `board-analytical-report-${dateLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const id = createArtifactId();
  return putAssistantArtifact({
    id,
    kind: "pdf",
    title,
    filename,
    mimeType: "application/pdf",
    bytes,
    userId: input.business.user.id,
    meta: {
      generatedAt: new Date().toISOString(),
      reportType: "analytical_board",
    },
  });
}
