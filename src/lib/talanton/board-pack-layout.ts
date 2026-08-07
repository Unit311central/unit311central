import type { jsPDF } from "jspdf";

import type { AbhiActionStatus } from "@/lib/abhi/board-pack-model";
import { actionChip } from "@/lib/abhi/board-pack-pdf";
import { addImageSafe } from "@/lib/talanton/board-pack-charts";

export type LayoutColors = {
  navy: readonly [number, number, number];
  white: readonly [number, number, number];
  muted: readonly [number, number, number];
  text: readonly [number, number, number];
  line: readonly [number, number, number];
  soft: readonly [number, number, number];
  green: readonly [number, number, number];
  amber: readonly [number, number, number];
  subtleRed: readonly [number, number, number];
  decision: readonly [number, number, number];
};

const LOGO_ASPECT = 1853 / 320;
export const TALANTON_LOGO_W = 34;
export const TALANTON_LOGO_H = TALANTON_LOGO_W / LOGO_ASPECT;

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function drawTalantonLogos(
  doc: jsPDF,
  logoDataUrl: string | null,
  slideW: number,
  margin: number,
) {
  if (!logoDataUrl) return;
  const format = logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
  addImageSafe(doc, logoDataUrl, format, margin, 3.5, TALANTON_LOGO_W, TALANTON_LOGO_H);
  addImageSafe(
    doc,
    logoDataUrl,
    format,
    slideW - margin - TALANTON_LOGO_W,
    3.5,
    TALANTON_LOGO_W,
    TALANTON_LOGO_H,
  );
}

export function drawTalantonHeader(
  doc: jsPDF,
  opts: {
    title: string;
    subtitle?: string;
    logoDataUrl: string | null;
    slideW: number;
    margin: number;
    colors: LayoutColors;
  },
) {
  const { title, subtitle, logoDataUrl, slideW, margin, colors } = opts;
  drawTalantonLogos(doc, logoDataUrl, slideW, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(doc, colors.navy);
  doc.text(title, margin, 13.5);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(doc, colors.muted);
    doc.text(subtitle, margin, 18);
  }
  setDraw(doc, colors.line);
  doc.setLineWidth(0.3);
  doc.line(margin, 21, slideW - margin, 21);
}

export function drawBoardDecisionsPanel(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    decisions: string[];
    colors: LayoutColors;
  },
) {
  const { x, y, width, decisions, colors } = opts;
  setFill(doc, colors.navy);
  doc.roundedRect(x, y, width, 24, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, colors.white);
  doc.text("Board decisions required", x + 4, y + 7);
  const colW = (width - 8) / Math.min(decisions.length, 3);
  decisions.slice(0, 3).forEach((decision, index) => {
    const cx = x + 4 + index * colW;
    setFill(doc, [255, 255, 255]);
    doc.roundedRect(cx, y + 10, colW - 3, 11, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, colors.navy);
    doc.text(String(index + 1), cx + 2, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, colors.text);
    const lines = doc.splitTextToSize(decision, colW - 8);
    doc.text(lines.slice(0, 2), cx + 6, y + 16);
  });
}

export function drawRiskSummaryCard(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
    hint: string;
    accent: readonly [number, number, number];
    colors: LayoutColors;
  },
) {
  const { x, y, w, h, label, value, hint, accent, colors } = opts;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "FD");
  setFill(doc, accent);
  doc.roundedRect(x, y, 2.5, h, 1.2, 0, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, colors.muted);
  doc.text(label.toUpperCase(), x + 6, y + 7);
  doc.setFontSize(22);
  setText(doc, accent);
  doc.text(value, x + 6, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, colors.text);
  const hintLines = doc.splitTextToSize(hint, w - 10);
  doc.text(hintLines.slice(0, 2), x + 6, y + 22);
}

export function drawRiskImpactBar(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    segments: Array<{ label: string; value: number; color: readonly [number, number, number] }>;
    colors: LayoutColors;
  },
) {
  const { x, y, width, segments, colors } = opts;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, width, 16, 1.2, 1.2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, colors.navy);
  doc.text("Risk profile by impact rating", x + 4, y + 6);
  let barX = x + 68;
  const barW = width - 72;
  const barH = 5;
  const barY = y + 8;
  let offset = 0;
  for (const segment of segments) {
    const segW = Math.max(0, (segment.value / total) * barW);
    if (segW > 0) {
      setFill(doc, segment.color);
      doc.roundedRect(barX + offset, barY, segW, barH, 0.5, 0.5, "F");
      offset += segW;
    }
  }
  let chipX = x + 68;
  for (const segment of segments) {
    const pct = Math.round((segment.value / total) * 100);
    setFill(doc, segment.color);
    doc.roundedRect(chipX, y + 13.5, 2.5, 2.5, 0.3, 0.3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setText(doc, colors.text);
    const label = `${segment.label} ${pct}%`;
    doc.text(label, chipX + 4, y + 15.5);
    chipX += doc.getTextWidth(label) + 10;
  }
}

export function drawProgressBarWhiteText(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    pct: number;
    label: string;
    fill: readonly [number, number, number];
    track: readonly [number, number, number];
  },
) {
  const { x, y, width, height, pct, label, fill, track } = opts;
  setFill(doc, track);
  doc.roundedRect(x, y, width, height, 1, 1, "F");
  const fillW = Math.max(12, width * (pct / 100));
  setFill(doc, fill);
  doc.roundedRect(x, y, fillW, height, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, [255, 255, 255]);
  doc.text(label, x + 4, y + height - 3);
}

export function drawFundMiniCard(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    deployed: string;
    committed: string;
    pct: number;
    accent: readonly [number, number, number];
    colors: LayoutColors;
  },
) {
  const { x, y, w, h, name, deployed, committed, pct, accent, colors } = opts;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "FD");
  setFill(doc, accent);
  doc.roundedRect(x, y, 2, h, 1.2, 0, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, colors.navy);
  doc.text(name, x + 5, y + 7);
  doc.setFontSize(11);
  doc.text(deployed, x + 5, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, colors.muted);
  doc.text(`of ${committed} committed`, x + 5, y + 19);
  doc.text(`${pct}% deployed`, x + 5, y + 23);
}

export function drawActionRow(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    title: string;
    owner: string;
    dueDate: string;
    status: AbhiActionStatus;
    colors: LayoutColors;
  },
) {
  const { x, y, w, title, owner, dueDate, status, colors } = opts;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, 14, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setText(doc, colors.navy);
  const titleLines = doc.splitTextToSize(title, w - 42);
  doc.text(titleLines.slice(0, 1), x + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, colors.muted);
  doc.text(`${owner} · due ${dueDate}`, x + 3, y + 11);
  const chip = actionChip(status);
  setFill(doc, chip.fill);
  doc.roundedRect(x + w - 28, y + 3, 25, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setText(doc, chip.text);
  doc.text(status, x + w - 15.5, y + 8, { align: "center" });
}

export function drawStrategicTopicCard(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    issue: string;
    whyItMatters: string;
    decisionRequired: string;
    impact: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    colors: LayoutColors;
  },
) {
  const { x, y, w, h, issue, whyItMatters, decisionRequired, impact, priority, colors } = opts;
  const priorityColor =
    priority === "HIGH" ? colors.subtleRed : priority === "MEDIUM" ? colors.amber : colors.green;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
  setFill(doc, priorityColor);
  doc.roundedRect(x, y, 3, h, 1.5, 0, "F");
  setFill(doc, priorityColor);
  doc.roundedRect(x + w - 22, y + 4, 18, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setText(doc, colors.white);
  doc.text(priority, x + w - 13, y + 8.5, { align: "center" });
  doc.setFontSize(9);
  setText(doc, colors.navy);
  doc.text(issue, x + 7, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, colors.text);
  const why = doc.splitTextToSize(whyItMatters, w - 12);
  doc.text(why.slice(0, 2), x + 7, y + 15);
  setFill(doc, colors.navy);
  doc.roundedRect(x + 5, y + 24, w - 10, 12, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setText(doc, [200, 220, 240]);
  doc.text("DECISION REQUIRED", x + 8, y + 28);
  doc.setFontSize(8);
  setText(doc, colors.white);
  const dec = doc.splitTextToSize(decisionRequired, w - 16);
  doc.text(dec.slice(0, 1), x + 8, y + 33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, colors.muted);
  doc.text(`Impact: ${impact}`, x + 7, y + h - 4);
}
