import type { jsPDF } from "jspdf";

export type Rgb = readonly [number, number, number];

export type ChartSegment = {
  value: number;
  color: Rgb;
  label: string;
};

function setFill(doc: jsPDF, rgb: Rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: jsPDF, rgb: Rgb) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: Rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Donut chart with legend beneath. */
export function drawDonutChart(
  doc: jsPDF,
  opts: {
    cx: number;
    cy: number;
    outerR: number;
    innerR: number;
    segments: ChartSegment[];
    title?: string;
    titleColor?: Rgb;
    mutedColor?: Rgb;
    textColor?: Rgb;
  },
) {
  const {
    cx,
    cy,
    outerR,
    innerR,
    segments,
    title,
    titleColor = [0, 43, 92],
    mutedColor = [91, 101, 119],
    textColor = [27, 36, 48],
  } = opts;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  let angle = -90;

  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, titleColor);
    doc.text(title, cx - outerR, cy - outerR - 4);
  }

  for (const segment of segments) {
    const sweep = (segment.value / total) * 360;
    const end = angle + sweep;
    const startPt = polar(cx, cy, outerR, angle);
    doc.setFillColor(segment.color[0], segment.color[1], segment.color[2]);
    const path: Array<[string, number, number]> = [["M", startPt.x, startPt.y]];
    const steps = Math.max(8, Math.ceil(sweep / 8));
    for (let i = 1; i <= steps; i += 1) {
      const pt = polar(cx, cy, outerR, angle + (sweep * i) / steps);
      path.push(["L", pt.x, pt.y]);
    }
    const innerEnd = polar(cx, cy, innerR, end);
    path.push(["L", innerEnd.x, innerEnd.y]);
    for (let i = steps - 1; i >= 0; i -= 1) {
      const pt = polar(cx, cy, innerR, angle + (sweep * i) / steps);
      path.push(["L", pt.x, pt.y]);
    }
    path.push(["Z", 0, 0]);
    // @ts-ignore jspdf path API
    doc.path(path, "F");
    angle = end;
  }

  setFill(doc, [255, 255, 255]);
  doc.circle(cx, cy, innerR - 0.2, "F");

  let legendY = cy + outerR + 5;
  const legendX = cx - outerR;
  for (const segment of segments) {
    setFill(doc, segment.color);
    doc.roundedRect(legendX, legendY - 3, 3, 3, 0.5, 0.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, textColor);
    const pct = Math.round((segment.value / total) * 100);
    doc.text(`${segment.label} (${pct}%)`, legendX + 5, legendY);
    legendY += 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setText(doc, titleColor);
  doc.text(String(total), cx, cy + 2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, mutedColor);
  doc.text("total", cx, cy + 6, { align: "center" });
}

export function drawHorizontalBarChart(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    rowHeight: number;
    bars: Array<{ label: string; value: number; color: Rgb; display?: string }>;
    maxValue?: number;
    labelColor?: Rgb;
    trackColor?: Rgb;
    title?: string;
    titleColor?: Rgb;
  },
) {
  const {
    x,
    y,
    width,
    rowHeight,
    bars,
    maxValue = Math.max(...bars.map((b) => b.value), 1),
    labelColor = [27, 36, 48],
    trackColor = [238, 241, 245],
    title,
    titleColor = [0, 43, 92],
  } = opts;

  let rowY = y;
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, titleColor);
    doc.text(title, x, rowY);
    rowY += 6;
  }

  const labelW = width * 0.38;
  const barW = width * 0.48;
  const valueW = width * 0.14;

  for (const bar of bars) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, labelColor);
    const label = doc.splitTextToSize(bar.label, labelW - 2);
    doc.text(label.slice(0, 1), x, rowY + 3);

    const trackX = x + labelW;
    setFill(doc, trackColor);
    doc.roundedRect(trackX, rowY, barW, rowHeight - 3, 1, 1, "F");
    const ratio = Math.max(0, Math.min(1, bar.value / maxValue));
    if (ratio > 0.02) {
      setFill(doc, bar.color);
      doc.roundedRect(trackX, rowY, Math.max(4, barW * ratio), rowHeight - 3, 1, 1, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, labelColor);
    doc.text(bar.display ?? String(bar.value), trackX + barW + 2, rowY + 4);
    rowY += rowHeight;
  }
}

export function drawGauge(
  doc: jsPDF,
  opts: {
    cx: number;
    cy: number;
    radius: number;
    value: number;
    max: number;
    label: string;
    fill: Rgb;
    track?: Rgb;
    textColor?: Rgb;
    mutedColor?: Rgb;
  },
) {
  const { cx, cy, radius, value, max, label, fill, track = [238, 241, 245], textColor = [0, 43, 92], mutedColor = [91, 101, 119] } =
    opts;
  const ratio = Math.max(0, Math.min(1, value / max));
  const start = 180;
  const sweep = 180 * ratio;

  setDraw(doc, track);
  doc.setLineWidth(4);
  // background arc
  for (let deg = start; deg <= start + 180; deg += 6) {
    const a = polar(cx, cy, radius, deg);
    const b = polar(cx, cy, radius, deg + 6);
    doc.line(a.x, a.y, b.x, b.y);
  }

  setDraw(doc, fill);
  doc.setLineWidth(4);
  for (let deg = start; deg <= start + sweep; deg += 6) {
    const a = polar(cx, cy, radius, deg);
    const b = polar(cx, cy, radius, Math.min(start + sweep, deg + 6));
    doc.line(a.x, a.y, b.x, b.y);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setText(doc, textColor);
  doc.text(`${Math.round(value)}`, cx, cy + 2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, mutedColor);
  doc.text(label, cx, cy + 8, { align: "center" });
}

export function addImageSafe(
  doc: jsPDF,
  dataUrl: string | null | undefined,
  format: "JPEG" | "PNG",
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!dataUrl) return false;
  try {
    doc.addImage(dataUrl, format, x, y, w, h);
    return true;
  } catch {
    return false;
  }
}

export function drawPhotoCard(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    imageDataUrl: string | null;
    imageFormat: "JPEG" | "PNG";
    title: string;
    subtitle: string;
    body: string;
    colors: { navy: Rgb; muted: Rgb; text: Rgb; line: Rgb; white: Rgb };
  },
) {
  const { x, y, w, h, imageDataUrl, imageFormat, title, subtitle, body, colors } = opts;
  setDraw(doc, colors.line);
  setFill(doc, colors.white);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");

  const imgW = w * 0.34;
  const placed = addImageSafe(doc, imageDataUrl, imageFormat, x + 3, y + 3, imgW, h - 6);
  if (!placed) {
    setFill(doc, colors.line);
    doc.roundedRect(x + 3, y + 3, imgW, h - 6, 1, 1, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, colors.muted);
    doc.text("Photo", x + imgW / 2 + 3, y + h / 2, { align: "center" });
  }

  const textX = x + imgW + 7;
  const textW = w - imgW - 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, colors.navy);
  doc.text(title, textX, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, colors.muted);
  doc.text(subtitle, textX, y + 13);
  doc.setFontSize(8);
  setText(doc, colors.text);
  const lines = doc.splitTextToSize(body, textW);
  doc.text(lines.slice(0, 4), textX, y + 19);
}

export function drawQuotePanel(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    imageDataUrl: string | null;
    imageFormat: "JPEG" | "PNG";
    name: string;
    role: string;
    quote: string;
    colors: { navy: Rgb; muted: Rgb; text: Rgb; soft: Rgb; white: Rgb };
  },
) {
  const { x, y, w, h, imageDataUrl, imageFormat, name, role, quote, colors } = opts;
  setFill(doc, colors.soft);
  doc.roundedRect(x, y, w, h, 2, 2, "F");

  const photoSize = h - 8;
  addImageSafe(doc, imageDataUrl, imageFormat, x + 4, y + 4, photoSize, photoSize);

  const textX = x + photoSize + 10;
  const textW = w - photoSize - 14;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  setText(doc, colors.text);
  const quoteLines = doc.splitTextToSize(`"${quote}"`, textW);
  doc.text(quoteLines.slice(0, 4), textX, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, colors.navy);
  doc.text(name, textX, y + h - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, colors.muted);
  doc.text(role, textX, y + h - 5);
}
