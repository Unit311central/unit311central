import { jsPDF } from "jspdf";

import {
  ONWARDAIR_LOGO_INTRINSIC_HEIGHT,
  ONWARDAIR_LOGO_INTRINSIC_WIDTH,
} from "@/lib/onwardair-surface";
import {
  abhiRiskRatingBand,
  abhiRiskScore,
  abhiRiskTrendLabel,
  abhiSortedBoardActions,
  formatAbhiBoardBudgetVarianceNarrative,
  formatAbhiBoardDate,
  formatAbhiBoardKpiValue,
  formatAbhiBoardKpiVariance,
  type AbhiActionStatus,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
  type AbhiKpiIndicator,
} from "@/lib/abhi/board-pack-model";
import { formatOaBoardUsd } from "@/lib/onwardair/board-pack-model";

const SLIDE_W = 297;
const SLIDE_H = 167;
const MARGIN = 12;
const CONTENT_W = SLIDE_W - MARGIN * 2;

const C = {
  navy: [38, 123, 144] as const,
  white: [255, 255, 255] as const,
  page: [255, 255, 255] as const,
  soft: [238, 241, 245] as const,
  /** Hairline separators — soft grey so navy accents stay intentional. */
  line: [200, 210, 218] as const,
  accentLine: [38, 123, 144] as const,
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
  decision: [232, 244, 247] as const,
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

export function oaBoardPackPdfFileName(meetingDate: string): string {
  return `Board Pack - ${meetingDate}.pdf`;
}

function paintBackground(doc: jsPDF) {
  setFill(doc, C.page);
  doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
}

/** Dark navy PNG wordmark — sized for white board-pack pages. */
const LOGO_W = 30;
const LOGO_H = LOGO_W * (ONWARDAIR_LOGO_INTRINSIC_HEIGHT / ONWARDAIR_LOGO_INTRINSIC_WIDTH);

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
  return `${prefix}${formatOaBoardUsd(value, true)}`;
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

function drawSparkline(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  values: number[],
) {
  if (values.length < 2) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  setDraw(doc, C.accentLine);
  doc.setLineWidth(0.6);
  for (let i = 1; i < values.length; i++) {
    const x0 = x + ((i - 1) / (values.length - 1)) * w;
    const x1 = x + (i / (values.length - 1)) * w;
    const y0 = y + h - ((values[i - 1]! - min) / span) * h;
    const y1 = y + h - ((values[i]! - min) / span) * h;
    doc.line(x0, y0, x1, y1);
  }
}

function drawCashTrendChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  values: number[],
) {
  setFill(doc, C.soft);
  setDraw(doc, C.line);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, C.navy);
  doc.text("Cash trend (12 months)", x + 4, y + 7);
  const pad = 10;
  const chartX = x + pad;
  const chartY = y + 12;
  const chartW = w - pad * 2;
  const chartH = h - 20;
  if (values.length < 2) return;
  const min = Math.min(...values) * 0.96;
  const max = Math.max(...values) * 1.02;
  const span = Math.max(1, max - min);
  setDraw(doc, C.accentLine);
  doc.setLineWidth(1.1);
  for (let i = 1; i < values.length; i++) {
    const x0 = chartX + ((i - 1) / (values.length - 1)) * chartW;
    const x1 = chartX + (i / (values.length - 1)) * chartW;
    const y0 = chartY + chartH - ((values[i - 1]! - min) / span) * chartH;
    const y1 = chartY + chartH - ((values[i]! - min) / span) * chartH;
    doc.line(x0, y0, x1, y1);
  }
  setFill(doc, C.navy);
  const lastX = chartX + chartW;
  const lastY = chartY + chartH - ((values[values.length - 1]! - min) / span) * chartH;
  doc.circle(lastX, lastY, 1.4, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, C.muted);
  doc.text(formatOaBoardUsd(values[0]!, true), chartX, y + h - 3);
  doc.text(formatOaBoardUsd(values[values.length - 1]!, true), chartX + chartW, y + h - 3, {
    align: "right",
  });
}

function addSlide(doc: jsPDF) {
  doc.addPage([SLIDE_W, SLIDE_H], "landscape");
  paintBackground(doc);
}

export async function buildOnwardAirBoardPackPdf(
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
        const coverW = LOGO_W * 2.2;
        const coverH = LOGO_H * 2.2;
        doc.addImage(logoDataUrl, logoImageFormat(logoDataUrl), MARGIN, 6, coverW, coverH);
      } catch {
        // optional
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setText(doc, C.muted);
    doc.text("OnwardAir", MARGIN, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    setText(doc, C.navy);
    doc.text("Board Deck", MARGIN, 47);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    setText(doc, C.text);
    doc.text(formatAbhiBoardDate(data.meetingDate), MARGIN, 57);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.subtleRed);
    doc.text("CONFIDENTIAL", MARGIN, 64);

    let y = 74;
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
    data.highlightCards.slice(0, 5).forEach((card, index) => {
      const y = 32 + index * 15.5;
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.35);
      doc.roundedRect(78, y, 95, 14, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text(card.title, 81, y + 4);
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text(card.primary, 81, y + 9);
      if (card.secondary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        setText(doc, C.text);
        doc.text(card.secondary, 110, y + 9);
      }
    });

    // Concerns — wrapped detail so text never clips
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.amber);
    doc.text("Key Concerns", 182, 28);
    data.concernCards.slice(0, 3).forEach((card, index) => {
      const y = 32 + index * 28;
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.35);
      doc.roundedRect(182, y, 103, 25, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      doc.text(card.title, 185, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      const detailLines = doc.splitTextToSize(card.detail, 97);
      doc.text(detailLines.slice(0, 2), 185, y + 12);
    });

    // Decisions — next-meeting required verbs (not past "Approved")
    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 128, CONTENT_W, 26, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.white);
    doc.text("Board Decisions Required", MARGIN + 3, 135);
    data.boardDecisions.slice(0, 3).forEach((decision, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const line = doc.splitTextToSize(`${index + 1}.  ${decision}`, CONTENT_W - 8);
      doc.text(line.slice(0, 1), MARGIN + 3, 141 + index * 4.2);
    });
    drawFooter(doc, data.packName, 2);
  }

  // Slide 3 — Actions
  {
    addSlide(doc);
    drawHeader(doc, "Previous Meeting Actions", logoDataUrl, "Board action register");
    const actions = abhiSortedBoardActions(data);
    const colX = [MARGIN, MARGIN + 28, MARGIN + 163, MARGIN + 210, MARGIN + 242];
    let y = 28;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Ref", "Action", "Owner", "Due Date", "Status"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 8;
    for (const [index, action] of actions.entries()) {
      const rowH = 14;
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y - 4 + rowH, MARGIN + CONTENT_W, y - 4 + rowH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setText(doc, C.navy);
      doc.text(action.id, colX[0]!, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      const lines = doc.splitTextToSize(action.title, 128);
      doc.text(lines.slice(0, 2), colX[1]!, y + 1);
      doc.setFontSize(8);
      const ownerLines = doc.splitTextToSize(action.owner, 44);
      doc.text(ownerLines.slice(0, 2), colX[2]!, y + 1);
      setText(doc, C.muted);
      doc.text(action.due, colX[3]!, y + 2);
      const chip = actionChip(action.status);
      setFill(doc, chip.fill);
      doc.roundedRect(colX[4]!, y - 1.5, 28, 7, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setText(doc, chip.text);
      doc.text(action.status, colX[4]! + 14, y + 2.5, { align: "center" });
      y += rowH;
    }
    drawFooter(doc, data.packName, 3);
  }

  // Slide 4 — Risk Register
  {
    addSlide(doc);
    drawHeader(doc, "Risk Register", logoDataUrl, "Board + Engineering risk registers");
    const sorted = [...data.risks]
      .sort((a, b) => abhiRiskScore(b) - abhiRiskScore(a))
      .slice(0, 6);
    const summary = [
      {
        label: "High / Critical",
        value: String(sorted.filter((r) => abhiRiskRatingBand(r) === "High").length),
        color: C.subtleRed,
      },
      {
        label: "Increasing",
        value: String(sorted.filter((r) => r.flags.increased || r.trend === "↑").length),
        color: C.amber,
      },
      {
        label: "Overdue mitigations",
        value: String(sorted.filter((r) => r.flags.overdueMitigation).length),
        color: C.navy,
      },
    ];
    const cardW = (CONTENT_W - 8) / 3;
    summary.forEach((item, index) => {
      const x = MARGIN + index * (cardW + 4);
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, 24, cardW, 20, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(item.label, x + 4, 31);
      doc.setFontSize(22);
      setText(doc, item.color);
      doc.text(item.value, x + 4, 41);
    });

    const colX = [MARGIN + 2, MARGIN + 22, MARGIN + 130, MARGIN + 168, MARGIN + 198];
    const colW = [18, 104, 36, 28, 70];
    let y = 50;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["ID", "Risk", "Owner", "Trend", "Board Attention"].forEach((h, i) =>
      doc.text(h, colX[i]!, y),
    );
    y += 9;
    for (const [index, risk] of sorted.entries()) {
      const rowH = 15;
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y - 4 + rowH, MARGIN + CONTENT_W, y - 4 + rowH);
      const trend = abhiRiskTrendLabel(risk.trend);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.navy);
      doc.text(risk.id, colX[0]!, y + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      const desc = doc.splitTextToSize(risk.risk, colW[1]! - 2);
      doc.text(desc.slice(0, 2), colX[1]!, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setText(doc, C.navy);
      const owner = doc.splitTextToSize(risk.owner, colW[2]! - 2);
      doc.text(owner.slice(0, 2), colX[2]!, y);

      doc.setFont("helvetica", trend === "Increasing" ? "bold" : "normal");
      doc.setFontSize(8);
      setText(doc, trend === "Increasing" ? C.amber : trend === "Reducing" ? C.green : C.text);
      doc.text(trend, colX[3]!, y + 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(doc, C.text);
      const attention = doc.splitTextToSize(boardAttentionForRisk(risk), colW[4]! - 2);
      doc.text(attention.slice(0, 2), colX[4]!, y);
      y += rowH;
    }
    drawFooter(doc, data.packName, 4);
  }

  // Slide 5 — KPI
  {
    addSlide(doc);
    drawHeader(doc, "KPI Dashboard", logoDataUrl, "Programme performance vs target");
    const kpis = data.kpis.slice(0, 6);
    const cols = 3;
    const cardW = (CONTENT_W - 8) / cols;
    const cardH = 58;
    kpis.forEach((kpi, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = MARGIN + col * (cardW + 4);
      const y = 26 + row * (cardH + 4);
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(kpi.name, x + 4, y + 8);
      doc.setFontSize(22);
      setText(doc, C.navy);
      doc.text(formatAbhiBoardKpiValue(kpi.actual, kpi.unit), x + 4, y + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(
        `Target ${formatAbhiBoardKpiValue(kpi.budget, kpi.unit)}  ·  ${formatAbhiBoardKpiVariance(kpi.variance, kpi.unit)}`,
        x + 4,
        y + 30,
      );
      const actualN = typeof kpi.actual === "number" ? kpi.actual : Number(kpi.actual) || 0;
      const budgetN = typeof kpi.budget === "number" ? kpi.budget : Number(kpi.budget) || 0;
      const ratio =
        budgetN === 0 ? 0 : Math.max(0, Math.min(1.2, Math.abs(actualN) / Math.abs(budgetN)));
      drawProgressBar(
        doc,
        x + 4,
        y + 35,
        cardW - 8,
        5,
        Math.min(1, ratio),
        kpi.indicator === "On track" ? C.green : kpi.indicator === "Watch" ? C.amber : C.subtleRed,
      );
      const chip = indicatorChip(kpi.indicator);
      setFill(doc, chip.fill);
      doc.roundedRect(x + 4, y + 44, 36, 8, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setText(doc, chip.text);
      doc.text(kpi.indicator, x + 22, y + 49.5, { align: "center" });
      if (kpi.sparkline?.length) {
        drawSparkline(doc, x + 46, y + 44, cardW - 54, 10, kpi.sparkline);
      }
    });
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
    const cashMove = data.balanceSheet.cashMovementMom;

    const metricCards = [
      {
        title: data.financialOverview.revenueVsBudget.label || "Capital raised",
        value: formatOaBoardUsd(Number(rev.actual), true),
        signal: `${formatOaBoardUsd(Number(rev.budget ?? 0), true)} Seed target`,
        tone: "amber" as const,
        detail: formatOaBoardUsd(Number(rev.variance ?? 0), true),
      },
      {
        title: data.financialOverview.operatingSurplus.label || "Programme spend",
        value: formatOaBoardUsd(Number(op.actual), true),
        signal: formatAbhiBoardBudgetVarianceNarrative(Number(op.variance ?? 0)),
        tone: "red" as const,
        detail: null as string | null,
      },
      {
        title: "Cash",
        value: formatOaBoardUsd(Number(cash), true),
        signal: cashMove >= 0 ? "Net cash increase this month" : "Net cash decrease this month",
        tone: (cashMove >= 0 ? "green" : "amber") as "green" | "amber",
        detail: `${cashMove >= 0 ? "+" : ""}${formatOaBoardUsd(Number(cashMove), true)}`,
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
      { label: "Revenue (pre-revenue)", value: formatOaBoardUsd(fc.revenue, true) },
      { label: "Operating Result", value: formatOaBoardUsd(fc.surplus, true) },
      { label: "Year-end Cash", value: formatOaBoardUsd(fc.cash, true) },
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
    drawHeader(doc, "Programme Spend", logoDataUrl, "YTD actual vs programme budget");
    const colX = [MARGIN, MARGIN + 118, MARGIN + 155, MARGIN + 192, MARGIN + 235];
    let y = 28;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Programme", "Actual", "Budget", "Variance", "Spend vs budget"].forEach((h, i) =>
      doc.text(h, colX[i]!, y),
    );
    y += 9;
    for (const [index, row] of data.pnl.rows.entries()) {
      const rowH = row.emphasis ? 16 : 15;
      setFill(doc, row.emphasis ? C.decision : index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, rowH, "F");
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y - 4 + rowH, MARGIN + CONTENT_W, y - 4 + rowH);
      doc.setFont("helvetica", row.emphasis ? "bold" : "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      const lineName = doc.splitTextToSize(row.line, 100);
      doc.text(lineName.slice(0, 2), colX[0]!, y + 1);
      setText(doc, C.navy);
      doc.setFont("helvetica", "bold");
      doc.text(formatOaBoardUsd(row.actual, true), colX[1]!, y + 3);
      doc.setFont("helvetica", "normal");
      setText(doc, C.muted);
      doc.text(formatOaBoardUsd(row.budget, true), colX[2]!, y + 3);
      setText(doc, row.variance > 0 ? C.subtleRed : C.green);
      doc.setFont("helvetica", "bold");
      doc.text(varianceText(row.variance), colX[3]!, y + 3);
      const ratio = row.budget === 0 ? 0 : Math.min(1.15, row.actual / row.budget);
      drawProgressBar(
        doc,
        colX[4]!,
        y + 1,
        36,
        5,
        Math.min(1, ratio),
        ratio > 1 ? C.subtleRed : C.navy,
      );
      y += rowH;
    }
    setFill(doc, C.white);
    setDraw(doc, C.accentLine);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, Math.min(y + 4, 118), CONTENT_W, 30, 1.5, 1.5, "FD");
    const boxY = Math.min(y + 4, 118);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Variance commentary", MARGIN + 3, boxY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.text);
    data.pnl.commentary.forEach((line, index) => {
      const wrapped = doc.splitTextToSize(`•  ${line}`, CONTENT_W - 8);
      doc.text(wrapped.slice(0, 1), MARGIN + 3, boxY + 14 + index * 6);
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
      doc.text(formatOaBoardUsd(item.value, true), x + 4, 43);
    });

    // Left navy cash panel
    const cashPanelW = 92;
    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 54, cashPanelW, 50, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.white);
    doc.text("CURRENT CASH", MARGIN + cashPanelW / 2, 64, { align: "center" });
    doc.setFontSize(24);
    doc.text(
      formatOaBoardUsd(data.financialOverview.cashPosition.actual, true),
      MARGIN + cashPanelW / 2,
      80,
      { align: "center" },
    );
    drawStatusPill(doc, MARGIN + 18, 86, 56, 9, "Liquidity: GREEN", "green");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setText(doc, C.white);
    doc.text(
      `YE cash ${formatOaBoardUsd(data.balanceSheet.cashForecast, true)}`,
      MARGIN + cashPanelW / 2,
      100,
      { align: "center" },
    );

    const mom = data.balanceSheet.cashMovementMom;
    const rightX = MARGIN + cashPanelW + 6;
    const rightW = CONTENT_W - cashPanelW - 6;
    const support = [
      {
        label: "Net cash movement (MoM)",
        value: `${mom >= 0 ? "+" : ""}${formatOaBoardUsd(mom, true)}`,
        tone: (mom >= 0 ? "green" : "amber") as "green" | "amber",
      },
      {
        label: "Expected year-end cash",
        value: formatOaBoardUsd(data.balanceSheet.cashForecast, true),
        tone: "navy" as const,
      },
      { label: "Liquidity rating", value: "GREEN", tone: "green" as const },
    ];
    support.forEach((item, index) => {
      const sy = 54 + index * 17;
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.35);
      doc.roundedRect(rightX, sy, rightW, 15, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(item.label, rightX + 5, sy + 9);
      doc.setFontSize(11);
      setText(doc, item.tone === "green" ? C.green : item.tone === "amber" ? C.amber : C.navy);
      doc.text(item.value, rightX + rightW - 5, sy + 9, { align: "right" });
    });

    // Cash trend chart
    drawCashTrendChart(doc, MARGIN, 108, 150, 40, data.balanceSheet.cashTrend);

    // Drivers
    const driverX = MARGIN + 156;
    const driverW = (CONTENT_W - 156 - 4) / 2;
    setFill(doc, C.white);
    setDraw(doc, C.accentLine);
    doc.setLineWidth(0.35);
    doc.roundedRect(driverX, 108, driverW, 40, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, C.green);
    doc.text("Positive", driverX + 3, 116);
    data.balanceSheet.positiveCashDrivers.slice(0, 2).forEach((driver, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(doc, C.text);
      doc.text(
        `${driver.label} +${formatOaBoardUsd(driver.amount, true)}`,
        driverX + 3,
        124 + index * 7,
      );
    });
    const negX = driverX + driverW + 4;
    setFill(doc, C.white);
    setDraw(doc, C.accentLine);
    doc.roundedRect(negX, 108, driverW, 40, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, C.subtleRed);
    doc.text("Negative", negX + 3, 116);
    data.balanceSheet.negativeCashDrivers.slice(0, 3).forEach((driver, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, C.text);
      doc.text(
        `${driver.label} ${formatOaBoardUsd(driver.amount, true)}`,
        negX + 3,
        124 + index * 7,
      );
    });
    drawFooter(doc, data.packName, 8);
  }

  // Slide 9 — Fundraising & Pipeline
  {
    addSlide(doc);
    drawHeader(doc, "Fundraising & Pipeline", logoDataUrl, "Programme · Seed · Investors");
    const colW = (CONTENT_W - 8) / 3;
    const colH = 124;
    const colY = 24;
    const insights = data.commercialInsights;

    // Programme
    {
      const x = MARGIN;
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, colY, colW, colH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text("PROGRAMME", x + 5, colY + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(insights.membership.title, x + 5, colY + 20);
      insights.membership.lines.forEach((line, i) => {
        const ly = colY + 32 + i * 22;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        setText(doc, C.muted);
        doc.text(line.label, x + 5, ly);
        doc.setFontSize(14);
        setText(doc, C.navy);
        doc.text(line.value, x + 5, ly + 10);
        if (i < 2 && line.value.includes("%")) {
          const pct = Number.parseInt(line.value, 10);
          if (!Number.isNaN(pct)) {
            drawProgressBar(doc, x + 5, ly + 13, colW - 10, 4, pct / 100, C.navy);
          }
        }
      });
    }

    // Seed raise
    {
      const x = MARGIN + colW + 4;
      const s = data.commercial.sponsorship;
      const progress = s.budget ? s.actual / s.budget : 0;
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, colY, colW, colH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text("SEED RAISE", x + 5, colY + 12);
      doc.setFontSize(26);
      doc.text(formatOaBoardUsd(s.actual, true), x + 5, colY + 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(`closed of ${formatOaBoardUsd(s.budget, true)} target`, x + 5, colY + 44);
      drawProgressBar(doc, x + 5, colY + 52, colW - 10, 7, progress, C.navy);
      doc.setFontSize(9);
      setText(doc, C.text);
      doc.text(`${Math.round(progress * 100)}% of Seed target`, x + 5, colY + 68);
      drawStatusPill(
        doc,
        x + 5,
        colY + 74,
        colW - 10,
        10,
        `GAP  ${formatOaBoardUsd(s.actual - s.budget, true)}`,
        "red",
      );
      insights.sponsorship.lines.forEach((line, i) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setText(doc, C.muted);
        doc.text(`${line.label}: ${line.value}`, x + 5, colY + 96 + i * 8);
      });
    }

    // Investor pipeline
    {
      const x = MARGIN + 2 * (colW + 4);
      const e = data.commercial.events;
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, colY, colW, colH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text("INVESTOR PIPELINE", x + 5, colY + 12);
      doc.setFontSize(26);
      doc.text(formatOaBoardUsd(e.revenue, true), x + 5, colY + 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text("active pipeline value", x + 5, colY + 44);
      drawProgressBar(
        doc,
        x + 5,
        colY + 52,
        colW - 10,
        7,
        e.revenue && data.commercial.sponsorship.budget
          ? Math.min(1, e.revenue / data.commercial.sponsorship.budget)
          : 0,
        C.amber,
      );
      const stats = [
        { label: "Active deals", value: String(e.registrations) },
        { label: "Diligence / term sheet", value: formatOaBoardUsd(e.forecast, true) },
        ...insights.events.lines.slice(0, 1).map((l) => ({ label: l.label, value: l.value })),
      ];
      stats.forEach((stat, index) => {
        const sy = colY + 68 + index * 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        setText(doc, C.muted);
        doc.text(stat.label, x + 5, sy);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        setText(doc, C.text);
        doc.text(stat.value, x + 5, sy + 7);
      });
    }
    drawFooter(doc, data.packName, 9);
  }

  // Slide 10 — Team
  {
    addSlide(doc);
    drawHeader(doc, "Team & Organisation", logoDataUrl, "Houston HQ · hiring · training");
    [
      { label: "Headcount", value: String(data.team.headcount), x: MARGIN, color: C.navy },
      { label: "Open roles", value: String(data.team.openRoles), x: MARGIN + 72, color: C.amber },
      {
        label: "Joiners pipeline",
        value: String(data.team.joiners.length),
        x: MARGIN + 144,
        color: C.green,
      },
    ].forEach((tile) => {
      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.4);
      doc.roundedRect(tile.x, 26, 66, 28, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(tile.label, tile.x + 4, 35);
      doc.setFontSize(20);
      setText(doc, tile.color);
      doc.text(tile.value, tile.x + 4, 48);
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.navy);
    doc.text("Open roles (HR)", MARGIN, 66);
    let hy = 72;
    data.team.joiners.slice(0, 3).forEach((role, i) => {
      const x = MARGIN + (i % 3) * 92;
      const y = hy + Math.floor(i / 3) * 28;
      setFill(doc, C.soft);
      doc.roundedRect(x, y, 88, 24, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      const title = doc.splitTextToSize(role.name, 80);
      doc.text(title.slice(0, 2), x + 3, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text(role.role, x + 3, y + 18);
    });

    setFill(doc, C.white);
    setDraw(doc, C.accentLine);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, 108, CONTENT_W, 40, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Organisation notes", MARGIN + 4, 116);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.text);
    const notes = doc.splitTextToSize(data.team.notes, CONTENT_W - 10);
    doc.text(notes.slice(0, 4), MARGIN + 4, 124);
    drawFooter(doc, data.packName, 10);
  }

  // Slide 11 — Strategic Discussion (decision-first)
  {
    addSlide(doc);
    drawHeader(doc, "Strategic Discussion & AOB", logoDataUrl, "Decisions required this cycle");
    const cardW = (CONTENT_W - 6) / 2;
    const cardH = 48;
    data.strategicTopics.slice(0, 4).forEach((topic, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = MARGIN + col * (cardW + 6);
      const y = 24 + row * (cardH + 4);
      const priorityTone: PillTone =
        topic.priority === "HIGH" ? "red" : topic.priority === "MEDIUM" ? "amber" : "green";

      setFill(doc, C.white);
      setDraw(doc, C.accentLine);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");

      drawStatusPill(doc, x + cardW - 28, y + 3, 24, 7, topic.priority, priorityTone);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.navy);
      const issue = doc.splitTextToSize(topic.issue, cardW - 36);
      doc.text(issue.slice(0, 1), x + 4, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(doc, C.muted);
      const why = doc.splitTextToSize(topic.whyItMatters, cardW - 10);
      doc.text(why.slice(0, 1), x + 4, y + 17);

      setFill(doc, C.navy);
      doc.roundedRect(x + 3, y + 22, cardW - 6, 20, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setText(doc, C.white);
      doc.text("DECISION REQUIRED", x + 6, y + 28);
      doc.setFontSize(8);
      const decision = doc.splitTextToSize(topic.decisionRequired, cardW - 14);
      doc.text(decision.slice(0, 2), x + 6, y + 34);
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, C.navy);
    doc.text("AOB", MARGIN, 130);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.text);
    const aob = doc.splitTextToSize(data.aob, CONTENT_W - 16);
    doc.text(aob.slice(0, 1), MARGIN + 12, 130);
    drawFooter(doc, data.packName, 11);
  }

  const buffer = doc.output("arraybuffer");
  return new Uint8Array(buffer);
}
