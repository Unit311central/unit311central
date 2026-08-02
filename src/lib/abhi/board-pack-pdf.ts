import { jsPDF } from "jspdf";

import {
  ABHI_LOGO_INTRINSIC_HEIGHT,
  ABHI_LOGO_INTRINSIC_WIDTH,
} from "@/lib/abhi-surface";
import {
  abhiRiskRatingBand,
  abhiRiskScore,
  abhiRiskTrendLabel,
  abhiSortedBoardActions,
  formatAbhiBoardBudgetStatus,
  formatAbhiBoardBudgetVarianceNarrative,
  formatAbhiBoardDate,
  formatAbhiBoardGbp,
  formatAbhiBoardKpiValue,
  formatAbhiBoardKpiVariance,
  type AbhiActionStatus,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
  type AbhiKpiIndicator,
} from "@/lib/abhi/board-pack-model";

const SLIDE_W = 297;
const SLIDE_H = 167;
const MARGIN = 12;
const CONTENT_W = SLIDE_W - MARGIN * 2;

const C = {
  navy: [0, 43, 92] as const,
  white: [255, 255, 255] as const,
  page: [245, 247, 250] as const,
  soft: [238, 241, 245] as const,
  line: [213, 220, 230] as const,
  text: [27, 36, 48] as const,
  muted: [91, 101, 119] as const,
  subtleRed: [166, 25, 46] as const,
  green: [15, 118, 110] as const,
  amber: [180, 83, 9] as const,
  chipGreen: [209, 250, 229] as const,
  chipAmber: [254, 243, 199] as const,
  chipRed: [254, 226, 226] as const,
  chipGreenText: [6, 95, 70] as const,
  chipAmberText: [146, 64, 14] as const,
  chipRedText: [153, 27, 27] as const,
  decision: [232, 238, 246] as const,
};

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

export function abhiBoardPackPdfFileName(meetingDate: string): string {
  return `Board Pack - ${meetingDate}.pdf`;
}

function paintBackground(doc: jsPDF) {
  setFill(doc, C.page);
  doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
}

/** Transparent PNG wordmark — consistent size, correct aspect. */
const LOGO_W = 22;
const LOGO_H = LOGO_W * (ABHI_LOGO_INTRINSIC_HEIGHT / ABHI_LOGO_INTRINSIC_WIDTH);

function logoImageFormat(logoDataUrl: string): "PNG" | "JPEG" {
  return logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
}

function drawLogo(doc: jsPDF, logoDataUrl: string | null) {
  if (!logoDataUrl) return;
  try {
    doc.addImage(
      logoDataUrl,
      logoImageFormat(logoDataUrl),
      SLIDE_W - MARGIN - LOGO_W,
      4,
      LOGO_W,
      LOGO_H,
    );
  } catch {
    // optional
  }
}

function boardAttentionForRisk(risk: AbhiBoardRisk): string {
  if (risk.flags.overdueMitigation) return "Mitigation overdue — escalate this cycle";
  if (risk.flags.increased || risk.trend === "↑") return "Increasing — board oversight required";
  if (risk.flags.new) return "New risk — confirm ownership and response";
  if (abhiRiskRatingBand(risk) === "High") return "High exposure — monitor closely";
  if (abhiRiskRatingBand(risk) === "Medium") return "Watch — review at next meeting";
  return "Monitor";
}

function drawHeader(doc: jsPDF, title: string, logoDataUrl: string | null, subtitle?: string) {
  drawLogo(doc, logoDataUrl);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setText(doc, C.navy);
  doc.text(title, MARGIN, 12);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.muted);
    doc.text(subtitle, MARGIN, 17.5);
  }
  setDraw(doc, C.line);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 20, SLIDE_W - MARGIN, 20);
}

function drawFooter(doc: jsPDF, packName: string, slideNumber: number) {
  setFill(doc, C.navy);
  doc.rect(0, SLIDE_H - 8, SLIDE_W, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, C.white);
  doc.text(packName, MARGIN, SLIDE_H - 3);
  doc.text(`Confidential · Slide ${slideNumber}`, SLIDE_W - MARGIN, SLIDE_H - 3, { align: "right" });
}

function actionChip(status: AbhiActionStatus) {
  if (status === "Completed") return { fill: C.chipGreen, text: C.chipGreenText };
  if (status === "Underway") return { fill: C.chipAmber, text: C.chipAmberText };
  return { fill: C.chipRed, text: C.chipRedText };
}

function indicatorChip(indicator: AbhiKpiIndicator) {
  if (indicator === "On track") return { fill: C.chipGreen, text: C.chipGreenText };
  if (indicator === "Watch") return { fill: C.chipAmber, text: C.chipAmberText };
  return { fill: C.chipRed, text: C.chipRedText };
}

function varianceText(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatAbhiBoardGbp(value, true)}`;
}

type PillTone = "green" | "amber" | "red" | "navy";

function pillColors(tone: PillTone) {
  if (tone === "green") return { fill: C.chipGreen, text: C.chipGreenText };
  if (tone === "amber") return { fill: C.chipAmber, text: C.chipAmberText };
  if (tone === "red") return { fill: C.chipRed, text: C.chipRedText };
  return { fill: C.decision, text: C.navy };
}

function drawStatusPill(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  tone: PillTone,
) {
  const chip = pillColors(tone);
  setFill(doc, chip.fill);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(h >= 8 ? 9 : 8);
  setText(doc, chip.text);
  doc.text(label, x + w / 2, y + h / 2 + 1.1, { align: "center" });
}

function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fill: readonly [number, number, number],
) {
  const clamped = Math.max(0, Math.min(1, ratio));
  setFill(doc, C.soft);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "F");
  if (clamped > 0.02) {
    setFill(doc, fill);
    doc.roundedRect(x, y, Math.max(3, w * clamped), h, 1.2, 1.2, "F");
  }
}

function addSlide(doc: jsPDF) {
  doc.addPage([SLIDE_W, SLIDE_H], "landscape");
  paintBackground(doc);
}

export async function buildAbhiBoardPackPdf(
  data: AbhiBoardPackData,
  logoDataUrl: string | null,
): Promise<Uint8Array> {
  const { validateAndSanitizeAbhiBoardPackData } = await import(
    "@/lib/abhi/board-pack-validate"
  );
  data = validateAndSanitizeAbhiBoardPackData(data).data;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [SLIDE_W, SLIDE_H] });
  doc.deletePage(1);

  // Slide 1 — Cover
  {
    addSlide(doc);
    if (logoDataUrl) {
      try {
        const coverW = LOGO_W * 1.45;
        const coverH = LOGO_H * 1.45;
        doc.addImage(logoDataUrl, logoImageFormat(logoDataUrl), MARGIN, 8, coverW, coverH);
      } catch {
        // optional
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setText(doc, C.muted);
    doc.text("Association of British HealthTech Industries", MARGIN, 32);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    setText(doc, C.navy);
    doc.text("Board Meeting Pack", MARGIN, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    setText(doc, C.text);
    doc.text(formatAbhiBoardDate(data.meetingDate), MARGIN, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.subtleRed);
    doc.text("CONFIDENTIAL", MARGIN, 62);

    let y = 72;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Name", MARGIN, y);
    doc.text("Role", MARGIN + 70, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const person of data.attendees) {
      setText(doc, C.text);
      doc.text(person.name, MARGIN, y);
      setText(doc, C.muted);
      doc.text(person.role, MARGIN + 70, y);
      y += 5.5;
    }
    drawFooter(doc, data.packName, 1);
  }

  // Slide 2 — Executive Summary
  {
    addSlide(doc);
    drawHeader(doc, "Executive Summary", logoDataUrl);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, C.muted);
    doc.text("Organisation Status", 230, 8);
    const statusColor =
      data.orgStatus === "Green" ? C.green : data.orgStatus === "Red" ? C.subtleRed : C.amber;
    setFill(doc, statusColor);
    doc.circle(232, 14, 2.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.text);
    doc.text(data.orgStatus, 237, 15.5);

    // Agenda
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.navy);
    doc.text("Agenda", MARGIN, 28);
    data.agenda.forEach((item, index) => {
      const y = 34 + index * 6.2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setText(doc, C.navy);
      doc.text(String(index + 1), MARGIN, y);
      doc.setFont("helvetica", "normal");
      setText(doc, C.text);
      doc.text(item, MARGIN + 6, y);
    });

    // Highlights
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.green);
    doc.text("Key Highlights", 78, 28);
    data.highlightCards.forEach((card, index) => {
      const y = 32 + index * 14.5;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(78, y, 95, 13, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text(card.title, 81, y + 4);
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text(card.primary, 81, y + 8.5);
      if (card.secondary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setText(doc, C.text);
        doc.text(card.secondary, 81, y + 11.5);
      }
    });

    // Concerns — neutral board styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.amber);
    doc.text("Key Concerns", 182, 28);
    data.concernCards.forEach((card, index) => {
      const y = 32 + index * 14.5;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(182, y, 103, 13, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text(card.title, 185, y + 4.5);
      doc.setFontSize(11);
      setText(doc, C.text);
      doc.text(card.detail, 185, y + 9.5);
    });

    // Decisions — navy band, white text
    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 128, CONTENT_W, 26, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.white);
    doc.text("Board Decisions Required", MARGIN + 3, 135);
    data.boardDecisions.forEach((decision, index) => {
      doc.setFontSize(9);
      doc.text(`${index + 1}.  ${decision}`, MARGIN + 3, 141 + index * 4);
    });
    drawFooter(doc, data.packName, 2);
  }

  // Slide 3 — Actions
  {
    addSlide(doc);
    drawHeader(doc, "Previous Meeting Actions", logoDataUrl, "Board action register");
    const actions = abhiSortedBoardActions(data);
    const colX = [MARGIN, MARGIN + 16, MARGIN + 165, MARGIN + 210, MARGIN + 240];
    let y = 28;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Ref", "Action", "Owner", "Due Date", "Status"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 8;
    for (const [index, action] of actions.entries()) {
      const rowH = 13;
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.navy);
      doc.text(action.id, colX[0]!, y + 1);
      doc.setFont("helvetica", "normal");
      setText(doc, C.text);
      const lines = doc.splitTextToSize(action.title, 145);
      doc.text(lines.slice(0, 2), colX[1]!, y);
      doc.text(action.owner, colX[2]!, y + 1);
      setText(doc, C.muted);
      doc.text(action.due, colX[3]!, y + 1);
      const chip = actionChip(action.status);
      setFill(doc, chip.fill);
      doc.roundedRect(colX[4]!, y - 2.5, 26, 7, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, chip.text);
      doc.text(action.status, colX[4]! + 13, y + 1.5, { align: "center" });
      y += rowH;
    }
    drawFooter(doc, data.packName, 3);
  }

  // Slide 4 — Risk Register
  {
    addSlide(doc);
    drawHeader(doc, "Risk Register", logoDataUrl, "Executive risk briefing");
    const sorted = [...data.risks]
      .sort((a, b) => abhiRiskScore(b) - abhiRiskScore(a))
      .slice(0, 6);
    const summary = [
      {
        label: "New Risks",
        value: String(sorted.filter((r) => r.flags.new).length),
        color: C.navy,
      },
      {
        label: "Increasing Risks",
        value: String(sorted.filter((r) => r.flags.increased || r.trend === "↑").length),
        color: C.amber,
      },
      {
        label: "Overdue Mitigations",
        value: String(sorted.filter((r) => r.flags.overdueMitigation).length),
        color: C.subtleRed,
      },
    ];
    const cardW = (CONTENT_W - 8) / 3;
    summary.forEach((item, index) => {
      const x = MARGIN + index * (cardW + 4);
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, 24, cardW, 22, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text(item.label, x + 4, 31);
      doc.setFontSize(26);
      setText(doc, item.color);
      doc.text(item.value, x + 4, 42);
    });

    const colX = [MARGIN + 2, MARGIN + 118, MARGIN + 168, MARGIN + 200];
    const colW = [112, 48, 30, 73];
    let y = 52;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.white);
    ["Risk", "Owner", "Trend", "Board Attention Required"].forEach((h, i) =>
      doc.text(h, colX[i]!, y),
    );
    y += 9;
    for (const [index, risk] of sorted.entries()) {
      const rowH = 14;
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
      const trend = abhiRiskTrendLabel(risk.trend);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.text);
      const desc = doc.splitTextToSize(risk.risk, colW[0]! - 2);
      doc.text(desc.slice(0, 2), colX[0]!, y);

      doc.setFont("helvetica", "bold");
      setText(doc, C.navy);
      const owner = doc.splitTextToSize(risk.owner, colW[1]! - 2);
      doc.text(owner.slice(0, 2), colX[1]!, y);

      doc.setFont("helvetica", trend === "Increasing" ? "bold" : "normal");
      doc.setFontSize(10);
      setText(doc, trend === "Increasing" ? C.amber : trend === "Reducing" ? C.green : C.text);
      doc.text(trend, colX[2]!, y + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      const attention = doc.splitTextToSize(boardAttentionForRisk(risk), colW[3]! - 2);
      doc.text(attention.slice(0, 2), colX[3]!, y);
      y += rowH;
    }
    drawFooter(doc, data.packName, 4);
  }

  // Slide 5 — KPI
  {
    addSlide(doc);
    drawHeader(doc, "KPI Dashboard", logoDataUrl, "Actual vs budget with performance indicator");
    const colX = [MARGIN, MARGIN + 95, MARGIN + 135, MARGIN + 175, MARGIN + 220];
    let y = 28;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.white);
    ["KPI", "Actual", "Budget", "Variance", "Status"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 9;
    for (const [index, kpi] of data.kpis.entries()) {
      const rowH = 12;
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      setText(doc, C.text);
      doc.text(kpi.name, colX[0]!, y + 1);
      doc.setFont("helvetica", "bold");
      setText(doc, C.navy);
      doc.text(formatAbhiBoardKpiValue(kpi.actual, kpi.unit), colX[1]!, y + 1);
      doc.setFont("helvetica", "normal");
      setText(doc, C.muted);
      doc.text(formatAbhiBoardKpiValue(kpi.budget, kpi.unit), colX[2]!, y + 1);
      setText(doc, C.text);
      doc.text(formatAbhiBoardKpiVariance(kpi.variance, kpi.unit), colX[3]!, y + 1);
      const chip = indicatorChip(kpi.indicator);
      setFill(doc, chip.fill);
      doc.roundedRect(colX[4]!, y - 2.5, 28, 7, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, chip.text);
      doc.text(kpi.indicator, colX[4]! + 14, y + 1.5, { align: "center" });
      y += rowH;
    }
    drawFooter(doc, data.packName, 5);
  }

  // Slide 6 — Financial Overview (CEO visual metrics)
  {
    addSlide(doc);
    drawHeader(doc, "Financial Overview", logoDataUrl, "10-second board view");

    const rev = data.financialOverview.revenueVsBudget;
    const op = data.financialOverview.operatingSurplus;
    const cash = data.financialOverview.cashPosition.actual;
    const fc = data.financialOverview.forecastYearEnd;
    const revPct =
      rev.budget && rev.budget !== 0
        ? Math.round((Math.abs(rev.variance ?? 0) / Math.abs(rev.budget)) * 100)
        : 7;
    const cashMove = data.balanceSheet.cashMovementMom;

    const metricCards = [
      {
        title: "Revenue",
        value: formatAbhiBoardGbp(rev.actual, true),
        signal: formatAbhiBoardBudgetStatus(rev.variance ?? 0, { percentAbs: revPct }),
        tone: "amber" as const,
        detail: null as string | null,
      },
      {
        title: "Operating Result",
        value: formatAbhiBoardGbp(op.actual, true),
        signal: formatAbhiBoardBudgetVarianceNarrative(op.variance ?? 0),
        tone: "red" as const,
        detail: null as string | null,
      },
      {
        title: "Cash",
        value: formatAbhiBoardGbp(cash, true),
        signal: "Net cash increase this month",
        tone: "green" as const,
        detail: `+${formatAbhiBoardGbp(cashMove, true)}`,
      },
    ];

    const metricW = (CONTENT_W - 8) / 3;
    metricCards.forEach((card, index) => {
      const x = MARGIN + index * (metricW + 4);
      const y = 24;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, y, metricW, 52, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.muted);
      doc.text(card.title, x + 5, y + 10);
      doc.setFontSize(22);
      setText(doc, C.navy);
      doc.text(card.value, x + 5, y + 26);
      if (card.detail) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        setText(doc, C.muted);
        doc.text(card.signal, x + 5, y + 34);
        drawStatusPill(doc, x + 5, y + 38, metricW - 10, 9, card.detail, card.tone);
      } else {
        drawStatusPill(doc, x + 5, y + 36, metricW - 10, 10, card.signal, card.tone);
      }
    });

    // Year-End Forecast panel
    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(MARGIN, 82, CONTENT_W, 66, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setText(doc, C.navy);
    doc.text("Year-End Forecast", MARGIN + 6, 94);
    drawStatusPill(doc, SLIDE_W - MARGIN - 48, 86, 44, 8, "Confidence: Medium", "amber");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, C.muted);
    doc.text("Based on current trading assumptions", SLIDE_W - MARGIN - 4, 99, {
      align: "right",
    });

    const forecastCards = [
      { label: "Revenue", value: formatAbhiBoardGbp(fc.revenue, true) },
      { label: "Operating Result", value: formatAbhiBoardGbp(fc.surplus, true) },
      { label: "Cash", value: formatAbhiBoardGbp(fc.cash, true) },
    ];
    const fcW = (CONTENT_W - 20) / 3;
    forecastCards.forEach((card, index) => {
      const x = MARGIN + 6 + index * (fcW + 4);
      setFill(doc, C.soft);
      doc.roundedRect(x, 105, fcW, 35, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text(card.label, x + 4, 116);
      doc.setFontSize(18);
      setText(doc, C.navy);
      doc.text(card.value, x + 4, 132);
    });
    drawFooter(doc, data.packName, 6);
  }

  // Slide 7 — P&L
  {
    addSlide(doc);
    drawHeader(doc, "Profit & Loss", logoDataUrl, "YTD actual vs budget");
    const colX = [MARGIN, MARGIN + 95, MARGIN + 135, MARGIN + 175, MARGIN + 220];
    let y = 28;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Line", "Actual", "Budget", "Variance", "Prior Year"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 8;
    for (const [index, row] of data.pnl.rows.entries()) {
      const rowH = row.emphasis ? 9 : 8;
      setFill(doc, row.emphasis ? C.decision : index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 3.5, CONTENT_W, rowH, "F");
      doc.setFont("helvetica", row.emphasis ? "bold" : "normal");
      doc.setFontSize(10);
      setText(doc, C.text);
      doc.text(row.line, colX[0]!, y + 1);
      setText(doc, C.navy);
      doc.text(formatAbhiBoardGbp(row.actual, true), colX[1]!, y + 1);
      setText(doc, C.muted);
      doc.text(formatAbhiBoardGbp(row.budget, true), colX[2]!, y + 1);
      setText(doc, row.variance < 0 ? C.subtleRed : C.green);
      doc.setFont("helvetica", "bold");
      doc.text(varianceText(row.variance), colX[3]!, y + 1);
      doc.setFont("helvetica", "normal");
      setText(doc, C.muted);
      doc.text(formatAbhiBoardGbp(row.priorYear, true), colX[4]!, y + 1);
      y += rowH;
    }
    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(MARGIN, 125, CONTENT_W, 28, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Variance commentary", MARGIN + 3, 132);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.text);
    data.pnl.commentary.forEach((line, index) => {
      doc.text(`•  ${line}`, MARGIN + 3, 138 + index * 4.5);
    });
    drawFooter(doc, data.packName, 7);
  }

  // Slide 8 — Balance Sheet & Cash (visual cash story)
  {
    addSlide(doc);
    drawHeader(doc, "Balance Sheet & Cash", logoDataUrl, "Cash position at a glance");

    const position = [
      { label: "Assets", value: data.balanceSheet.assets },
      { label: "Liabilities", value: data.balanceSheet.liabilities },
      { label: "Net Assets", value: data.balanceSheet.netAssets },
    ];
    const tileW = (CONTENT_W - 8) / 3;
    position.forEach((item, index) => {
      const x = MARGIN + index * (tileW + 4);
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, 24, tileW, 24, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text(item.label, x + 4, 33);
      doc.setFontSize(16);
      setText(doc, C.navy);
      doc.text(formatAbhiBoardGbp(item.value, true), x + 4, 43);
    });

    // Left navy cash panel
    const cashPanelW = 110;
    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 54, cashPanelW, 94, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.white);
    doc.text("CURRENT CASH", MARGIN + cashPanelW / 2, 68, { align: "center" });
    doc.setFontSize(28);
    doc.text(
      formatAbhiBoardGbp(data.financialOverview.cashPosition.actual, true),
      MARGIN + cashPanelW / 2,
      90,
      { align: "center" },
    );
    drawStatusPill(doc, MARGIN + 28, 100, 54, 10, "Liquidity: GREEN", "green");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.white);
    doc.text("No short-term funding pressure", MARGIN + cashPanelW / 2, 120, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      `Expected Year End Cash  ${formatAbhiBoardGbp(data.balanceSheet.cashForecast, true)}`,
      MARGIN + cashPanelW / 2,
      136,
      { align: "center" },
    );

    // Right supporting indicators
    const rightX = MARGIN + cashPanelW + 6;
    const rightW = CONTENT_W - cashPanelW - 6;
    const support = [
      {
        label: "Net Cash Movement This Month",
        value: `+${formatAbhiBoardGbp(data.balanceSheet.cashMovementMom, true)}`,
        tone: "green" as const,
      },
      {
        label: "Expected Year End Cash",
        value: formatAbhiBoardGbp(data.balanceSheet.cashForecast, true),
        tone: "navy" as const,
      },
      { label: "Liquidity Rating", value: "GREEN", tone: "green" as const },
    ];
    support.forEach((item, index) => {
      const y = 54 + index * 16;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(rightX, y, rightW, 14, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(item.label, rightX + 5, y + 9);
      doc.setFontSize(12);
      setText(doc, item.tone === "green" ? C.green : C.navy);
      doc.text(item.value, rightX + rightW - 5, y + 9, { align: "right" });
    });

    // Cash drivers — positive / negative panels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.navy);
    doc.text("Cash Drivers", rightX, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, C.muted);
    const cashNarrative = doc.splitTextToSize(data.balanceSheet.cashDrivers, rightW);
    doc.text(cashNarrative.slice(0, 2), rightX, 110);
    const driverW = (rightW - 4) / 2;
    const driverY = 116;
    const driverH = 34;

    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(rightX, driverY, driverW, driverH, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.green);
    doc.text("Positive Drivers", rightX + 4, driverY + 8);
    data.balanceSheet.positiveCashDrivers.slice(0, 3).forEach((driver, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(
        `${driver.label}  +${formatAbhiBoardGbp(driver.amount, true)}`,
        rightX + 4,
        driverY + 16 + index * 6,
      );
    });

    const negX = rightX + driverW + 4;
    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(negX, driverY, driverW, driverH, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.subtleRed);
    doc.text("Negative Drivers", negX + 4, driverY + 8);
    data.balanceSheet.negativeCashDrivers.slice(0, 3).forEach((driver, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(
        `${driver.label}  -${formatAbhiBoardGbp(driver.amount, true)}`,
        negX + 4,
        driverY + 16 + index * 6,
      );
    });
    drawFooter(doc, data.packName, 8);
  }

  // Slide 9 — Commercial Performance (growth / pipeline visuals)
  {
    addSlide(doc);
    drawHeader(doc, "Commercial Performance", logoDataUrl, "Growth · Pipeline · Momentum");
    const colW = (CONTENT_W - 8) / 3;
    const colH = 124;
    const colY = 24;

    // Membership
    {
      const x = MARGIN;
      const m = data.commercial.membership;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, colY, colW, colH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text("MEMBERSHIP", x + 5, colY + 12);
      doc.setFontSize(32);
      doc.text(String(m.total), x + 5, colY + 36);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text("Active members", x + 5, colY + 46);
      drawStatusPill(doc, x + 5, colY + 54, colW - 10, 10, "+18 YTD growth", "green");
      drawStatusPill(doc, x + 5, colY + 68, colW - 10, 10, "11 at risk", "amber");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text("Net this quarter", x + 5, colY + 90);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      setText(doc, C.green);
      doc.text(`+${m.net}`, x + 5, colY + 104);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.text);
      doc.text(`${m.new} new  ·  ${m.lost} lost`, x + 5, colY + 114);
    }

    // Sponsorship
    {
      const x = MARGIN + colW + 4;
      const s = data.commercial.sponsorship;
      const progress = s.actual / s.budget;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, colY, colW, colH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text("SPONSORSHIP", x + 5, colY + 12);
      doc.setFontSize(26);
      doc.text(formatAbhiBoardGbp(s.actual, true), x + 5, colY + 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text(`of ${formatAbhiBoardGbp(s.budget, true)} target`, x + 5, colY + 44);
      drawProgressBar(doc, x + 5, colY + 52, colW - 10, 6, progress, C.amber);
      doc.setFontSize(9);
      setText(doc, C.text);
      doc.text(`${Math.round(progress * 100)}% of target`, x + 5, colY + 66);
      drawStatusPill(
        doc,
        x + 5,
        colY + 72,
        colW - 10,
        10,
        `GAP  ${formatAbhiBoardGbp(s.actual - s.budget, true)}`,
        "red",
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text("Forecast", x + 5, colY + 94);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      setText(doc, C.navy);
      doc.text(formatAbhiBoardGbp(s.forecast, true), x + 5, colY + 108);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text("if MedCore & Helix close", x + 5, colY + 117);
    }

    // Events / WHX
    {
      const x = MARGIN + 2 * (colW + 4);
      const secured = 28;
      const target = 32;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, colY, colW, colH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text("EVENTS / WHX", x + 5, colY + 12);
      doc.setFontSize(28);
      doc.text(String(secured), x + 5, colY + 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(`of ${target} target commitments`, x + 5, colY + 40);
      drawProgressBar(doc, x + 5, colY + 46, colW - 10, 5, secured / target, C.navy);

      const whxStats = [
        { label: "Current commitments", value: String(secured) },
        { label: "Remaining to target", value: String(target - secured) },
        { label: "Commercial status", value: "On track" },
        { label: "Delivery status", value: "Watch — deposit due" },
      ];
      whxStats.forEach((stat, index) => {
        const sy = colY + 56 + index * 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        setText(doc, C.muted);
        doc.text(stat.label, x + 5, sy);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        setText(doc, C.text);
        doc.text(stat.value, x + 5, sy + 5);
      });

      drawStatusPill(doc, x + 5, colY + 98, colW - 10, 9, "Programme status: AMBER", "amber");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(
        `Events revenue YTD  ${formatAbhiBoardGbp(data.commercial.events.revenue, true)}`,
        x + 5,
        colY + 116,
      );
    }
    drawFooter(doc, data.packName, 9);
  }

  // Slide 10 — Team
  {
    addSlide(doc);
    drawHeader(doc, "Team & Organisation", logoDataUrl, "Headcount, vacancies and recent changes");
    [
      { label: "Headcount", value: String(data.team.headcount), x: MARGIN, color: C.navy },
      { label: "Open roles", value: String(data.team.openRoles), x: MARGIN + 70, color: C.amber },
    ].forEach((tile) => {
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(tile.x, 26, 64, 24, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(tile.label, tile.x + 4, 34);
      doc.setFontSize(22);
      setText(doc, tile.color);
      doc.text(tile.value, tile.x + 4, 45);
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.navy);
    doc.text("Recent joiners", MARGIN, 62);
    doc.text("Recent leavers", 155, 62);
    let y = 68;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const person of data.team.joiners) {
      setText(doc, C.text);
      doc.text(`${person.name} — ${person.role} (${person.startDate})`, MARGIN, y);
      y += 7;
    }
    y = 68;
    for (const person of data.team.leavers) {
      setText(doc, C.text);
      doc.text(`${person.name} — ${person.role} (${person.endDate})`, 155, y);
      y += 7;
    }

    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(MARGIN, 95, CONTENT_W, 50, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.navy);
    doc.text("Organisation notes", MARGIN + 4, 104);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setText(doc, C.text);
    const notes = doc.splitTextToSize(data.team.notes, CONTENT_W - 8);
    doc.text(notes, MARGIN + 4, 112);
    drawFooter(doc, data.packName, 10);
  }

  // Slide 11 — Strategic Discussion (decision-first)
  {
    addSlide(doc);
    drawHeader(doc, "Strategic Discussion & AOB", logoDataUrl, "Decisions required");
    const cardW = (CONTENT_W - 6) / 2;
    const cardH = 58;
    data.strategicTopics.forEach((topic, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = MARGIN + col * (cardW + 6);
      const y = 24 + row * (cardH + 3);
      const priorityTone: PillTone =
        topic.priority === "HIGH" ? "red" : topic.priority === "MEDIUM" ? "amber" : "green";

      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");

      drawStatusPill(doc, x + cardW - 28, y + 3, 24, 7, topic.priority, priorityTone);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text("ISSUE", x + 4, y + 8);
      doc.setFontSize(9);
      setText(doc, C.navy);
      const issue = doc.splitTextToSize(topic.issue, cardW - 36);
      doc.text(issue.slice(0, 1), x + 4, y + 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text("WHY IT MATTERS", x + 4, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      const why = doc.splitTextToSize(topic.whyItMatters, cardW - 10);
      doc.text(why.slice(0, 1), x + 4, y + 27);

      // Decision panel — most prominent
      setFill(doc, C.navy);
      doc.roundedRect(x + 3, y + 31, cardW - 6, 15, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.white);
      doc.text("DECISION REQUIRED", x + 6, y + 36);
      doc.setFontSize(9);
      const decision = doc.splitTextToSize(topic.decisionRequired, cardW - 14);
      doc.text(decision.slice(0, 1), x + 6, y + 43);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text("IMPACT", x + 4, y + 52);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      const impact = doc.splitTextToSize(topic.impact, cardW - 28);
      doc.text(impact.slice(0, 1), x + 22, y + 52);
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.muted);
    const aob = doc.splitTextToSize(`AOB: ${data.aob}`, CONTENT_W);
    doc.text(aob.slice(0, 1), MARGIN, 150);
    drawFooter(doc, data.packName, 11);
  }

  const buffer = doc.output("arraybuffer");
  return new Uint8Array(buffer);
}
