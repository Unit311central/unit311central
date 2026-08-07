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

function drawDonutSegment(
  doc: jsPDF,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
  color: Rgb,
) {
  const steps = Math.max(18, Math.ceil((endDeg - startDeg) / 2));
  for (let i = 0; i < steps; i += 1) {
    const a0 = startDeg + ((endDeg - startDeg) * i) / steps;
    const a1 = startDeg + ((endDeg - startDeg) * (i + 1)) / steps;
    const p0o = polar(cx, cy, outerR, a0);
    const p1o = polar(cx, cy, outerR, a1);
    const p0i = polar(cx, cy, innerR, a0);
    const p1i = polar(cx, cy, innerR, a1);
    setFill(doc, color);
    doc.triangle(p0o.x, p0o.y, p1o.x, p1o.y, p0i.x, p0i.y, "F");
    doc.triangle(p1o.x, p1o.y, p1i.x, p1i.y, p0i.x, p0i.y, "F");
  }
}

export function drawSectionPanel(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    colors: { white: Rgb; line: Rgb; navy: Rgb };
  },
) {
  const { x, y, w, h, title, colors } = opts;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, colors.navy);
  doc.text(title, x + 4, y + 7);
}

export function drawMetricRow(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
    sub?: string;
    accent: Rgb;
    colors: { white: Rgb; line: Rgb; navy: Rgb; muted: Rgb; text: Rgb };
  },
) {
  const { x, y, w, h, label, value, sub, accent, colors } = opts;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, h, 1.2, 1.2, "FD");
  setFill(doc, accent);
  doc.roundedRect(x, y, 2, h, 1.2, 0, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setText(doc, colors.muted);
  doc.text(label.toUpperCase(), x + 5, y + 6);
  doc.setFontSize(12);
  setText(doc, colors.navy);
  doc.text(value, x + 5, y + 13);
  if (sub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, colors.text);
    doc.text(sub, x + 5, y + 18);
  }
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
    centerLabel?: string;
    centerSubLabel?: string;
    legendBelow?: boolean;
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
    centerLabel,
    centerSubLabel,
    legendBelow = true,
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
    drawDonutSegment(doc, cx, cy, innerR, outerR, angle, end, segment.color);
    angle = end;
  }

  setFill(doc, [255, 255, 255]);
  doc.circle(cx, cy, innerR - 0.2, "F");

  if (legendBelow) {
    let legendY = cy + outerR + 4;
    const legendX = cx - outerR;
    segments.forEach((segment, index) => {
      const pct = Math.round((segment.value / total) * 100);
      setFill(doc, segment.color);
      doc.roundedRect(legendX, legendY - 3, 3, 3, 0.5, 0.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, textColor);
      doc.text(`${segment.label} (${pct}%)`, legendX + 5, legendY);
      legendY += 5;
    });
  }

  doc.setFont("helvetica", "bold");
  const labelSize = centerLabel && centerLabel.length > 10 ? 10 : 12;
  doc.setFontSize(labelSize);
  setText(doc, titleColor);
  doc.text(centerLabel ?? String(Math.round(total)), cx, cy - 1, { align: "center" });
  if (centerSubLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, mutedColor);
    doc.text(centerSubLabel, cx, cy + 5, { align: "center" });
  } else if (!centerLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, mutedColor);
    doc.text("total", cx, cy + 6, { align: "center" });
  }
}

/** Horizontal legend row (e.g. risk profile at slide bottom). */
export function drawLegendRow(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    title: string;
    segments: ChartSegment[];
    titleColor?: Rgb;
    textColor?: Rgb;
    bg?: Rgb;
  },
) {
  const { x, y, width, title, segments, titleColor = [0, 43, 92], textColor = [27, 36, 48], bg = [255, 255, 255] } =
    opts;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  setFill(doc, bg);
  setDraw(doc, [213, 220, 230]);
  doc.roundedRect(x, y, width, 14, 1.2, 1.2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, titleColor);
  doc.text(title, x + 4, y + 9);
  let chipX = x + 52;
  for (const segment of segments) {
    const pct = Math.round((segment.value / total) * 100);
    setFill(doc, segment.color);
    doc.roundedRect(chipX, y + 4, 3, 6, 0.5, 0.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, textColor);
    const label = `${segment.label} ${pct}%`;
    doc.text(label, chipX + 5, y + 9);
    chipX += doc.getTextWidth(label) + 14;
  }
}

export function drawStatTile(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
    sub?: string;
    accent: Rgb;
    colors: { white: Rgb; line: Rgb; navy: Rgb; muted: Rgb; text: Rgb };
  },
) {
  const { x, y, w, h, label, value, sub, accent, colors } = opts;
  setFill(doc, colors.white);
  setDraw(doc, colors.line);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
  setFill(doc, accent);
  doc.roundedRect(x, y, 2.5, h, 1.5, 0, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, colors.muted);
  doc.text(label.toUpperCase(), x + 6, y + 7);
  doc.setFontSize(16);
  setText(doc, colors.navy);
  doc.text(value, x + 6, y + 16);
  if (sub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, colors.text);
    doc.text(sub, x + 6, y + 22);
  }
}

export function drawConcernCards(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    cards: Array<{ title: string; detail: string }>;
    cardH?: number;
    colors: { white: Rgb; line: Rgb; navy: Rgb; amber: Rgb; text: Rgb };
  },
) {
  const { x, y, width, cards, cardH = 18, colors } = opts;
  cards.forEach((card, index) => {
    const cy = y + index * (cardH + 3);
    setFill(doc, colors.white);
    setDraw(doc, colors.line);
    doc.roundedRect(x, cy, width, cardH, 1.5, 1.5, "FD");
    setFill(doc, colors.amber);
    doc.roundedRect(x, cy, 3, cardH, 1.5, 0, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(cardH <= 14 ? 7 : 8);
    setText(doc, colors.navy);
    doc.text(card.title, x + 7, cy + (cardH <= 14 ? 5 : 7));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(cardH <= 14 ? 7 : 8);
    setText(doc, colors.text);
    const lines = doc.splitTextToSize(card.detail, width - 12);
    doc.text(lines.slice(0, cardH <= 14 ? 1 : 2), x + 7, cy + (cardH <= 14 ? 10 : 12));
  });
}

export function drawVerticalBarChart(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    bars: Array<{ label: string; value: number; color: Rgb; display?: string }>;
    maxValue?: number;
    title?: string;
    titleColor?: Rgb;
    labelColor?: Rgb;
    trackColor?: Rgb;
  },
) {
  const {
    x,
    y,
    width,
    height,
    bars,
    maxValue = Math.max(...bars.map((b) => b.value), 1),
    title,
    titleColor = [0, 43, 92],
    labelColor = [27, 36, 48],
    trackColor = [238, 241, 245],
  } = opts;
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, titleColor);
    doc.text(title, x, y - 2);
  }
  const chartY = y + 4;
  const chartH = height - 16;
  const barW = Math.min(28, (width - 8) / bars.length - 6);
  const gap = (width - barW * bars.length) / (bars.length + 1);
  bars.forEach((bar, index) => {
    const bx = x + gap + index * (barW + gap);
    const ratio = Math.max(0, Math.min(1, bar.value / maxValue));
    const barH = Math.max(2, chartH * ratio);
    setFill(doc, trackColor);
    doc.roundedRect(bx, chartY, barW, chartH, 1.2, 1.2, "F");
    setFill(doc, bar.color);
    doc.roundedRect(bx, chartY + chartH - barH, barW, barH, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, labelColor);
    doc.text(bar.display ?? String(bar.value), bx + barW / 2, chartY + chartH - barH - 2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setText(doc, labelColor);
    const label = doc.splitTextToSize(bar.label, barW + 4);
    doc.text(label.slice(0, 2), bx + barW / 2, chartY + chartH + 5, { align: "center" });
  });
}

export function drawSlideBackdrop(
  doc: jsPDF,
  opts: { w: number; h: number; margin?: number; imageDataUrl?: string | null; tint?: Rgb },
) {
  const { w, h, margin = 16, imageDataUrl, tint = [255, 255, 255] } = opts;
  if (imageDataUrl) {
    addImageSafe(doc, imageDataUrl, "JPEG", 0, 0, w, h);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GState = (doc as any).GState;
    if (GState) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).setGState(new GState({ opacity: 0.86 }));
      setFill(doc, tint);
      doc.rect(0, 0, w, h, "F");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).setGState(new GState({ opacity: 1 }));
    }
  }
  setFill(doc, [255, 255, 255]);
  doc.rect(margin, 22, w - margin * 2, h - 30, "F");
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

export function drawJourneyCard(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    imageDataUrl: string | null;
    imageFormat: "JPEG" | "PNG";
    country: string;
    title: string;
    subtitle: string;
    body: string;
    colors: { navy: Rgb; muted: Rgb; text: Rgb; line: Rgb; white: Rgb; green: Rgb };
  },
) {
  const { x, y, w, h, imageDataUrl, imageFormat, country, title, subtitle, body, colors } = opts;
  setDraw(doc, colors.line);
  setFill(doc, colors.white);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  const heroH = h * 0.42;
  const placed = addImageSafe(doc, imageDataUrl, imageFormat, x + 2, y + 2, w - 4, heroH);
  if (!placed) {
    setFill(doc, colors.line);
    doc.roundedRect(x + 2, y + 2, w - 4, heroH, 1, 1, "F");
  }
  setFill(doc, colors.green);
  doc.roundedRect(x + 5, y + heroH - 6, 18, 5, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setText(doc, colors.white);
  doc.text(country.toUpperCase(), x + 14, y + heroH - 2.5, { align: "center" });
  const textX = x + 5;
  const textW = w - 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, colors.navy);
  const titleLines = doc.splitTextToSize(title, textW);
  doc.text(titleLines.slice(0, 2), textX, y + heroH + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setText(doc, colors.muted);
  doc.text(subtitle, textX, y + heroH + 14);
  doc.setFontSize(7.5);
  setText(doc, colors.text);
  const bodyLines = doc.splitTextToSize(body, textW);
  doc.text(bodyLines.slice(0, 3), textX, y + heroH + 19);
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
