import { jsPDF } from "jspdf";

import {
  formatFundingGbp,
  type AbhiFundingDashboard,
} from "@/lib/abhi/member-funding-data";

export function abhiFundingBriefPdfFileName(orgName: string) {
  const slug = orgName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `${slug}-Funding-Brief.pdf`;
}

export function buildAbhiFundingBriefPdf(dashboard: AbhiFundingDashboard): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFillColor(0, 43, 92);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${dashboard.profile.organisationName} Funding Brief`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${dashboard.refreshedAt} · ABHI Member Benefit`, 14, 22);

  y = 40;
  doc.setTextColor(27, 36, 48);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Executive summary", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = [
    `High match opportunities: ${dashboard.highMatchCount}`,
    `Potential funding: ${formatFundingGbp(dashboard.potentialFundingGbp)}`,
    `Open opportunities: ${dashboard.openCount}`,
    `Closing within 30 days: ${dashboard.closingWithin30Days}`,
  ];
  for (const line of lines) {
    doc.text(`• ${line}`, 16, y);
    y += 6;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recommended actions", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  dashboard.topHighlights.forEach((opp, index) => {
    doc.text(
      `${index + 1}. ${opp.programme} — ${opp.matchScore}% match · closes ${opp.closesOn}`,
      16,
      y,
    );
    y += 6;
    doc.setTextColor(91, 101, 119);
    doc.text(`   ${opp.awardingBody} · ${opp.fundingAmountLabel}`, 16, y);
    doc.setTextColor(27, 36, 48);
    y += 7;
  });

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Organisation profile (matching basis)", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const profileLines = [
    `Type: ${dashboard.profile.organisationType}`,
    `Industry: ${dashboard.profile.industry}`,
    `Sector: ${dashboard.profile.sector}`,
    `Capabilities: ${dashboard.profile.capabilities.join(", ")}`,
    `University collaboration: ${dashboard.profile.universityCollaboration ? "Yes" : "No"}`,
    `NHS collaboration: ${dashboard.profile.nhsCollaboration ? "Yes" : "No"}`,
  ];
  for (const line of profileLines) {
    doc.text(`• ${line}`, 16, y);
    y += 6;
  }

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(91, 101, 119);
  doc.text(
    "Sources refreshed daily from Innovate UK, SBRI Healthcare, NIHR, UKRI, Horizon Europe, Wellcome, LifeArc.",
    14,
    y,
  );

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
