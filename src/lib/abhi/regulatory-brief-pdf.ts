import { jsPDF } from "jspdf";

import {
  formatRegulatoryDate,
  type AbhiRegulatoryDashboard,
  type AbhiRegulatoryExportKind,
  type AbhiRegulatoryImpactAssessment,
  type AbhiRegulatoryUpdate,
} from "@/lib/abhi/regulatory-intelligence";

export function abhiRegulatoryPdfFileName(kind: AbhiRegulatoryExportKind) {
  const stamp = new Date().toISOString().slice(0, 10);
  switch (kind) {
    case "member-impact":
      return `ABHI-Member-Impact-Report-${stamp}.pdf`;
    case "working-group":
      return `ABHI-Working-Group-Briefing-${stamp}.pdf`;
    case "board-summary":
      return `ABHI-Board-Regulatory-Summary-${stamp}.pdf`;
    default:
      return `ABHI-Regulatory-Briefing-${stamp}.pdf`;
  }
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH = 5) {
  const lines = doc.splitTextToSize(text, maxW) as string[];
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

function titleFor(kind: AbhiRegulatoryExportKind) {
  switch (kind) {
    case "member-impact":
      return "Member Impact Report";
    case "working-group":
      return "Working Group Briefing";
    case "board-summary":
      return "Board Regulatory Summary";
    default:
      return "Regulatory Briefing";
  }
}

export function buildAbhiRegulatoryPdf(
  kind: AbhiRegulatoryExportKind,
  dashboard: AbhiRegulatoryDashboard,
  focusUpdateId?: string,
): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const update: AbhiRegulatoryUpdate =
    dashboard.updates.find((u) => u.id === focusUpdateId) ??
    dashboard.updates.find((u) => u.id === dashboard.todaysBrief.updateId) ??
    dashboard.updates[0]!;
  const assessment: AbhiRegulatoryImpactAssessment =
    dashboard.assessments.find((a) => a.updateId === update.id) ?? dashboard.assessments[0]!;

  let y = 18;
  doc.setFillColor(0, 43, 92);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`ABHI ${titleFor(kind)}`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${dashboard.refreshedAt} · Regulatory Intelligence`, 14, 22);

  y = 40;
  doc.setTextColor(27, 36, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("What changed", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = wrap(doc, update.title, 14, y, pageW - 28);
  y = wrap(
    doc,
    `${update.sourceName} · ${formatRegulatoryDate(update.publicationDate)} · ${update.severity} · ${update.status}`,
    14,
    y,
    pageW - 28,
  );
  y += 2;
  y = wrap(doc, update.summary, 14, y, pageW - 28);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Why it matters", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = wrap(doc, assessment.whyItMatters, 14, y, pageW - 28);
  y = wrap(doc, assessment.summary, 14, y, pageW - 28);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Members affected", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const memberSlice =
    kind === "board-summary"
      ? assessment.strategicMembers.slice(0, 8)
      : assessment.affectedMembers.slice(0, 12);
  for (const member of memberSlice) {
    y = wrap(
      doc,
      `• ${member.memberName} (${member.matchScore}% match${member.highImpact ? ", high impact" : ""})`,
      16,
      y,
      pageW - 30,
    );
  }
  if (memberSlice.length === 0) {
    y = wrap(doc, "• No high-confidence member matches in the current portfolio snapshot.", 16, y, pageW - 30);
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(kind === "working-group" ? "Working group actions" : "Recommended ABHI actions", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const actions =
    kind === "working-group"
      ? [
          "Brief Diagnostics Working Group at next meeting",
          "Circulate consultation summary to Digital Health Working Group",
          ...assessment.recommendedActions.slice(0, 2),
        ]
      : assessment.recommendedActions;
  actions.forEach((action, index) => {
    y = wrap(doc, `${index + 1}. ${action}`, 16, y, pageW - 30);
  });

  if (kind === "board-summary") {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Board snapshot", 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = [
      `Open regulatory changes: ${dashboard.openRegulatoryChanges}`,
      `High impact updates: ${dashboard.highImpactUpdates}`,
      `Members potentially affected: ${dashboard.membersPotentiallyAffected}`,
      `Pending impact assessments: ${dashboard.pendingImpactAssessments}`,
    ];
    for (const line of lines) {
      doc.text(`• ${line}`, 16, y);
      y += 6;
    }
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

export function downloadAbhiRegulatoryPdf(
  kind: AbhiRegulatoryExportKind,
  dashboard: AbhiRegulatoryDashboard,
  focusUpdateId?: string,
) {
  const bytes = buildAbhiRegulatoryPdf(kind, dashboard, focusUpdateId);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = abhiRegulatoryPdfFileName(kind);
  anchor.click();
  URL.revokeObjectURL(url);
}
