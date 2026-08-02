import { jsPDF } from "jspdf";

import {
  abhiActionStatusColor,
  abhiKpiTrendArrow,
  abhiRiskRatingBand,
  abhiRiskScore,
  abhiRiskTrendLabel,
  abhiSortedBoardActions,
  formatAbhiBoardDate,
  formatAbhiBoardGbp,
  type AbhiActionStatus,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
} from "@/lib/abhi/board-pack-model";

const SLIDE_W = 297;
const SLIDE_H = 167;
const MARGIN = 14;
const CONTENT_W = SLIDE_W - MARGIN * 2;

const COLORS = {
  navy: [11, 31, 58] as const,
  accent: [27, 79, 138] as const,
  red: [200, 16, 46] as const,
  white: [255, 255, 255] as const,
  light: [232, 238, 247] as const,
  muted: [148, 163, 184] as const,
  amber: [245, 158, 11] as const,
  green: [16, 185, 129] as const,
  rowAlt: [18, 42, 71] as const,
  card: [15, 39, 68] as const,
  warnBg: [58, 31, 31] as const,
  decisionBg: [19, 47, 82] as const,
  chipGreen: [6, 95, 70] as const,
  chipAmber: [120, 53, 15] as const,
  chipRed: [127, 29, 29] as const,
  heatLow: [26, 58, 42] as const,
  heatMed: [58, 47, 20] as const,
  heatHigh: [58, 26, 26] as const,
};

export function abhiBoardPackPdfFileName(meetingDate: string): string {
  return `Board Pack - ${meetingDate}.pdf`;
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

function paintBackground(doc: jsPDF) {
  setFill(doc, COLORS.navy);
  doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
  setFill(doc, COLORS.red);
  doc.rect(0, 0, SLIDE_W, 2.5, "F");
}

function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, MARGIN, 12);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, COLORS.muted);
    doc.text(subtitle, MARGIN, 17);
  }
}

function drawFooter(doc: jsPDF, packName: string, slideNumber: number) {
  setFill(doc, COLORS.accent);
  doc.rect(0, SLIDE_H - 8, SLIDE_W, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, COLORS.light);
  doc.text(packName, MARGIN, SLIDE_H - 3.5);
  doc.text(`Confidential · Slide ${slideNumber}`, SLIDE_W - MARGIN, SLIDE_H - 3.5, {
    align: "right",
  });
}

function drawBullets(doc: jsPDF, items: string[], x: number, y: number, width: number, maxLines = 6) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, COLORS.light);
  let cursorY = y;
  for (const item of items.slice(0, maxLines)) {
    const lines = doc.splitTextToSize(`• ${item}`, width);
    doc.text(lines, x, cursorY);
    cursorY += lines.length * 3.6 + 1;
  }
}

function drawMiniTable(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  rows: { left: string; right: string }[],
  title?: string,
) {
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.white);
    doc.text(title, x, y - 1.5);
  }
  setDraw(doc, COLORS.accent);
  doc.roundedRect(x, y, width, 6 + rows.length * 6.5, 1.5, 1.5, "S");
  rows.forEach((row, index) => {
    const rowY = y + 5 + index * 6.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLORS.light);
    doc.text(row.left, x + 2, rowY);
    setText(doc, COLORS.white);
    doc.text(row.right, x + width - 2, rowY, { align: "right" });
  });
}

function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  labels: string[],
  values: number[],
  title: string,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, COLORS.white);
  doc.text(title, x, y - 2);
  const max = Math.max(...values, 1);
  const barW = width / values.length - 4;
  const bottom = y + height;
  setDraw(doc, COLORS.accent);
  doc.line(x, bottom, x + width, bottom);
  values.forEach((value, index) => {
    const barH = (value / max) * (height - 8);
    const barX = x + index * (barW + 4) + 2;
    setFill(doc, index % 2 === 0 ? COLORS.accent : COLORS.red);
    doc.rect(barX, bottom - barH, barW, barH, "F");
    doc.setFontSize(6);
    setText(doc, COLORS.muted);
    doc.text(labels[index] ?? "", barX + barW / 2, bottom + 3.5, { align: "center" });
  });
}

function drawSparkline(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  values: number[],
  title: string,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, COLORS.white);
  doc.text(title, x, y - 1.5);
  setDraw(doc, COLORS.accent);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "S");
  if (values.length < 2) return;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const stepX = (width - 6) / (values.length - 1);
  setDraw(doc, COLORS.green);
  for (let index = 1; index < values.length; index += 1) {
    const x1 = x + 3 + (index - 1) * stepX;
    const x2 = x + 3 + index * stepX;
    const y1 = y + height - 3 - ((values[index - 1] - min) / range) * (height - 6);
    const y2 = y + height - 3 - ((values[index] - min) / range) * (height - 6);
    doc.line(x1, y1, x2, y2);
  }
}

function riskRatingColor(risk: AbhiBoardRisk): readonly [number, number, number] {
  const band = abhiRiskRatingBand(risk);
  if (band === "High") return COLORS.red;
  if (band === "Medium") return COLORS.amber;
  return COLORS.green;
}

function orgStatusColor(status: AbhiBoardPackData["orgStatus"]): readonly [number, number, number] {
  if (status === "Green") return COLORS.green;
  if (status === "Red") return COLORS.red;
  return COLORS.amber;
}

function actionStatusFill(status: AbhiActionStatus): readonly [number, number, number] {
  const tone = abhiActionStatusColor(status);
  if (tone === "green") return COLORS.chipGreen;
  if (tone === "amber") return COLORS.chipAmber;
  return COLORS.chipRed;
}

function impactLikelihoodLabel(value: "H" | "M" | "L"): string {
  if (value === "H") return "High";
  if (value === "M") return "Medium";
  return "Low";
}

function hlmToScore(value: "H" | "M" | "L"): number {
  if (value === "H") return 3;
  if (value === "M") return 2;
  return 1;
}

function varianceText(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatAbhiBoardGbp(value, true)}`;
}

function addSlide(doc: jsPDF): { slideNumber: number } {
  doc.addPage([SLIDE_W, SLIDE_H], "landscape");
  paintBackground(doc);
  const slideNumber = doc.getNumberOfPages();
  return { slideNumber };
}

export async function buildAbhiBoardPackPdf(
  data: AbhiBoardPackData,
  logoDataUrl: string | null,
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [SLIDE_W, SLIDE_H] });
  doc.deletePage(1);

  // Slide 1 — Cover
  {
    addSlide(doc);
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "JPEG", MARGIN, 8, 28, 16);
      } catch {
        // Logo optional — continue without image if format unsupported.
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setText(doc, COLORS.muted);
    doc.text("Association of British HealthTech Industries", MARGIN, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    setText(doc, COLORS.white);
    doc.text("Board Meeting Pack", MARGIN, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    setText(doc, COLORS.light);
    doc.text(formatAbhiBoardDate(data.meetingDate), MARGIN, 52);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, COLORS.red);
    doc.text("CONFIDENTIAL", MARGIN, 58);

    let rowY = 66;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.white);
    doc.text("Name", MARGIN, rowY);
    doc.text("Role", MARGIN + 70, rowY);
    rowY += 4;
    doc.setFont("helvetica", "normal");
    for (const person of data.attendees) {
      setText(doc, COLORS.light);
      doc.text(person.name, MARGIN, rowY);
      setText(doc, COLORS.muted);
      doc.text(person.role, MARGIN + 70, rowY);
      rowY += 4.5;
    }
    drawFooter(doc, data.packName, 1);
  }

  // Slide 2 — Executive Summary (board paper layout)
  {
    addSlide(doc);
    drawHeader(doc, "Executive Summary");

    const leftX = MARGIN;
    const centreX = 78;
    const rightX = 188;
    const contentTop = 22;
    const decisionsY = 132;

    // LEFT — Agenda
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, COLORS.white);
    doc.text("Agenda", leftX, contentTop);
    data.agenda.forEach((item, index) => {
      const y = contentTop + 6 + index * 5.8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setText(doc, COLORS.red);
      doc.text(String(index + 1), leftX, y);
      doc.setFont("helvetica", "normal");
      setText(doc, COLORS.light);
      doc.text(item, leftX + 5, y);
    });

    // LEFT — Organisation Status (secondary)
    const statusY = 122;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setText(doc, COLORS.muted);
    doc.text("Organisation Status", leftX, statusY);
    setFill(doc, orgStatusColor(data.orgStatus));
    doc.circle(leftX + 2, statusY + 5, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, COLORS.light);
    doc.text(data.orgStatus, leftX + 6, statusY + 6.5);

    // CENTRE — Key Highlights
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, COLORS.green);
    doc.text("Key Highlights", centreX, contentTop);
    data.highlightCards.forEach((card, index) => {
      const y = contentTop + 4 + index * 16.5;
      setFill(doc, COLORS.card);
      setDraw(doc, COLORS.accent);
      doc.roundedRect(centreX, y, 102, 14.5, 1.2, 1.2, "FD");
      setFill(doc, COLORS.green);
      doc.rect(centreX, y, 1.8, 14.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setText(doc, COLORS.muted);
      doc.text(card.title, centreX + 4, y + 4);
      doc.setFontSize(9);
      setText(doc, COLORS.white);
      doc.text(card.primary, centreX + 4, y + 8.5);
      if (card.secondary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        setText(doc, COLORS.light);
        doc.text(card.secondary, centreX + 4, y + 12.5);
      }
    });

    // RIGHT — Key Concerns
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, COLORS.amber);
    doc.text("Key Concerns", rightX, contentTop);
    data.concernCards.forEach((card, index) => {
      const y = contentTop + 4 + index * 16.5;
      setFill(doc, COLORS.warnBg);
      setDraw(doc, COLORS.red);
      doc.roundedRect(rightX, y, 95, 14.5, 1.2, 1.2, "FD");
      setFill(doc, COLORS.amber);
      doc.rect(rightX, y, 1.8, 14.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setText(doc, COLORS.amber);
      doc.text(card.title, rightX + 4, y + 5);
      doc.setFontSize(9);
      setText(doc, COLORS.white);
      doc.text(card.detail, rightX + 4, y + 10.5);
    });

    // BOTTOM — Board Decisions Required
    setFill(doc, COLORS.decisionBg);
    setDraw(doc, COLORS.red);
    doc.roundedRect(MARGIN, decisionsY, CONTENT_W, 22, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.red);
    doc.text("Board Decisions Required", MARGIN + 3, decisionsY + 5);
    data.boardDecisions.forEach((decision, index) => {
      doc.setFontSize(8);
      setText(doc, COLORS.white);
      doc.text(`${index + 1}.  ${decision}`, MARGIN + 3, decisionsY + 10 + index * 3.8);
    });
    drawFooter(doc, data.packName, 2);
  }

  // Slide 3 — Previous Meeting Actions (board action register)
  {
    addSlide(doc);
    drawHeader(doc, "Previous Meeting Actions", "Board action register · sorted by status priority");

    const actions = abhiSortedBoardActions(data);
    const colX = [MARGIN, MARGIN + 18, MARGIN + 168, MARGIN + 212, MARGIN + 240];
    const headers = ["Ref", "Action", "Owner", "Due Date", "Status"];
    let y = 24;
    setFill(doc, COLORS.accent);
    doc.rect(MARGIN, y - 4, CONTENT_W, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, COLORS.white);
    headers.forEach((header, index) => doc.text(header, colX[index]!, y));
    y += 6;

    for (const [index, action] of actions.entries()) {
      const rowH = 12;
      setFill(doc, index % 2 === 0 ? COLORS.navy : COLORS.rowAlt);
      doc.rect(MARGIN, y - 3.5, CONTENT_W, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setText(doc, COLORS.light);
      doc.text(action.id, colX[0]!, y);
      doc.setFont("helvetica", "normal");
      setText(doc, COLORS.white);
      const actionLines = doc.splitTextToSize(action.title, 145);
      doc.text(actionLines.slice(0, 2), colX[1]!, y);
      setText(doc, COLORS.light);
      doc.text(action.owner, colX[2]!, y);
      setText(doc, COLORS.muted);
      doc.text(action.due, colX[3]!, y);
      setFill(doc, actionStatusFill(action.status));
      doc.roundedRect(colX[4]!, y - 3, 22, 5.5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setText(doc, COLORS.white);
      doc.text(action.status, colX[4]! + 11, y, { align: "center" });
      y += rowH;
    }
    drawFooter(doc, data.packName, 3);
  }

  // Slide 4 — Risk Register (board risk register)
  {
    addSlide(doc);
    drawHeader(doc, "Risk Register", "Highest risk first · New, increasing, and overdue mitigations highlighted");

    const sortedRisks = [...data.risks].sort((a, b) => abhiRiskScore(b) - abhiRiskScore(a));
    const newCount = sortedRisks.filter((r) => r.flags.new).length;
    const increasingCount = sortedRisks.filter((r) => r.flags.increased || r.trend === "↑").length;
    const overdueMitCount = sortedRisks.filter((r) => r.flags.overdueMitigation).length;

    const flagItems = [
      { label: `New Risks: ${newCount}`, color: COLORS.accent },
      { label: `Increasing Risks: ${increasingCount}`, color: COLORS.amber },
      { label: `Overdue Mitigations: ${overdueMitCount}`, color: COLORS.red },
    ];
    flagItems.forEach((flag, index) => {
      const x = MARGIN + index * 55;
      setFill(doc, COLORS.card);
      setDraw(doc, flag.color);
      doc.roundedRect(x, 20, 52, 7, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setText(doc, flag.color);
      doc.text(flag.label, x + 26, 24.5, { align: "center" });
    });

    // Mini heatmap
    const heatX = 190;
    const heatY = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setText(doc, COLORS.muted);
    doc.text("Risk Heatmap", heatX, heatY + 2);
    const levels: Array<"L" | "M" | "H"> = ["L", "M", "H"];
    const heatCounts = levels.map(() => levels.map(() => 0));
    for (const risk of sortedRisks) {
      const i = hlmToScore(risk.impact) - 1;
      const j = hlmToScore(risk.likelihood) - 1;
      heatCounts[i]![j]! += 1;
    }
    levels.forEach((_, row) => {
      levels.forEach((__, col) => {
        const count = heatCounts[row]![col]!;
        const score = (row + 1) * (col + 1);
        const fill = score >= 6 ? COLORS.heatHigh : score >= 3 ? COLORS.heatMed : COLORS.heatLow;
        const x = heatX + 28 + col * 8;
        const y = heatY + (2 - row) * 6;
        setFill(doc, fill);
        setDraw(doc, COLORS.accent);
        doc.rect(x, y, 7, 5.5, "FD");
        if (count > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6);
          setText(doc, COLORS.white);
          doc.text(String(count), x + 3.5, y + 3.8, { align: "center" });
        }
      });
    });

    const colX = [MARGIN, MARGIN + 14, MARGIN + 78, MARGIN + 112, MARGIN + 130, MARGIN + 152, MARGIN + 172, MARGIN + 198, MARGIN + 250];
    const headers = ["ID", "Risk Description", "Owner", "Impact", "Like.", "Rating", "Trend", "Mitigation", "Status"];
    let y = 42;
    setFill(doc, COLORS.accent);
    doc.rect(MARGIN, y - 4, CONTENT_W, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setText(doc, COLORS.white);
    headers.forEach((header, index) => doc.text(header, colX[index]!, y));
    y += 5.5;

    for (const [index, risk] of sortedRisks.entries()) {
      const rowH = 14;
      const flagged = risk.flags.new || risk.flags.increased || risk.flags.overdueMitigation;
      setFill(doc, flagged ? COLORS.warnBg : index % 2 === 0 ? COLORS.navy : COLORS.rowAlt);
      doc.rect(MARGIN, y - 3, CONTENT_W, rowH, "F");

      const band = abhiRiskRatingBand(risk);
      const trendLabel = abhiRiskTrendLabel(risk.trend);
      const flagPrefix = [
        risk.flags.new ? "NEW" : "",
        risk.flags.increased ? "↑" : "",
        risk.flags.overdueMitigation ? "OD" : "",
      ]
        .filter(Boolean)
        .join(" ");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setText(doc, COLORS.light);
      doc.text(risk.id, colX[0]!, y + 2);

      doc.setFont("helvetica", "normal");
      setText(doc, COLORS.white);
      const desc = flagPrefix ? `[${flagPrefix}] ${risk.risk}` : risk.risk;
      const descLines = doc.splitTextToSize(desc, 60);
      doc.text(descLines.slice(0, 2), colX[1]!, y + 1);

      setText(doc, COLORS.light);
      const ownerLines = doc.splitTextToSize(risk.owner, 30);
      doc.text(ownerLines.slice(0, 2), colX[2]!, y + 1);

      doc.text(impactLikelihoodLabel(risk.impact), colX[3]!, y + 2);
      doc.text(impactLikelihoodLabel(risk.likelihood), colX[4]!, y + 2);

      setFill(doc, riskRatingColor(risk));
      doc.roundedRect(colX[5]!, y - 1.5, 16, 8, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      setText(doc, COLORS.white);
      doc.text(`${band}`, colX[5]! + 8, y + 1.5, { align: "center" });
      doc.setFontSize(5.5);
      doc.text(String(risk.rating), colX[5]! + 8, y + 5, { align: "center" });

      doc.setFont("helvetica", trendLabel === "Increasing" ? "bold" : "normal");
      doc.setFontSize(6);
      setText(
        doc,
        trendLabel === "Increasing" ? COLORS.amber : trendLabel === "Reducing" ? COLORS.green : COLORS.light,
      );
      doc.text(trendLabel, colX[6]!, y + 2);

      doc.setFont("helvetica", "normal");
      setText(doc, COLORS.muted);
      const mitLines = doc.splitTextToSize(risk.mitigation, 48);
      doc.text(mitLines.slice(0, 2), colX[7]!, y + 1);

      setText(doc, COLORS.white);
      doc.text(risk.status, colX[8]!, y + 2);
      y += rowH;
    }
    drawFooter(doc, data.packName, 4);
  }

  // Slide 5 — KPI Dashboard
  {
    addSlide(doc);
    drawHeader(doc, "KPI Dashboard", "Actual vs budget with trend indicators");
    let y = 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, COLORS.white);
    doc.text("KPI", MARGIN, y);
    doc.text("Actual", MARGIN + 72, y);
    doc.text("Budget", MARGIN + 98, y);
    doc.text("Variance", MARGIN + 124, y);
    doc.text("Trend", MARGIN + 152, y);
    y += 4;
    for (const kpi of data.kpis) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, COLORS.light);
      doc.text(kpi.name, MARGIN, y);
      setText(doc, COLORS.white);
      doc.text(
        typeof kpi.actual === "number" ? formatAbhiBoardGbp(kpi.actual, true) : String(kpi.actual),
        MARGIN + 72,
        y,
      );
      setText(doc, COLORS.muted);
      doc.text(
        typeof kpi.budget === "number" ? formatAbhiBoardGbp(kpi.budget, true) : String(kpi.budget),
        MARGIN + 98,
        y,
      );
      setText(doc, COLORS.light);
      doc.text(
        typeof kpi.variance === "number" ? varianceText(kpi.variance) : String(kpi.variance),
        MARGIN + 124,
        y,
      );
      setText(doc, kpi.trend > 0 ? COLORS.green : kpi.trend < 0 ? COLORS.red : COLORS.amber);
      doc.text(abhiKpiTrendArrow(kpi.trend), MARGIN + 158, y);
      y += 5.5;
    }
    drawSparkline(doc, 188, 24, 95, 28, data.kpis[1]?.sparkline ?? [], "Revenue sparkline");
    drawSparkline(doc, 188, 58, 95, 28, data.balanceSheet.cashTrend, "Cash sparkline");
    drawFooter(doc, data.packName, 5);
  }

  // Slide 6 — Financial Overview
  {
    addSlide(doc);
    drawHeader(doc, "Financial Overview", "Executive financial summary");
    const tiles = [
      data.financialOverview.revenueVsBudget,
      data.financialOverview.operatingSurplus,
      data.financialOverview.cashPosition,
    ];
    tiles.forEach((tile, index) => {
      const x = MARGIN + index * 92;
      setFill(doc, COLORS.accent);
      doc.roundedRect(x, 22, 86, 22, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, COLORS.light);
      doc.text(tile.label, x + 4, 28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      setText(doc, COLORS.white);
      doc.text(formatAbhiBoardGbp(tile.actual, true), x + 4, 38);
      if (tile.budget !== undefined) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        setText(doc, COLORS.muted);
        doc.text(
          `Budget ${formatAbhiBoardGbp(tile.budget, true)} · Var ${varianceText(tile.variance ?? tile.actual - tile.budget)}`,
          x + 4,
          42,
        );
      }
    });
    const forecast = data.financialOverview.forecastYearEnd;
    setFill(doc, COLORS.rowAlt);
    doc.roundedRect(MARGIN, 48, CONTENT_W, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.white);
    doc.text(
      `Forecast year end — Revenue ${formatAbhiBoardGbp(forecast.revenue, true)} · Surplus ${formatAbhiBoardGbp(forecast.surplus, true)} · Cash ${formatAbhiBoardGbp(forecast.cash, true)}`,
      MARGIN + 4,
      55,
    );
    drawBarChart(
      doc,
      MARGIN,
      66,
      130,
      38,
      ["Rev Budget", "Rev Actual", "Surp Budget", "Surp Actual"],
      [
        data.financialOverview.revenueVsBudget.budget ?? 0,
        data.financialOverview.revenueVsBudget.actual,
        data.financialOverview.operatingSurplus.budget ?? 0,
        data.financialOverview.operatingSurplus.actual,
      ],
      "Revenue & surplus",
    );
    drawSparkline(doc, 150, 66, 133, 38, data.balanceSheet.cashTrend, "Cash trend");
    drawFooter(doc, data.packName, 6);
  }

  // Slide 7 — Profit & Loss
  {
    addSlide(doc);
    drawHeader(doc, "Profit & Loss", "YTD actual vs budget");
    let y = 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, COLORS.white);
    doc.text("Line", MARGIN, y);
    doc.text("Actual", MARGIN + 78, y);
    doc.text("Budget", MARGIN + 108, y);
    doc.text("Variance", MARGIN + 138, y);
    doc.text("Prior Year", MARGIN + 168, y);
    y += 4;
    for (const row of data.pnl.rows) {
      doc.setFont("helvetica", row.emphasis ? "bold" : "normal");
      doc.setFontSize(row.emphasis ? 7.5 : 7);
      setText(doc, COLORS.light);
      doc.text(row.line, MARGIN, y);
      setText(doc, COLORS.white);
      doc.text(formatAbhiBoardGbp(row.actual, true), MARGIN + 78, y);
      setText(doc, COLORS.muted);
      doc.text(formatAbhiBoardGbp(row.budget, true), MARGIN + 108, y);
      setText(doc, COLORS.light);
      doc.text(varianceText(row.variance), MARGIN + 138, y);
      doc.text(formatAbhiBoardGbp(row.priorYear, true), MARGIN + 168, y);
      y += row.emphasis ? 6 : 5;
    }
    setFill(doc, COLORS.rowAlt);
    doc.roundedRect(MARGIN, 118, CONTENT_W, 22, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, COLORS.amber);
    doc.text("Variance commentary", MARGIN + 3, 124);
    drawBullets(doc, data.pnl.commentary, MARGIN + 3, 128, CONTENT_W - 6, 3);
    drawFooter(doc, data.packName, 7);
  }

  // Slide 8 — Balance Sheet & Cash
  {
    addSlide(doc);
    drawHeader(doc, "Balance Sheet & Cash", "Summary position and liquidity");
    drawMiniTable(doc, MARGIN, 24, 70, [
      { left: "Assets", right: formatAbhiBoardGbp(data.balanceSheet.assets, true) },
      { left: "Liabilities", right: formatAbhiBoardGbp(data.balanceSheet.liabilities, true) },
      { left: "Net assets", right: formatAbhiBoardGbp(data.balanceSheet.netAssets, true) },
    ]);
    drawMiniTable(doc, MARGIN, 58, 70, [
      { left: "Debtors", right: formatAbhiBoardGbp(data.balanceSheet.debtors, true) },
      { left: "Creditors", right: formatAbhiBoardGbp(data.balanceSheet.creditors, true) },
      {
        left: "Cash forecast (FY)",
        right: formatAbhiBoardGbp(data.balanceSheet.cashForecast, true),
      },
    ], "Cash & working capital");
    drawSparkline(doc, 92, 24, 191, 70, data.balanceSheet.cashTrend, "Cash trend & forecast trajectory");
    drawFooter(doc, data.packName, 8);
  }

  // Slide 9 — Commercial Performance
  {
    addSlide(doc);
    drawHeader(doc, "Commercial Performance", "Membership, sponsorship, and events");
    const membership = data.commercial.membership;
    drawMiniTable(doc, MARGIN, 24, 62, [
      { left: "New members", right: String(membership.new) },
      { left: "Lost members", right: String(membership.lost) },
      { left: "Net growth", right: String(membership.net) },
      { left: "Total members", right: String(membership.total) },
    ], "Membership");
    drawBarChart(doc, MARGIN, 58, 62, 34, ["New", "Lost", "Net"], [membership.new, membership.lost, membership.net], "Membership movement");

    const sponsorship = data.commercial.sponsorship;
    drawBarChart(
      doc,
      82,
      24,
      70,
      68,
      ["Budget", "Actual", "Forecast"],
      [sponsorship.budget, sponsorship.actual, sponsorship.forecast],
      "Sponsorship (£)",
    );

    const events = data.commercial.events;
    drawMiniTable(doc, 162, 24, 62, [
      { left: "Revenue", right: formatAbhiBoardGbp(events.revenue, true) },
      { left: "Registrations", right: events.registrations.toLocaleString("en-GB") },
      { left: "Forecast", right: formatAbhiBoardGbp(events.forecast, true) },
    ], "Events");
    drawBarChart(
      doc,
      162,
      58,
      62,
      34,
      ["Actual", "Forecast"],
      [events.revenue, events.forecast],
      "Events revenue",
    );
    drawFooter(doc, data.packName, 9);
  }

  // Slide 10 — Team & Organisation
  {
    addSlide(doc);
    drawHeader(doc, "Team & Organisation", "Headcount and recent changes");
    setFill(doc, COLORS.accent);
    doc.roundedRect(MARGIN, 24, 36, 18, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLORS.light);
    doc.text("Headcount", MARGIN + 3, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    setText(doc, COLORS.white);
    doc.text(String(data.team.headcount), MARGIN + 3, 38);
    setFill(doc, COLORS.rowAlt);
    doc.roundedRect(56, 24, 36, 18, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLORS.light);
    doc.text("Open roles", 59, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    setText(doc, COLORS.amber);
    doc.text(String(data.team.openRoles), 59, 38);

    let y = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.white);
    doc.text("Recent joiners", MARGIN, y);
    doc.text("Recent leavers", 150, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    for (const person of data.team.joiners) {
      setText(doc, COLORS.light);
      doc.text(`${person.name} — ${person.role} (${person.startDate})`, MARGIN, y);
      y += 4.5;
    }
    y = 55;
    for (const person of data.team.leavers) {
      setText(doc, COLORS.light);
      doc.text(`${person.name} — ${person.role} (${person.endDate})`, 150, y);
      y += 4.5;
    }
    setFill(doc, COLORS.rowAlt);
    doc.roundedRect(MARGIN, 72, CONTENT_W, 24, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.amber);
    doc.text("Organisation notes", MARGIN + 3, 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLORS.light);
    const notes = doc.splitTextToSize(data.team.notes, CONTENT_W - 6);
    doc.text(notes, MARGIN + 3, 83);
    drawFooter(doc, data.packName, 10);
  }

  // Slide 11 — Strategic Discussion & AOB
  {
    addSlide(doc);
    drawHeader(doc, "Strategic Discussion & AOB", "Board topics requiring decision");
    let y = 24;
    for (const topic of data.strategicTopics) {
      setFill(doc, COLORS.rowAlt);
      doc.roundedRect(MARGIN, y - 3, CONTENT_W, 16, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, COLORS.white);
      doc.text(topic.issue, MARGIN + 3, y + 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      setText(doc, COLORS.muted);
      const evidence = doc.splitTextToSize(`Evidence: ${topic.evidence}`, CONTENT_W - 6);
      doc.text(evidence[0] ?? "", MARGIN + 3, y + 5.5);
      setText(doc, COLORS.light);
      const recommendation = doc.splitTextToSize(`Recommendation: ${topic.recommendation}`, CONTENT_W - 6);
      doc.text(recommendation[0] ?? "", MARGIN + 3, y + 10);
      y += 18;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, COLORS.muted);
    doc.text(`AOB: ${data.aob}`, MARGIN, 118);
    drawFooter(doc, data.packName, 11);
  }

  const buffer = doc.output("arraybuffer");
  return new Uint8Array(buffer);
}
