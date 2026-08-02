import { jsPDF } from "jspdf";

import {
  formatMemberIntelDate,
  formatMemberIntelGbp,
  type AbhiMemberIntelligenceDetail,
} from "@/lib/abhi/member-intelligence";

export function abhiRelationshipBriefPdfFileName(orgName: string) {
  const slug = orgName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `${slug}-Relationship-Brief.pdf`;
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineH = 5) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

export function buildAbhiRelationshipBriefPdf(
  detail: AbhiMemberIntelligenceDetail,
  generatedOn = new Date(),
): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const generated = generatedOn.toISOString().slice(0, 10);
  let y = 18;

  doc.setFillColor(0, 43, 92);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${detail.memberName} — Relationship Brief`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${generated} · ABHI Member Intelligence`, 14, 22);

  y = 40;
  doc.setTextColor(27, 36, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Member snapshot", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const snapshot = [
    `Member Name: ${detail.memberName}`,
    `Membership Type: ${detail.membershipType}`,
    `Member Since: ${formatMemberIntelDate(detail.memberSince)}`,
    `Revenue To Date: ${formatMemberIntelGbp(detail.revenueToDateGbp)}`,
    `Renewal Date: ${formatMemberIntelDate(detail.renewalDate)}`,
    `Engagement Score: ${detail.engagementScore}/100`,
    `Renewal Risk: ${detail.renewalRisk}`,
    `Account Manager: ${detail.accountManager}`,
  ];
  for (const line of snapshot) {
    doc.text(`• ${line}`, 16, y);
    y += 6;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Relationship summary", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = wrapText(doc, detail.insights.relationshipSummary, 14, y, pageW - 28);
  y += 3;
  y = wrapText(
    doc,
    `Recommended next action: ${detail.insights.recommendedNextAction}`,
    14,
    y,
    pageW - 28,
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Member health assessment", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Health Score: ${detail.insights.health.healthScore}`, 16, y);
  y += 6;
  doc.text(`Trend: ${detail.insights.health.trend}`, 16, y);
  y += 6;
  doc.text(`Risk Level: ${detail.insights.health.riskLevel}`, 16, y);
  y += 6;
  doc.text("Reasoning:", 16, y);
  y += 6;
  for (const reason of detail.insights.health.reasoning) {
    doc.text(`• ${reason}`, 18, y);
    y += 5.5;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Renewal assessment", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Renewal Probability: ${detail.insights.renewal.renewalProbability}%`, 16, y);
  y += 6;
  doc.text(`Confidence: ${detail.insights.renewal.confidence}`, 16, y);
  y += 6;
  doc.text("Key Drivers:", 16, y);
  y += 6;
  for (const driver of detail.insights.renewal.drivers) {
    doc.text(`• ${driver}`, 18, y);
    y += 5.5;
  }
  y += 2;
  y = wrapText(doc, detail.insights.renewal.summary, 14, y, pageW - 28);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recommended actions", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  detail.insights.recommendedActions.forEach((action, index) => {
    y = wrapText(doc, `${index + 1}. ${action}`, 16, y, pageW - 30);
    y += 1;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Next best actions", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  detail.insights.nextBestActions.forEach((action, index) => {
    y = wrapText(doc, `${index + 1}. ${action}`, 16, y, pageW - 30);
    y += 1;
  });

  return new Uint8Array(doc.output("arraybuffer"));
}

/** Browser helper — triggers a PDF download. */
export function downloadAbhiRelationshipBriefPdf(detail: AbhiMemberIntelligenceDetail) {
  const bytes = buildAbhiRelationshipBriefPdf(detail);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = abhiRelationshipBriefPdfFileName(detail.memberName);
  anchor.click();
  URL.revokeObjectURL(url);
}
