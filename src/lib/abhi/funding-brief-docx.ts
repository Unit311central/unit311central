import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import {
  formatFundingGbp,
  type AbhiFundingDashboard,
} from "@/lib/abhi/member-funding-data";

export function abhiFundingBriefDocxFileName(orgName: string) {
  const slug = orgName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `${slug}-Funding-Brief.docx`;
}

export async function buildAbhiFundingBriefDocx(
  dashboard: AbhiFundingDashboard,
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `${dashboard.profile.organisationName} Funding Brief`,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${dashboard.refreshedAt} · ABHI Member Benefit`,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Executive summary",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph(`High match opportunities: ${dashboard.highMatchCount}`),
          new Paragraph(
            `Potential funding: ${formatFundingGbp(dashboard.potentialFundingGbp)}`,
          ),
          new Paragraph(`Open opportunities: ${dashboard.openCount}`),
          new Paragraph(`Closing within 30 days: ${dashboard.closingWithin30Days}`),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Recommended actions",
            heading: HeadingLevel.HEADING_1,
          }),
          ...dashboard.topHighlights.map(
            (opp, index) =>
              new Paragraph(
                `${index + 1}. ${opp.programme} — ${opp.matchScore}% match · ${opp.awardingBody} · closes ${opp.closesOn}`,
              ),
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Organisation profile",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph(`Industry: ${dashboard.profile.industry}`),
          new Paragraph(`Sector: ${dashboard.profile.sector}`),
          new Paragraph(
            `Capabilities: ${dashboard.profile.capabilities.join(", ")}`,
          ),
          new Paragraph(
            `University collaboration: ${dashboard.profile.universityCollaboration ? "Yes" : "No"}`,
          ),
          new Paragraph(
            `NHS collaboration: ${dashboard.profile.nhsCollaboration ? "Yes" : "No"}`,
          ),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
