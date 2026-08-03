/**
 * Talanton Quarterly Portfolio Update PDF — portrait A4 executive publication.
 * Visual language aligned with ABHI board pack quality (light paper, clean chrome)
 * using Talanton green accent. Not a board deck.
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
const FOOTER_H = 10;

const C = {
  green: [27, 138, 90] as const,
  page: [255, 255, 255] as const,
  soft: [245, 248, 246] as const,
  line: [220, 228, 223] as const,
  text: [27, 36, 48] as const,
  muted: [91, 101, 119] as const,
  white: [255, 255, 255] as const,
};

async function loadLogoDataUrl(): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
  try {
    const res = await fetch("/images/workspaces/talantonimpact-logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format: "PNG" };
  } catch {
    return null;
  }
}

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function wrap(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function drawLogoPlate(
  doc: jsPDF,
  logo: { dataUrl: string; format: "JPEG" | "PNG" } | null,
  x: number,
  y: number,
) {
  const plateW = 42;
  const plateH = 12;
  setFill(doc, C.green);
  doc.roundedRect(x, y, plateW, plateH, 1.5, 1.5, "F");
  if (logo) {
    try {
      const h = 7;
      const w = h * (1853 / 320);
      doc.addImage(logo.dataUrl, logo.format, x + 3, y + (plateH - h) / 2, Math.min(w, plateW - 6), h);
      return;
    } catch {
      // fall through
    }
  }
  setText(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TALANTON", x + 4, y + 7.5);
}

function drawContentChrome(
  doc: jsPDF,
  title: string,
  page: number,
  total: number,
  logo: { dataUrl: string; format: "JPEG" | "PNG" } | null,
) {
  setFill(doc, C.page);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  drawLogoPlate(doc, logo, MARGIN, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(doc, C.green);
  doc.text(title, MARGIN, 32);

  setDraw(doc, C.line);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, 36, PAGE_W - MARGIN, 36);

  setFill(doc, C.green);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, C.white);
  doc.text("Talanton Quarterly Portfolio Update", MARGIN, PAGE_H - 3.5);
  doc.text(`Page ${page} of ${total}`, PAGE_W - MARGIN, PAGE_H - 3.5, { align: "right" });
}

function writeLines(
  doc: jsPDF,
  lines: string[],
  x: number,
  y: number,
  maxWidth: number,
  lineH = 5,
) {
  let cursor = y;
  for (const raw of lines) {
    const wrapped = wrap(doc, raw, maxWidth);
    for (const line of wrapped) {
      doc.text(line, x, cursor);
      cursor += lineH;
    }
    cursor += 1.5;
  }
  return cursor;
}

function sectionHeading(doc: jsPDF, label: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.green);
  doc.text(label, MARGIN, y);
  return y + 7;
}

function bulletBlock(doc: jsPDF, items: string[], y: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.text);
  let cursor = y;
  for (const item of items) {
    const lines = wrap(doc, `•  ${item}`, CONTENT_W);
    for (const line of lines) {
      doc.text(line, MARGIN, cursor);
      cursor += 5;
    }
    cursor += 1.2;
  }
  return cursor;
}

function metricRow(
  doc: jsPDF,
  y: number,
  items: Array<{ label: string; value: string }>,
) {
  const colW = CONTENT_W / items.length;
  items.forEach((item, i) => {
    const x = MARGIN + i * colW;
    setFill(doc, C.soft);
    doc.roundedRect(x, y, colW - 3, 22, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.muted);
    doc.text(item.label.toUpperCase(), x + 3, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setText(doc, C.green);
    doc.text(item.value, x + 3, y + 16);
  });
  return y + 28;
}

function barChart(
  doc: jsPDF,
  y: number,
  title: string,
  points: Array<{ label: string; value: number }>,
  formatValue: (n: number) => string,
) {
  let cursor = sectionHeading(doc, title, y);
  const max = Math.max(...points.map((p) => p.value), 1);
  const barMax = CONTENT_W - 55;
  for (const p of points.slice(0, 6)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.text);
    doc.text(p.label.slice(0, 28), MARGIN, cursor + 3.5);
    setFill(doc, C.soft);
    doc.roundedRect(MARGIN + 52, cursor, barMax, 5, 1, 1, "F");
    setFill(doc, C.green);
    doc.roundedRect(MARGIN + 52, cursor, Math.max(2, (p.value / max) * barMax), 5, 1, 1, "F");
    setText(doc, C.muted);
    doc.setFontSize(8);
    doc.text(formatValue(p.value), PAGE_W - MARGIN, cursor + 3.5, { align: "right" });
    cursor += 9;
  }
  return cursor + 4;
}

async function paintCover(
  doc: jsPDF,
  report: QuarterlyPortfolioUpdate,
  logo: { dataUrl: string; format: "JPEG" | "PNG" } | null,
) {
  setFill(doc, C.page);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  drawLogoPlate(doc, logo, MARGIN, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setText(doc, C.green);
  const titleLines = wrap(doc, "Talanton Quarterly Portfolio Update", CONTENT_W - 10);
  let y = 55;
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setText(doc, C.text);
  doc.text(periodLabel(report.period), MARGIN, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.muted);
  doc.text(`Report Date  ·  ${report.reportDate}`, MARGIN, y + 22);

  // Large professional image band
  const imgY = y + 36;
  const imgH = PAGE_H - imgY - 24;
  setFill(doc, C.soft);
  doc.roundedRect(MARGIN, imgY, CONTENT_W, imgH, 2, 2, "F");
  try {
    const res = await fetch(report.heroImageUrl);
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      doc.addImage(dataUrl, "JPEG", MARGIN, imgY, CONTENT_W, imgH);
    }
  } catch {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setText(doc, C.muted);
    doc.text("Portfolio field photography", MARGIN + 8, imgY + imgH / 2);
  }
}

export async function downloadQuarterlyPortfolioUpdatePdf(
  report: QuarterlyPortfolioUpdate,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLogoDataUrl();
  const total = 12;
  const period = periodLabel(report.period);

  // 1 Cover
  await paintCover(doc, report, logo);

  // 2 Executive Summary
  doc.addPage();
  drawContentChrome(doc, "Executive Summary", 2, total, logo);
  let y = 44;
  y = sectionHeading(doc, "Quarter Highlights", y);
  y = bulletBlock(doc, report.executiveSummary.quarterHighlights, y) + 3;
  y = sectionHeading(doc, "Key Portfolio Developments", y);
  y = bulletBlock(doc, report.executiveSummary.keyPortfolioDevelopments, y) + 3;
  y = sectionHeading(doc, "Key Impact Achievements", y);
  y = bulletBlock(doc, report.executiveSummary.keyImpactAchievements, y) + 3;
  y = sectionHeading(doc, "Portfolio Focus Areas", y);
  y = bulletBlock(doc, report.executiveSummary.portfolioFocusAreas, y) + 3;
  y = sectionHeading(doc, "Looking Ahead", y);
  bulletBlock(doc, report.executiveSummary.lookingAhead, y);

  // 3 Portfolio Overview
  doc.addPage();
  drawContentChrome(doc, "Portfolio Overview", 3, total, logo);
  y = 44;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.muted);
  doc.text("Active Talanton portfolio companies — introduction to the holdings.", MARGIN, y);
  y += 8;

  setFill(doc, C.green);
  doc.rect(MARGIN, y, CONTENT_W, 8, "F");
  setText(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Company", MARGIN + 2, y + 5.5);
  doc.text("Country", MARGIN + 58, y + 5.5);
  doc.text("Sector", MARGIN + 88, y + 5.5);
  doc.text("What They Do", MARGIN + 128, y + 5.5);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  for (const row of report.portfolioOverview.rows) {
    if (y > PAGE_H - 28) break;
    setFill(doc, C.soft);
    doc.rect(MARGIN, y - 3.5, CONTENT_W, 9, "F");
    setText(doc, C.text);
    doc.setFont("helvetica", "bold");
    doc.text(row.companyName.slice(0, 28), MARGIN + 2, y + 2);
    doc.setFont("helvetica", "normal");
    setText(doc, C.muted);
    doc.text(row.country.slice(0, 14), MARGIN + 58, y + 2);
    doc.text(row.sector.slice(0, 22), MARGIN + 88, y + 2);
    const what = wrap(doc, row.whatTheyDo, 58);
    doc.text(what[0] ?? "", MARGIN + 128, y + 2);
    y += 9.5;
  }

  // 4 Portfolio Performance
  doc.addPage();
  drawContentChrome(doc, "Portfolio Performance", 4, total, logo);
  y = 44;
  y = metricRow(doc, y, [
    { label: "Revenue Growth", value: `${report.performance.revenueGrowthPct}%` },
    { label: "Employment Growth", value: `${report.performance.employmentGrowthPct}%` },
    {
      label: "New Customers Served",
      value: report.performance.newCustomersServed.toLocaleString(),
    },
    {
      label: "Capital Invested",
      value: formatUsd(report.performance.capitalRaisedByPortfolioUsd),
    },
  ]);
  y = barChart(doc, y + 2, "Revenue by Sector", report.performance.revenueBySector, formatUsd);
  barChart(doc, y, "Employment by Country", report.performance.employmentByCountry, (n) =>
    n.toLocaleString(),
  );

  // 5 New Investments & Portfolio Changes
  doc.addPage();
  drawContentChrome(doc, "New Investments & Portfolio Changes", 5, total, logo);
  y = 44;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.text);
  y = writeLines(doc, [report.portfolioChanges.summary], MARGIN, y, CONTENT_W, 5) + 4;
  y = sectionHeading(doc, "New Investments / Priority Growth", y);
  y = bulletBlock(doc, report.portfolioChanges.newInvestments, y) + 3;
  y = sectionHeading(doc, "Additional Investments", y);
  y = bulletBlock(doc, report.portfolioChanges.additionalInvestments, y) + 3;
  y = sectionHeading(doc, "Portfolio Changes", y);
  bulletBlock(doc, report.portfolioChanges.portfolioChanges, y);

  // 6 Impact Overview
  doc.addPage();
  drawContentChrome(doc, "Impact Overview", 6, total, logo);
  y = 44;
  y = metricRow(doc, y, [
    { label: "Jobs Created", value: report.impact.jobsCreated.toLocaleString() },
    { label: "Jobs Retained", value: report.impact.jobsRetained.toLocaleString() },
    { label: "Women Employed", value: report.impact.womenEmployed.toLocaleString() },
  ]);
  y = metricRow(doc, y, [
    { label: "Youth Employed", value: report.impact.youthEmployed.toLocaleString() },
    { label: "Communities Impacted", value: report.impact.communitiesImpacted.toLocaleString() },
  ]);
  barChart(doc, y, "Jobs Created by Sector", report.impact.jobsBySector, (n) => n.toLocaleString());

  // 7 Featured Impact Story
  doc.addPage();
  drawContentChrome(doc, "Featured Impact Story", 7, total, logo);
  y = 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setText(doc, C.text);
  doc.text(report.featuredStory.companyName, MARGIN, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.muted);
  doc.text(`${report.featuredStory.country} · ${report.featuredStory.sector}`, MARGIN, y);
  y += 8;
  setFill(doc, C.soft);
  doc.roundedRect(MARGIN, y, CONTENT_W, 70, 2, 2, "F");
  try {
    const res = await fetch(report.featuredStory.imageUrl);
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      doc.addImage(dataUrl, "JPEG", MARGIN, y, CONTENT_W, 70);
    }
  } catch {
    // soft placeholder already painted
  }
  y += 78;
  setFill(doc, C.soft);
  doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.green);
  doc.text(
    `${report.featuredStory.metricLabel}: ${report.featuredStory.metricValue}`,
    MARGIN + 4,
    y + 9,
  );
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.text);
  writeLines(doc, [report.featuredStory.narrative], MARGIN, y, CONTENT_W, 5);

  // 8 Journey Highlights
  doc.addPage();
  drawContentChrome(doc, "Journey Highlights", 8, total, logo);
  y = 44;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setText(doc, C.muted);
  doc.text(
    `Countries visited: ${report.journeys.countriesVisited.join(", ") || "—"}`,
    MARGIN,
    y,
  );
  y += 6;
  doc.text(
    `Companies visited: ${report.journeys.companiesVisited.join(", ") || "—"}`,
    MARGIN,
    y,
  );
  y += 10;
  for (const block of report.journeys.blocks.slice(0, 3)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.green);
    doc.text(block.title, MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.muted);
    doc.text(`${block.country} · ${block.companies.join(", ")}`, MARGIN, y);
    y += 5;
    setText(doc, C.text);
    doc.setFontSize(9);
    y = writeLines(doc, [`Observations: ${block.observations}`], MARGIN, y, CONTENT_W, 4.5);
    y = writeLines(doc, [`Lessons: ${block.lessons}`], MARGIN, y, CONTENT_W, 4.5) + 4;
  }

  // 9 Portfolio Highlights
  doc.addPage();
  drawContentChrome(doc, "Portfolio Highlights", 9, total, logo);
  y = 44;
  for (const h of report.portfolioHighlights) {
    setFill(doc, C.soft);
    doc.roundedRect(MARGIN, y, CONTENT_W, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, C.green);
    doc.text(h.kind.toUpperCase(), MARGIN + 3, y + 6);
    doc.setFontSize(11);
    setText(doc, C.text);
    doc.text(h.companyName, MARGIN + 3, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.muted);
    doc.text(`${h.country} · ${h.sector}`, MARGIN + 3, y + 17);
    const ach = wrap(doc, h.achievement, CONTENT_W - 8);
    doc.text(ach[0] ?? "", MARGIN + 70, y + 12);
    y += 26;
  }

  // 10 Opportunity Intelligence
  doc.addPage();
  drawContentChrome(doc, "Opportunity Intelligence", 10, total, logo);
  y = 44;
  y = sectionHeading(doc, "Strategic Observations", y);
  y = bulletBlock(doc, report.opportunity.observations, y) + 3;
  y = sectionHeading(doc, "Sector Outlook", y);
  y = bulletBlock(doc, report.opportunity.emerging, y) + 3;
  y = sectionHeading(doc, "Recommended Focus", y);
  bulletBlock(doc, report.opportunity.recommendedFocus, y);

  // 11 Strategic Outlook
  doc.addPage();
  drawContentChrome(doc, "Strategic Outlook", 11, total, logo);
  y = 44;
  y = sectionHeading(doc, "Management Outlook", y);
  y = bulletBlock(doc, report.outlook.management, y) + 4;
  y = sectionHeading(doc, "Portfolio Outlook", y);
  y = bulletBlock(doc, report.outlook.portfolio, y) + 4;
  y = sectionHeading(doc, "Impact Outlook", y);
  bulletBlock(doc, report.outlook.impact, y);

  // 12 Closing Summary
  doc.addPage();
  drawContentChrome(doc, "Closing Summary", 12, total, logo);
  y = 56;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setText(doc, C.text);
  const closingParas = report.closing.statement.split(/\n\n+/);
  for (const para of closingParas) {
    y = writeLines(doc, [para], MARGIN, y, CONTENT_W, 6) + 6;
  }

  doc.save(`Talanton-Quarterly-Portfolio-Update-${period.replace(/\s+/g, "-")}.pdf`);
}
