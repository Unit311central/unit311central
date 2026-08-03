/**
 * Client-side PDF export for Talanton Quarterly Portfolio Update.
 * Portrait A4, Talanton green/white branding — not a board deck.
 */

import { jsPDF } from "jspdf";

import { formatUsd } from "@/lib/talanton/portfolio-data";
import {
  periodLabel,
  type QuarterlyPortfolioUpdate,
} from "@/lib/talanton/quarterly-portfolio-update-store";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const GREEN: [number, number, number] = [27, 138, 90];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [71, 85, 105];
const SOFT: [number, number, number] = [247, 252, 249];
const WHITE: [number, number, number] = [255, 255, 255];
const HEADER_H = 18;

const LOGO_CANDIDATES = [
  "/images/workspaces/talantonimpact-t.jpg",
  "/images/workspaces/talantonimpact-logo.png",
] as const;

async function loadLogoDataUrl(): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
  for (const src of LOGO_CANDIDATES) {
    try {
      const res = await fetch(src);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      const format = src.toLowerCase().endsWith(".png") ? "PNG" : "JPEG";
      return { dataUrl, format };
    } catch {
      // try next
    }
  }
  return null;
}

function wrap(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function drawPageChrome(
  doc: jsPDF,
  page: number,
  total: number,
  title: string,
  logo: { dataUrl: string; format: "JPEG" | "PNG" } | null,
) {
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  if (logo) {
    const h = 8;
    const w = logo.format === "JPEG" ? h * 1.2 : h * 5.5;
    try {
      doc.addImage(logo.dataUrl, logo.format, MARGIN, (HEADER_H - h) / 2, w, h);
    } catch {
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TALANTON", MARGIN, 12);
    }
  } else {
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TALANTON", MARGIN, 12);
  }

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Page ${page} of ${total}  ·  ${title}`, PAGE_W - MARGIN, 11.5, { align: "right" });

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("Talanton Impact · Quarterly Portfolio Update", MARGIN, PAGE_H - 5);
}

function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineH = 4.5,
) {
  const lines = wrap(doc, text, maxWidth);
  for (const line of lines) {
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function kpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
) {
  doc.setFillColor(...SOFT);
  doc.setDrawColor(27, 138, 90);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x + 3, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(value, x + 3, y + 13);
}

function sectionHeading(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(title, MARGIN, y);
  return y + 8;
}

function subHeading(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  doc.text(title, MARGIN, y);
  return y + 5;
}

function bulletList(doc: jsPDF, items: string[], y: number, max = 6) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  for (const item of items.slice(0, max)) {
    const lines = wrap(doc, `•  ${item}`, CONTENT_W);
    for (const line of lines) {
      doc.text(line, MARGIN, y);
      y += 4.4;
    }
    y += 1;
  }
  return y;
}

export function quarterlyUpdatePdfFileName(report: QuarterlyPortfolioUpdate) {
  const period = periodLabel(report.period).replace(/\s+/g, "-");
  return `Talanton-Quarterly-Portfolio-Update-${period}.pdf`;
}

export async function buildQuarterlyPortfolioUpdatePdfBlob(
  report: QuarterlyPortfolioUpdate,
): Promise<Blob> {
  const logo = await loadLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const period = periodLabel(report.period);
  const totalLogical = 12;

  // —— Page 1: Cover ——
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  if (logo) {
    try {
      const h = 14;
      const w = logo.format === "JPEG" ? h * 1.2 : h * 5.5;
      doc.addImage(logo.dataUrl, logo.format, MARGIN, 28, w, h);
    } catch {
      /* wordmark fallback below */
    }
  }
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("TALANTON IMPACT", MARGIN, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  const coverLines = wrap(doc, "Talanton Quarterly Portfolio Update", CONTENT_W);
  let cy = 72;
  for (const line of coverLines) {
    doc.text(line, MARGIN, cy);
    cy += 12;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.text(period, MARGIN, cy + 8);
  doc.setFontSize(10);
  doc.setTextColor(220, 245, 230);
  cy = writeWrapped(
    doc,
    "Portfolio performance, impact, and progress for management, board, and investment committee.",
    MARGIN,
    cy + 20,
    CONTENT_W,
    5,
  );
  doc.setFontSize(8);
  doc.text(`Generated ${new Date(report.updatedAt).toLocaleDateString("en-GB")}`, MARGIN, PAGE_H - 20);
  doc.text("Not a board deck · Portfolio reporting", MARGIN, PAGE_H - 14);

  // —— Page 2: Glance ——
  doc.addPage();
  drawPageChrome(doc, 2, totalLogical, "Quarter At A Glance", logo);
  let y = sectionHeading(doc, "Quarter At A Glance", HEADER_H + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${period} · Executive KPI summary`, MARGIN, y);
  y += 8;

  const cards: Array<[string, string]> = [
    ["Portfolio Companies", String(report.glance.portfolioCompanies)],
    ["Countries Active", String(report.glance.countriesActive)],
    ["Capital Raised", formatUsd(report.glance.capitalRaisedUsd)],
    ["Capital Deployed", formatUsd(report.glance.capitalDeployedUsd)],
    ["People Served", report.glance.peopleServed.toLocaleString()],
    ["Jobs Created", report.glance.jobsCreated.toLocaleString()],
    ["New Investments", String(report.glance.newInvestments)],
    ["Impact Health", `${report.glance.impactHealthScore}/100`],
  ];
  const cardW = (CONTENT_W - 6) / 2;
  const cardH = 18;
  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    kpiCard(doc, MARGIN + col * (cardW + 6), y + row * (cardH + 4), cardW, cardH, c[0], c[1]);
  });

  // —— Page 3: Commentary ——
  doc.addPage();
  drawPageChrome(doc, 3, totalLogical, "Executive Commentary", logo);
  y = sectionHeading(doc, "Executive Commentary", HEADER_H + 14);
  const commentaryBlocks: Array<[string, string]> = [
    ["Quarter Overview", report.commentary.quarterOverview],
    ["Major Developments", report.commentary.majorDevelopments],
    ["Key Achievements", report.commentary.keyAchievements],
    ["Areas of Focus", report.commentary.areasOfFocus],
  ];
  for (const [heading, body] of commentaryBlocks) {
    y = subHeading(doc, heading, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    y = writeWrapped(doc, body, MARGIN, y, CONTENT_W, 4.4);
    y += 6;
  }

  // —— Page 4: Footprint ——
  doc.addPage();
  drawPageChrome(doc, 4, totalLogical, "Portfolio Footprint", logo);
  y = sectionHeading(doc, "Portfolio Footprint", HEADER_H + 14);
  y = subHeading(doc, "Distribution by country", y);
  for (const c of report.footprint.byCountry.slice(0, 8)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${c.label}  ·  ${c.value} companies (${c.pct}%)`, MARGIN, y);
    y += 5;
  }
  y += 4;
  y = subHeading(doc, "Distribution by sector", y);
  for (const c of report.footprint.bySector.slice(0, 8)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${c.label}  ·  ${c.value} (${c.pct}%)`, MARGIN, y);
    y += 5;
  }
  y += 6;
  y = subHeading(doc, "Company directory (excerpt)", y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Company", MARGIN, y);
  doc.text("Country", MARGIN + 70, y);
  doc.text("Employees", MARGIN + 110, y);
  doc.text("Revenue", MARGIN + 140, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  for (const row of report.footprint.rows.slice(0, 16)) {
    if (y > PAGE_H - 16) break;
    doc.text(row.companyName.slice(0, 28), MARGIN, y);
    doc.text(row.country, MARGIN + 70, y);
    doc.text(String(row.employees), MARGIN + 110, y);
    doc.text(formatUsd(row.revenueUsd), MARGIN + 140, y);
    y += 4.5;
  }

  // —— Page 5: Performance ——
  doc.addPage();
  drawPageChrome(doc, 5, totalLogical, "Portfolio Performance", logo);
  y = sectionHeading(doc, "Portfolio Performance", HEADER_H + 14);
  const perf: Array<[string, string]> = [
    ["Portfolio Revenue", formatUsd(report.performance.portfolioRevenueUsd)],
    ["Revenue Growth", `${report.performance.revenueGrowthPct}%`],
    ["Employee Growth", `${report.performance.employeeGrowthPct}%`],
    ["Capital Raised", formatUsd(report.performance.capitalRaisedUsd)],
    ["Capital Deployed", formatUsd(report.performance.capitalDeployedUsd)],
  ];
  perf.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    if (i < 4) {
      kpiCard(doc, MARGIN + col * (cardW + 6), y + row * (cardH + 4), cardW, cardH, c[0], c[1]);
    } else {
      kpiCard(doc, MARGIN, y + 2 * (cardH + 4), cardW, cardH, c[0], c[1]);
    }
  });
  y += 3 * (cardH + 4) + 6;
  y = subHeading(doc, "Revenue trend", y);
  for (const t of report.performance.revenueTrend) {
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${t.label}: ${formatUsd(t.value)}`, MARGIN, y);
    y += 5;
  }
  y += 4;
  y = subHeading(doc, "Employee trend", y);
  for (const t of report.performance.employeeTrend) {
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${t.label}: ${t.value.toLocaleString()}`, MARGIN, y);
    y += 5;
  }

  // —— Page 6: Impact ——
  doc.addPage();
  drawPageChrome(doc, 6, totalLogical, "Impact Overview", logo);
  y = sectionHeading(doc, "Impact Overview", HEADER_H + 14);
  const impactCards: Array<[string, string]> = [
    ["People Served", report.impact.peopleServed.toLocaleString()],
    ["Jobs Created", report.impact.jobsCreated.toLocaleString()],
    ["Jobs Retained", report.impact.jobsRetained.toLocaleString()],
    ["Women Impacted", report.impact.womenImpacted.toLocaleString()],
    ["Youth Impacted", report.impact.youthImpacted.toLocaleString()],
    ["Communities", report.impact.communitiesReached.toLocaleString()],
  ];
  impactCards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    kpiCard(doc, MARGIN + col * (cardW + 6), y + row * (cardH + 4), cardW, cardH, c[0], c[1]);
  });
  y += 3 * (cardH + 4) + 8;
  y = subHeading(doc, "Impact narrative", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  y = writeWrapped(doc, report.impact.narrative, MARGIN, y, CONTENT_W, 4.4);

  // —— Page 7: Featured story ——
  doc.addPage();
  drawPageChrome(doc, 7, totalLogical, "Featured Impact Story", logo);
  y = sectionHeading(doc, "Featured Impact Story", HEADER_H + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(report.featuredStory.companyName, MARGIN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(report.featuredStory.country, MARGIN, y);
  y += 8;
  for (const [h, body] of [
    ["Challenge", report.featuredStory.challenge],
    ["Solution", report.featuredStory.solution],
    ["Outcome", report.featuredStory.outcome],
    ["Why It Matters", report.featuredStory.whyItMatters],
  ] as const) {
    y = subHeading(doc, h, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    y = writeWrapped(doc, body, MARGIN, y, CONTENT_W, 4.4);
    y += 4;
  }

  // —— Page 8: Journeys ——
  doc.addPage();
  drawPageChrome(doc, 8, totalLogical, "Journey Highlights", logo);
  y = sectionHeading(doc, "Journey Highlights", HEADER_H + 14);
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Countries: ${report.journeys.countriesVisited.join(", ") || "—"}  ·  Companies: ${report.journeys.companiesVisited.length}`,
    MARGIN,
    y,
  );
  y += 8;
  for (const b of report.journeys.blocks.slice(0, 3)) {
    y = subHeading(doc, `${b.title} (${b.country})`, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    y = writeWrapped(doc, `Observations: ${b.observations}`, MARGIN, y, CONTENT_W, 4.2);
    y = writeWrapped(doc, `Opportunities: ${b.opportunities}`, MARGIN, y, CONTENT_W, 4.2);
    y = writeWrapped(doc, `Challenges: ${b.challenges}`, MARGIN, y, CONTENT_W, 4.2);
    y += 5;
  }

  // —— Page 9: Highlights ——
  doc.addPage();
  drawPageChrome(doc, 9, totalLogical, "Portfolio Highlights", logo);
  y = sectionHeading(doc, "Portfolio Highlights", HEADER_H + 14);
  for (const h of report.portfolioHighlights) {
    y = subHeading(doc, `${h.companyName} · ${h.kind}`, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${h.country} · ${h.sector}`, MARGIN, y);
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    y = writeWrapped(doc, h.milestone, MARGIN, y, CONTENT_W, 4.2);
    y += 5;
  }

  // —— Page 10: Capital ——
  doc.addPage();
  drawPageChrome(doc, 10, totalLogical, "New Investments & Capital", logo);
  y = sectionHeading(doc, "New Investments & Capital Deployment", HEADER_H + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  y = writeWrapped(doc, report.capital.deploymentNarrative, MARGIN, y, CONTENT_W, 4.4);
  y += 6;
  y = subHeading(doc, "New portfolio companies", y);
  y = bulletList(doc, report.capital.newCompanies, y);
  y += 3;
  y = subHeading(doc, "Additional investments", y);
  y = bulletList(doc, report.capital.additionalInvestments, y);
  y += 4;
  y = subHeading(doc, "Sector allocation", y);
  for (const s of report.capital.sectorAllocation.slice(0, 6)) {
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${s.label}: ${s.pct}%`, MARGIN, y);
    y += 4.5;
  }
  y += 3;
  y = subHeading(doc, "Country allocation", y);
  for (const s of report.capital.countryAllocation.slice(0, 6)) {
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${s.label}: ${s.pct}%`, MARGIN, y);
    y += 4.5;
  }

  // —— Page 11: Opportunity ——
  doc.addPage();
  drawPageChrome(doc, 11, totalLogical, "Opportunity Intelligence", logo);
  y = sectionHeading(doc, "Opportunity Intelligence", HEADER_H + 14);
  y = subHeading(doc, "Emerging Opportunities", y);
  y = bulletList(doc, report.opportunity.emerging, y);
  y += 3;
  y = subHeading(doc, "Growth Opportunities", y);
  y = bulletList(doc, report.opportunity.growth, y, 4);
  y += 3;
  y = subHeading(doc, "Strategic Opportunities", y);
  y = bulletList(doc, report.opportunity.strategic, y, 4);
  y += 3;
  y = subHeading(doc, "Market Trends", y);
  y = bulletList(doc, report.opportunity.marketTrends, y, 4);
  y += 4;
  y = subHeading(doc, "AI commentary", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  writeWrapped(doc, report.opportunity.aiCommentary.replace(/\n/g, " · "), MARGIN, y, CONTENT_W, 4.3);

  // —— Page 12: Looking Ahead ——
  doc.addPage();
  drawPageChrome(doc, 12, totalLogical, "Looking Ahead", logo);
  y = sectionHeading(doc, "Looking Ahead", HEADER_H + 14);
  y = subHeading(doc, "Next Quarter Priorities", y);
  y = bulletList(doc, report.lookingAhead.nextQuarterPriorities, y);
  y += 3;
  y = subHeading(doc, "Portfolio Focus Areas", y);
  y = bulletList(doc, report.lookingAhead.portfolioFocusAreas, y);
  y += 3;
  y = subHeading(doc, "Growth Priorities", y);
  y = bulletList(doc, report.lookingAhead.growthPriorities, y);
  y += 3;
  y = subHeading(doc, "Impact Priorities", y);
  y = bulletList(doc, report.lookingAhead.impactPriorities, y);
  y += 6;
  y = subHeading(doc, "Closing summary", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  writeWrapped(doc, report.lookingAhead.closingSummary.replace(/\n/g, " "), MARGIN, y, CONTENT_W, 4.4);

  return doc.output("blob");
}

export async function downloadQuarterlyPortfolioUpdatePdf(report: QuarterlyPortfolioUpdate) {
  if (typeof window === "undefined") return;
  const blob = await buildQuarterlyPortfolioUpdatePdfBlob(report);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = quarterlyUpdatePdfFileName(report);
  a.click();
  URL.revokeObjectURL(url);
}
