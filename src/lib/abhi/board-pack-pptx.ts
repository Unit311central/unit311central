import pptxgen from "pptxgenjs";

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

const COLORS = {
  navy: "0B1F3A",
  accent: "1B4F8A",
  red: "C8102E",
  white: "FFFFFF",
  light: "E8EEF7",
  muted: "94A3B8",
  amber: "F59E0B",
  green: "10B981",
  rowAlt: "122A47",
  card: "0F2744",
  warnBg: "3A1F1F",
  warnBorder: "C8102E",
  decisionBg: "132F52",
  chipGreen: "065F46",
  chipAmber: "78350F",
  chipRed: "7F1D1D",
  heatLow: "1A3A2A",
  heatMed: "3A2F14",
  heatHigh: "3A1A1A",
} as const;

const SLIDE_W = 13.33;
const MARGIN = 0.55;

export function abhiBoardPackPptxFileName(meetingDate: string): string {
  return `Board Pack - ${meetingDate}.pptx`;
}

function riskRatingColor(risk: AbhiBoardRisk): string {
  const band = abhiRiskRatingBand(risk);
  if (band === "High") return COLORS.red;
  if (band === "Medium") return COLORS.amber;
  return COLORS.green;
}

function actionStatusFill(status: AbhiActionStatus): string {
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

function orgStatusColor(status: AbhiBoardPackData["orgStatus"]): string {
  if (status === "Green") return COLORS.green;
  if (status === "Red") return COLORS.red;
  return COLORS.amber;
}

function paintSlideBackground(slide: pptxgen.Slide) {
  slide.background = { color: COLORS.navy };
}

function addHeaderBar(slide: pptxgen.Slide, title: string, subtitle?: string) {
  slide.addShape("rect" as pptxgen.SHAPE_NAME, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.08,
    fill: { color: COLORS.red },
    line: { color: COLORS.red, width: 0 },
  });
  slide.addText(title, {
    x: MARGIN,
    y: 0.35,
    w: SLIDE_W - MARGIN * 2,
    h: 0.55,
    fontSize: 22,
    bold: true,
    color: COLORS.white,
    fontFace: "Calibri",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: MARGIN,
      y: 0.92,
      w: SLIDE_W - MARGIN * 2,
      h: 0.35,
      fontSize: 11,
      color: COLORS.muted,
      fontFace: "Calibri",
    });
  }
}

function addFooter(
  slide: pptxgen.Slide,
  pptx: pptxgen,
  logoDataUrl: string | null,
  packName: string,
  slideNumber: number,
) {
  slide.addShape("rect" as pptxgen.SHAPE_NAME, {
    x: 0,
    y: 7.05,
    w: SLIDE_W,
    h: 0.45,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent, width: 0 },
  });
  if (logoDataUrl) {
    slide.addImage({
      data: logoDataUrl,
      x: MARGIN,
      y: 7.1,
      w: 0.55,
      h: 0.35,
    });
  }
  slide.addText(packName, {
    x: logoDataUrl ? 1.25 : MARGIN,
    y: 7.18,
    w: 9,
    h: 0.25,
    fontSize: 8,
    color: COLORS.light,
    fontFace: "Calibri",
  });
  slide.addText(`Confidential  ·  Slide ${slideNumber}`, {
    x: SLIDE_W - 2.2,
    y: 7.18,
    w: 1.6,
    h: 0.25,
    fontSize: 8,
    color: COLORS.light,
    align: "right",
    fontFace: "Calibri",
  });
}

function bulletBlock(
  items: string[],
  symbol = "•",
): { text: string; options: pptxgen.TextPropsOptions }[] {
  return items.flatMap((item, index) => [
    {
      text: `${symbol} ${item}`,
      options: {
        fontSize: 10,
        color: COLORS.light,
        fontFace: "Calibri",
        breakLine: index < items.length - 1,
        paraSpaceAfter: 4,
      },
    },
  ]);
}

function varianceText(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatAbhiBoardGbp(value, true)}`;
}

export async function buildAbhiBoardPackPptx(
  data: AbhiBoardPackData,
  logoDataUrl: string | null,
): Promise<Uint8Array> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Association of British HealthTech Industries";
  pptx.company = "ABHI";
  pptx.title = data.packName;
  pptx.subject = "Board Meeting Pack";
  pptx.theme = {
    headFontFace: "Calibri",
    bodyFontFace: "Calibri",
  };

  let slideNumber = 0;
  const footer = (slide: pptxgen.Slide) => {
    slideNumber += 1;
    addFooter(slide, pptx, logoDataUrl, data.packName, slideNumber);
  };

  // Slide 1 — Cover
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    slide.addShape("rect" as pptxgen.SHAPE_NAME, {
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: 0.12,
      fill: { color: COLORS.red },
      line: { color: COLORS.red, width: 0 },
    });
    if (logoDataUrl) {
      slide.addImage({
        data: logoDataUrl,
        x: MARGIN,
        y: 0.55,
        w: 1.6,
        h: 1.0,
      });
    }
    slide.addText("Association of British HealthTech Industries", {
      x: MARGIN,
      y: 1.85,
      w: 10,
      h: 0.45,
      fontSize: 14,
      color: COLORS.muted,
      fontFace: "Calibri",
    });
    slide.addText("Board Meeting Pack", {
      x: MARGIN,
      y: 2.45,
      w: 11,
      h: 0.9,
      fontSize: 36,
      bold: true,
      color: COLORS.white,
      fontFace: "Calibri",
    });
    slide.addText(formatAbhiBoardDate(data.meetingDate), {
      x: MARGIN,
      y: 3.35,
      w: 8,
      h: 0.45,
      fontSize: 16,
      color: COLORS.light,
      fontFace: "Calibri",
    });
    slide.addText("CONFIDENTIAL", {
      x: MARGIN,
      y: 3.95,
      w: 3,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: COLORS.red,
      fontFace: "Calibri",
    });

    const attendeeRows: pptxgen.TableRow[] = [
      [
        { text: "Name", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Role", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
      ],
      ...data.attendees.map(
        (person): pptxgen.TableRow => [
          { text: person.name, options: { color: COLORS.light, fontSize: 10 } },
          { text: person.role, options: { color: COLORS.muted, fontSize: 10 } },
        ],
      ),
    ];
    slide.addTable(attendeeRows, {
      x: MARGIN,
      y: 4.55,
      w: 8.5,
      colW: [2.8, 5.7],
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
      fontSize: 10,
      fill: { color: COLORS.navy },
    });
    footer(slide);
  }

  // Slide 2 — Executive Summary (board paper layout)
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Executive Summary");

    const leftX = MARGIN;
    const leftW = 3.05;
    const centreX = 3.8;
    const centreW = 4.55;
    const rightX = 8.55;
    const rightW = 4.2;
    const contentTop = 1.2;
    const decisionsY = 5.85;

    // LEFT — Agenda
    slide.addText("Agenda", {
      x: leftX,
      y: contentTop,
      w: leftW,
      h: 0.28,
      fontSize: 12,
      bold: true,
      color: COLORS.white,
      fontFace: "Calibri",
    });
    data.agenda.forEach((item, index) => {
      const y = contentTop + 0.38 + index * 0.36;
      slide.addText(
        [
          {
            text: `${index + 1}`,
            options: { bold: true, color: COLORS.red, fontSize: 10, fontFace: "Calibri" },
          },
          {
            text: `  ${item}`,
            options: { color: COLORS.light, fontSize: 10, fontFace: "Calibri" },
          },
        ],
        { x: leftX, y, w: leftW, h: 0.32, valign: "middle" },
      );
    });

    // LEFT — Organisation Status (secondary)
    const statusY = 5.15;
    slide.addText("Organisation Status", {
      x: leftX,
      y: statusY,
      w: leftW,
      h: 0.22,
      fontSize: 8,
      color: COLORS.muted,
      fontFace: "Calibri",
    });
    slide.addShape("ellipse" as pptxgen.SHAPE_NAME, {
      x: leftX,
      y: statusY + 0.28,
      w: 0.22,
      h: 0.22,
      fill: { color: orgStatusColor(data.orgStatus) },
      line: { color: orgStatusColor(data.orgStatus), width: 0 },
    });
    slide.addText(data.orgStatus, {
      x: leftX + 0.32,
      y: statusY + 0.26,
      w: 1.2,
      h: 0.26,
      fontSize: 11,
      bold: true,
      color: COLORS.light,
      fontFace: "Calibri",
    });

    // CENTRE — Key Highlights (summary cards)
    slide.addText("Key Highlights", {
      x: centreX,
      y: contentTop,
      w: centreW,
      h: 0.28,
      fontSize: 12,
      bold: true,
      color: COLORS.green,
      fontFace: "Calibri",
    });
    data.highlightCards.forEach((card, index) => {
      const y = contentTop + 0.38 + index * 0.82;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: centreX,
        y,
        w: centreW,
        h: 0.74,
        fill: { color: COLORS.card },
        line: { color: COLORS.accent, width: 0.75 },
        rectRadius: 0.04,
      });
      slide.addShape("rect" as pptxgen.SHAPE_NAME, {
        x: centreX,
        y,
        w: 0.06,
        h: 0.74,
        fill: { color: COLORS.green },
        line: { color: COLORS.green, width: 0 },
      });
      slide.addText(card.title, {
        x: centreX + 0.18,
        y: y + 0.08,
        w: centreW - 0.3,
        h: 0.2,
        fontSize: 9,
        bold: true,
        color: COLORS.muted,
        fontFace: "Calibri",
      });
      slide.addText(card.primary, {
        x: centreX + 0.18,
        y: y + 0.28,
        w: centreW - 0.3,
        h: 0.22,
        fontSize: 13,
        bold: true,
        color: COLORS.white,
        fontFace: "Calibri",
      });
      if (card.secondary) {
        slide.addText(card.secondary, {
          x: centreX + 0.18,
          y: y + 0.5,
          w: centreW - 0.3,
          h: 0.18,
          fontSize: 9,
          color: COLORS.light,
          fontFace: "Calibri",
        });
      }
    });

    // RIGHT — Key Concerns (issue cards)
    slide.addText("Key Concerns", {
      x: rightX,
      y: contentTop,
      w: rightW,
      h: 0.28,
      fontSize: 12,
      bold: true,
      color: COLORS.amber,
      fontFace: "Calibri",
    });
    data.concernCards.forEach((card, index) => {
      const y = contentTop + 0.38 + index * 0.82;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: rightX,
        y,
        w: rightW,
        h: 0.74,
        fill: { color: COLORS.warnBg },
        line: { color: COLORS.warnBorder, width: 1 },
        rectRadius: 0.04,
      });
      slide.addShape("rect" as pptxgen.SHAPE_NAME, {
        x: rightX,
        y,
        w: 0.06,
        h: 0.74,
        fill: { color: COLORS.amber },
        line: { color: COLORS.amber, width: 0 },
      });
      slide.addText(card.title, {
        x: rightX + 0.18,
        y: y + 0.12,
        w: rightW - 0.3,
        h: 0.2,
        fontSize: 9,
        bold: true,
        color: COLORS.amber,
        fontFace: "Calibri",
      });
      slide.addText(card.detail, {
        x: rightX + 0.18,
        y: y + 0.36,
        w: rightW - 0.3,
        h: 0.26,
        fontSize: 13,
        bold: true,
        color: COLORS.white,
        fontFace: "Calibri",
      });
    });

    // BOTTOM — Board Decisions Required
    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: decisionsY,
      w: 12.2,
      h: 1.05,
      fill: { color: COLORS.decisionBg },
      line: { color: COLORS.red, width: 1.25 },
      rectRadius: 0.04,
    });
    slide.addText("Board Decisions Required", {
      x: MARGIN + 0.2,
      y: decisionsY + 0.1,
      w: 11.8,
      h: 0.24,
      fontSize: 11,
      bold: true,
      color: COLORS.red,
      fontFace: "Calibri",
    });
    data.boardDecisions.forEach((decision, index) => {
      slide.addText(`${index + 1}.  ${decision}`, {
        x: MARGIN + 0.2,
        y: decisionsY + 0.36 + index * 0.2,
        w: 11.8,
        h: 0.2,
        fontSize: 11,
        bold: true,
        color: COLORS.white,
        fontFace: "Calibri",
      });
    });
    footer(slide);
  }

  // Slide 3 — Previous Meeting Actions (board action register)
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Previous Meeting Actions", "Board action register · sorted by status priority");

    const actions = abhiSortedBoardActions(data);
    const actionRows: pptxgen.TableRow[] = [
      [
        { text: "Ref", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Action", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Owner", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Due Date", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Status", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
      ],
      ...actions.map((action, index): pptxgen.TableRow => {
        const rowFill = index % 2 === 0 ? COLORS.navy : COLORS.rowAlt;
        return [
          {
            text: action.id,
            options: { color: COLORS.light, fontSize: 9, bold: true, fill: { color: rowFill }, align: "center" },
          },
          {
            text: action.title,
            options: { color: COLORS.white, fontSize: 9, fill: { color: rowFill }, valign: "middle" },
          },
          {
            text: action.owner,
            options: { color: COLORS.light, fontSize: 9, fill: { color: rowFill } },
          },
          {
            text: action.due,
            options: { color: COLORS.muted, fontSize: 9, fill: { color: rowFill }, align: "center" },
          },
          {
            text: action.status,
            options: {
              color: COLORS.white,
              fontSize: 9,
              bold: true,
              align: "center",
              fill: { color: actionStatusFill(action.status) },
            },
          },
        ];
      }),
    ];
    slide.addTable(actionRows, {
      x: MARGIN,
      y: 1.3,
      w: 12.2,
      colW: [0.85, 6.55, 1.85, 1.35, 1.6],
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
      fontFace: "Calibri",
      valign: "middle",
      rowH: 0.58,
    });
    footer(slide);
  }

  // Slide 4 — Risk Register (board risk register)
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Risk Register", "Highest risk first · New, increasing, and overdue mitigations highlighted");

    const sortedRisks = [...data.risks].sort((a, b) => abhiRiskScore(b) - abhiRiskScore(a));
    const newCount = sortedRisks.filter((r) => r.flags.new).length;
    const increasingCount = sortedRisks.filter((r) => r.flags.increased || r.trend === "↑").length;
    const overdueMitCount = sortedRisks.filter((r) => r.flags.overdueMitigation).length;

    // Flag strip
    const flags = [
      { label: `New Risks: ${newCount}`, color: COLORS.accent },
      { label: `Increasing Risks: ${increasingCount}`, color: COLORS.amber },
      { label: `Overdue Mitigations: ${overdueMitCount}`, color: COLORS.red },
    ];
    flags.forEach((flag, index) => {
      const x = MARGIN + index * 2.85;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: 1.2,
        w: 2.7,
        h: 0.32,
        fill: { color: COLORS.card },
        line: { color: flag.color, width: 1 },
        rectRadius: 0.04,
      });
      slide.addText(flag.label, {
        x: x + 0.1,
        y: 1.24,
        w: 2.5,
        h: 0.24,
        fontSize: 9,
        bold: true,
        color: flag.color,
        fontFace: "Calibri",
        align: "center",
      });
    });

    // Mini risk heatmap (Impact × Likelihood)
    const heatX = 9.3;
    const heatY = 1.18;
    slide.addText("Risk Heatmap", {
      x: heatX,
      y: heatY,
      w: 3.4,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: COLORS.muted,
      fontFace: "Calibri",
    });
    const levels: Array<"L" | "M" | "H"> = ["L", "M", "H"];
    const heatCounts = levels.map(() => levels.map(() => 0));
    for (const risk of sortedRisks) {
      const i = hlmToScore(risk.impact) - 1;
      const j = hlmToScore(risk.likelihood) - 1;
      heatCounts[i]![j]! += 1;
    }
    levels.forEach((_impact, row) => {
      levels.forEach((_likelihood, col) => {
        const count = heatCounts[row]![col]!;
        const score = (row + 1) * (col + 1);
        const fill =
          score >= 6 ? COLORS.heatHigh : score >= 3 ? COLORS.heatMed : COLORS.heatLow;
        const x = heatX + 1.55 + col * 0.55;
        const y = heatY + 0.22 + (2 - row) * 0.28;
        slide.addShape("rect" as pptxgen.SHAPE_NAME, {
          x,
          y,
          w: 0.5,
          h: 0.25,
          fill: { color: fill },
          line: { color: COLORS.accent, width: 0.5 },
        });
        if (count > 0) {
          slide.addText(String(count), {
            x,
            y,
            w: 0.5,
            h: 0.25,
            fontSize: 9,
            bold: true,
            color: COLORS.white,
            align: "center",
            valign: "middle",
            fontFace: "Calibri",
          });
        }
      });
    });
    slide.addText("I×L", {
      x: heatX + 1.55,
      y: heatY + 1.08,
      w: 1.6,
      h: 0.18,
      fontSize: 7,
      color: COLORS.muted,
      fontFace: "Calibri",
    });

    const riskRows: pptxgen.TableRow[] = [
      [
        { text: "Risk ID", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Risk Description", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Owner", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Impact", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Likelihood", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Risk Rating", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Trend", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
        { text: "Mitigation", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Status", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent }, align: "center" } },
      ],
      ...sortedRisks.map((risk, index): pptxgen.TableRow => {
        const flagged = risk.flags.new || risk.flags.increased || risk.flags.overdueMitigation;
        const rowFill = flagged ? COLORS.warnBg : index % 2 === 0 ? COLORS.navy : COLORS.rowAlt;
        const band = abhiRiskRatingBand(risk);
        const trendLabel = abhiRiskTrendLabel(risk.trend);
        const flagPrefix = [
          risk.flags.new ? "NEW" : "",
          risk.flags.increased ? "↑" : "",
          risk.flags.overdueMitigation ? "OD MIT" : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return [
          {
            text: risk.id,
            options: { color: COLORS.light, fontSize: 8, bold: true, fill: { color: rowFill }, align: "center" },
          },
          {
            text: flagPrefix ? `${flagPrefix}  |  ${risk.risk}` : risk.risk,
            options: { color: COLORS.white, fontSize: 8, fill: { color: rowFill }, valign: "middle" },
          },
          {
            text: risk.owner,
            options: { color: COLORS.light, fontSize: 8, fill: { color: rowFill } },
          },
          {
            text: impactLikelihoodLabel(risk.impact),
            options: { color: COLORS.light, fontSize: 8, fill: { color: rowFill }, align: "center" },
          },
          {
            text: impactLikelihoodLabel(risk.likelihood),
            options: { color: COLORS.light, fontSize: 8, fill: { color: rowFill }, align: "center" },
          },
          {
            text: `${band}\n${String(risk.rating)}`,
            options: {
              color: COLORS.white,
              fontSize: 8,
              bold: true,
              align: "center",
              valign: "middle",
              fill: { color: riskRatingColor(risk) },
            },
          },
          {
            text: trendLabel,
            options: {
              color: trendLabel === "Increasing" ? COLORS.amber : trendLabel === "Reducing" ? COLORS.green : COLORS.light,
              fontSize: 8,
              bold: trendLabel === "Increasing",
              fill: { color: rowFill },
              align: "center",
            },
          },
          {
            text: risk.mitigation,
            options: { color: COLORS.muted, fontSize: 7.5, fill: { color: rowFill }, valign: "middle" },
          },
          {
            text: risk.status,
            options: { color: COLORS.white, fontSize: 8, fill: { color: rowFill }, align: "center" },
          },
        ];
      }),
    ];
    slide.addTable(riskRows, {
      x: MARGIN,
      y: 2.35,
      w: 12.2,
      colW: [0.7, 2.55, 1.15, 0.75, 0.85, 0.85, 0.95, 3.3, 1.1],
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
      fontFace: "Calibri",
      valign: "middle",
      rowH: 0.68,
    });
    footer(slide);
  }

  // Slide 5 — KPI Dashboard
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "KPI Dashboard", "Executive scorecard · actual vs budget");

    const kpiRows: pptxgen.TableRow[] = [
      [
        { text: "KPI", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Actual", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Budget", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Variance", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Trend", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
      ],
      ...data.kpis.map(
        (kpi): pptxgen.TableRow => [
          { text: kpi.name, options: { color: COLORS.light, fontSize: 10 } },
          {
            text: typeof kpi.actual === "number" ? formatAbhiBoardGbp(kpi.actual, true) : String(kpi.actual),
            options: { color: COLORS.white, fontSize: 10, bold: true },
          },
          {
            text: typeof kpi.budget === "number" ? formatAbhiBoardGbp(kpi.budget, true) : String(kpi.budget),
            options: { color: COLORS.muted, fontSize: 10 },
          },
          {
            text:
              typeof kpi.variance === "number"
                ? varianceText(kpi.variance)
                : String(kpi.variance),
            options: { color: COLORS.light, fontSize: 10 },
          },
          {
            text: abhiKpiTrendArrow(kpi.trend),
            options: {
              color: kpi.trend > 0 ? COLORS.green : kpi.trend < 0 ? COLORS.red : COLORS.amber,
              fontSize: 14,
              align: "center",
            },
          },
        ],
      ),
    ];
    slide.addTable(kpiRows, {
      x: MARGIN,
      y: 1.35,
      w: 8.5,
      colW: [3.2, 1.3, 1.3, 1.3, 0.8],
      fontSize: 10,
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
    });

    slide.addChart(
      pptx.ChartType.line,
      [
        {
          name: "Revenue trend",
          labels: data.kpis[1]?.sparkline.map((_, index) => `M${index + 1}`) ?? [],
          values: data.kpis[1]?.sparkline ?? [],
        },
      ],
      {
        x: 9.3,
        y: 1.35,
        w: 3.5,
        h: 2.6,
        chartColors: [COLORS.red],
        showLegend: false,
        showTitle: true,
        title: "Revenue sparkline",
        titleColor: COLORS.light,
        titleFontSize: 10,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );

    slide.addChart(
      pptx.ChartType.line,
      [
        {
          name: "Cash trend",
          labels: data.balanceSheet.cashTrend.map((_, index) => `M${index + 1}`) ?? [],
          values: data.balanceSheet.cashTrend,
        },
      ],
      {
        x: 9.3,
        y: 4.2,
        w: 3.5,
        h: 2.5,
        chartColors: [COLORS.accent],
        showLegend: false,
        showTitle: true,
        title: "Cash sparkline",
        titleColor: COLORS.light,
        titleFontSize: 10,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );
    footer(slide);
  }

  // Slide 6 — Financial Overview
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Financial Overview", "Executive financial summary");

    const tiles = [
      data.financialOverview.revenueVsBudget,
      data.financialOverview.operatingSurplus,
      data.financialOverview.cashPosition,
    ];
    tiles.forEach((tile, index) => {
      const x = MARGIN + index * 4.1;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: 1.35,
        w: 3.85,
        h: 1.45,
        fill: { color: COLORS.accent },
        line: { color: COLORS.accent, width: 0 },
        rectRadius: 0.06,
      });
      slide.addText(tile.label, {
        x: x + 0.2,
        y: 1.48,
        w: 3.4,
        h: 0.3,
        fontSize: 10,
        color: COLORS.light,
        fontFace: "Calibri",
      });
      slide.addText(formatAbhiBoardGbp(tile.actual, true), {
        x: x + 0.2,
        y: 1.85,
        w: 3.4,
        h: 0.55,
        fontSize: 24,
        bold: true,
        color: COLORS.white,
        fontFace: "Calibri",
      });
      if (tile.budget !== undefined) {
        slide.addText(
          `Budget ${formatAbhiBoardGbp(tile.budget, true)} · Var ${varianceText(tile.variance ?? tile.actual - tile.budget)}`,
          {
            x: x + 0.2,
            y: 2.45,
            w: 3.4,
            h: 0.25,
            fontSize: 9,
            color: COLORS.muted,
            fontFace: "Calibri",
          },
        );
      }
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 3.05,
      w: 12.2,
      h: 0.95,
      fill: { color: COLORS.rowAlt },
      line: { color: COLORS.accent, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText("Forecast Year End", {
      x: MARGIN + 0.2,
      y: 3.18,
      w: 3,
      h: 0.25,
      fontSize: 10,
      color: COLORS.light,
      fontFace: "Calibri",
    });
    const forecast = data.financialOverview.forecastYearEnd;
    slide.addText(
      `Revenue ${formatAbhiBoardGbp(forecast.revenue, true)}  ·  Surplus ${formatAbhiBoardGbp(forecast.surplus, true)}  ·  Cash ${formatAbhiBoardGbp(forecast.cash, true)}`,
      {
        x: MARGIN + 0.2,
        y: 3.5,
        w: 11.5,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: COLORS.white,
        fontFace: "Calibri",
      },
    );

    slide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "Revenue",
          labels: ["Budget", "Actual"],
          values: [
            data.financialOverview.revenueVsBudget.budget ?? 0,
            data.financialOverview.revenueVsBudget.actual,
          ],
        },
        {
          name: "Surplus",
          labels: ["Budget", "Actual"],
          values: [
            data.financialOverview.operatingSurplus.budget ?? 0,
            data.financialOverview.operatingSurplus.actual,
          ],
        },
      ],
      {
        x: MARGIN,
        y: 4.25,
        w: 7.5,
        h: 2.55,
        barDir: "col",
        chartColors: [COLORS.accent, COLORS.red],
        showLegend: true,
        legendColor: COLORS.light,
        legendFontSize: 9,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );

    slide.addChart(
      pptx.ChartType.line,
      [
        {
          name: "Cash",
          labels: data.balanceSheet.cashTrend.map((_, index) => `M${index + 1}`),
          values: data.balanceSheet.cashTrend,
        },
      ],
      {
        x: 8.35,
        y: 4.25,
        w: 4.4,
        h: 2.55,
        chartColors: [COLORS.green],
        showLegend: false,
        showTitle: true,
        title: "Cash position trend",
        titleColor: COLORS.light,
        titleFontSize: 10,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );
    footer(slide);
  }

  // Slide 7 — Profit & Loss
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Profit & Loss", "Board-level P&L · YTD actual vs budget");

    const pnlRows: pptxgen.TableRow[] = [
      [
        { text: "Line", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Actual", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Budget", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Variance", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Prior Year", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
      ],
      ...data.pnl.rows.map(
        (row): pptxgen.TableRow => [
          {
            text: row.line,
            options: {
              color: COLORS.light,
              fontSize: row.emphasis ? 10 : 9,
              bold: Boolean(row.emphasis),
            },
          },
          {
            text: formatAbhiBoardGbp(row.actual, true),
            options: { color: COLORS.white, fontSize: 9, bold: Boolean(row.emphasis) },
          },
          {
            text: formatAbhiBoardGbp(row.budget, true),
            options: { color: COLORS.muted, fontSize: 9 },
          },
          {
            text: varianceText(row.variance),
            options: { color: COLORS.light, fontSize: 9 },
          },
          {
            text: formatAbhiBoardGbp(row.priorYear, true),
            options: { color: COLORS.muted, fontSize: 9 },
          },
        ],
      ),
    ];
    slide.addTable(pnlRows, {
      x: MARGIN,
      y: 1.35,
      w: 12.2,
      colW: [3.8, 2.1, 2.1, 2.1, 2.1],
      fontSize: 9,
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 5.85,
      w: 12.2,
      h: 1.0,
      fill: { color: COLORS.rowAlt },
      line: { color: COLORS.accent, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText("Variance commentary", {
      x: MARGIN + 0.15,
      y: 5.95,
      w: 3,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: COLORS.amber,
      fontFace: "Calibri",
    });
    slide.addText(bulletBlock(data.pnl.commentary, "–"), {
      x: MARGIN + 0.15,
      y: 6.2,
      w: 11.8,
      h: 0.6,
      valign: "top",
    });
    footer(slide);
  }

  // Slide 8 — Balance Sheet & Cash
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Balance Sheet & Cash", "Summary position and liquidity outlook");

    const summaryRows: pptxgen.TableRow[] = [
      [
        { text: "Assets", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: formatAbhiBoardGbp(data.balanceSheet.assets, true), options: { color: COLORS.white, fontSize: 12, bold: true } },
      ],
      [
        { text: "Liabilities", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: formatAbhiBoardGbp(data.balanceSheet.liabilities, true), options: { color: COLORS.light, fontSize: 12 } },
      ],
      [
        { text: "Net Assets", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: formatAbhiBoardGbp(data.balanceSheet.netAssets, true), options: { color: COLORS.white, fontSize: 12, bold: true } },
      ],
    ];
    slide.addTable(summaryRows, {
      x: MARGIN,
      y: 1.35,
      w: 4.2,
      colW: [2.0, 2.2],
      fontSize: 11,
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
    });

    const cashRows: pptxgen.TableRow[] = [
      [
        { text: "Debtors", options: { color: COLORS.light, fontSize: 10 } },
        { text: formatAbhiBoardGbp(data.balanceSheet.debtors, true), options: { color: COLORS.white, fontSize: 10 } },
      ],
      [
        { text: "Creditors", options: { color: COLORS.light, fontSize: 10 } },
        { text: formatAbhiBoardGbp(data.balanceSheet.creditors, true), options: { color: COLORS.white, fontSize: 10 } },
      ],
      [
        { text: "Cash forecast (FY)", options: { color: COLORS.light, fontSize: 10 } },
        {
          text: formatAbhiBoardGbp(data.balanceSheet.cashForecast, true),
          options: { color: COLORS.green, fontSize: 10, bold: true },
        },
      ],
    ];
    slide.addTable(cashRows, {
      x: MARGIN,
      y: 3.2,
      w: 4.2,
      colW: [2.0, 2.2],
      fontSize: 10,
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
    });

    slide.addChart(
      pptx.ChartType.line,
      [
        {
          name: "Cash at bank",
          labels: data.balanceSheet.cashTrend.map((_, index) => `M${index + 1}`),
          values: data.balanceSheet.cashTrend,
        },
      ],
      {
        x: 5.0,
        y: 1.35,
        w: 7.75,
        h: 5.5,
        chartColors: [COLORS.green],
        showLegend: false,
        showTitle: true,
        title: "Cash trend & forecast trajectory",
        titleColor: COLORS.light,
        titleFontSize: 11,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );
    footer(slide);
  }

  // Slide 9 — Commercial Performance
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Commercial Performance", "Membership, sponsorship, and events");

    const membership = data.commercial.membership;
    slide.addText("Membership", {
      x: MARGIN,
      y: 1.35,
      w: 2,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLORS.white,
      fontFace: "Calibri",
    });
    slide.addTable(
      [
        [
          { text: "New", options: { color: COLORS.light } },
          { text: String(membership.new), options: { color: COLORS.green, bold: true } },
        ],
        [
          { text: "Lost", options: { color: COLORS.light } },
          { text: String(membership.lost), options: { color: COLORS.red, bold: true } },
        ],
        [
          { text: "Net", options: { color: COLORS.light } },
          { text: String(membership.net), options: { color: COLORS.white, bold: true } },
        ],
        [
          { text: "Total", options: { color: COLORS.light } },
          { text: String(membership.total), options: { color: COLORS.white, bold: true } },
        ],
      ],
      {
        x: MARGIN,
        y: 1.7,
        w: 3.5,
        colW: [1.5, 2.0],
        fontSize: 11,
        border: { type: "solid", color: COLORS.accent, pt: 0.5 },
      },
    );

    slide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "Members",
          labels: ["New", "Lost", "Net"],
          values: [membership.new, membership.lost, membership.net],
        },
      ],
      {
        x: MARGIN,
        y: 3.8,
        w: 3.5,
        h: 2.8,
        chartColors: [COLORS.green, COLORS.red, COLORS.accent],
        showLegend: false,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );

    const sponsorship = data.commercial.sponsorship;
    slide.addText("Sponsorship", {
      x: 4.7,
      y: 1.35,
      w: 2,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLORS.white,
      fontFace: "Calibri",
    });
    slide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "Sponsorship (£)",
          labels: ["Budget", "Actual", "Forecast"],
          values: [sponsorship.budget, sponsorship.actual, sponsorship.forecast],
        },
      ],
      {
        x: 4.7,
        y: 1.7,
        w: 3.8,
        h: 4.9,
        chartColors: [COLORS.accent, COLORS.red, COLORS.amber],
        showLegend: false,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );

    const events = data.commercial.events;
    slide.addText("Events", {
      x: 8.85,
      y: 1.35,
      w: 2,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLORS.white,
      fontFace: "Calibri",
    });
    slide.addTable(
      [
        [
          { text: "Revenue", options: { color: COLORS.light } },
          { text: formatAbhiBoardGbp(events.revenue, true), options: { color: COLORS.white, bold: true } },
        ],
        [
          { text: "Registrations", options: { color: COLORS.light } },
          { text: events.registrations.toLocaleString("en-GB"), options: { color: COLORS.white, bold: true } },
        ],
        [
          { text: "Forecast", options: { color: COLORS.light } },
          { text: formatAbhiBoardGbp(events.forecast, true), options: { color: COLORS.green, bold: true } },
        ],
      ],
      {
        x: 8.85,
        y: 1.7,
        w: 3.9,
        colW: [1.8, 2.1],
        fontSize: 11,
        border: { type: "solid", color: COLORS.accent, pt: 0.5 },
      },
    );
    slide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "Events revenue",
          labels: ["Actual", "Forecast"],
          values: [events.revenue, events.forecast],
        },
      ],
      {
        x: 8.85,
        y: 3.55,
        w: 3.9,
        h: 3.05,
        chartColors: [COLORS.red, COLORS.green],
        showLegend: false,
        catAxisLabelColor: COLORS.muted,
        valAxisLabelColor: COLORS.muted,
        valGridLine: { color: COLORS.accent, size: 0.5 },
      },
    );
    footer(slide);
  }

  // Slide 10 — Team & Organisation
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Team & Organisation", "Headcount, vacancies, and recent changes");

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 1.35,
      w: 2.4,
      h: 1.2,
      fill: { color: COLORS.accent },
      line: { color: COLORS.accent, width: 0 },
      rectRadius: 0.06,
    });
    slide.addText("Headcount", {
      x: MARGIN + 0.15,
      y: 1.5,
      w: 2,
      h: 0.25,
      fontSize: 10,
      color: COLORS.light,
      fontFace: "Calibri",
    });
    slide.addText(String(data.team.headcount), {
      x: MARGIN + 0.15,
      y: 1.85,
      w: 2,
      h: 0.55,
      fontSize: 28,
      bold: true,
      color: COLORS.white,
      fontFace: "Calibri",
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: 3.2,
      y: 1.35,
      w: 2.4,
      h: 1.2,
      fill: { color: COLORS.rowAlt },
      line: { color: COLORS.accent, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText("Open roles", {
      x: 3.35,
      y: 1.5,
      w: 2,
      h: 0.25,
      fontSize: 10,
      color: COLORS.light,
      fontFace: "Calibri",
    });
    slide.addText(String(data.team.openRoles), {
      x: 3.35,
      y: 1.85,
      w: 2,
      h: 0.55,
      fontSize: 28,
      bold: true,
      color: COLORS.amber,
      fontFace: "Calibri",
    });

    const joinerRows: pptxgen.TableRow[] = [
      [
        { text: "Recent joiners", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Role", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Start", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
      ],
      ...data.team.joiners.map(
        (person): pptxgen.TableRow => [
          { text: person.name, options: { color: COLORS.light, fontSize: 10 } },
          { text: person.role, options: { color: COLORS.muted, fontSize: 10 } },
          { text: person.startDate, options: { color: COLORS.muted, fontSize: 10 } },
        ],
      ),
    ];
    slide.addTable(joinerRows, {
      x: MARGIN,
      y: 2.85,
      w: 5.8,
      colW: [2.0, 2.5, 1.3],
      fontSize: 10,
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
    });

    const leaverRows: pptxgen.TableRow[] = [
      [
        { text: "Recent leavers", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "Role", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
        { text: "End", options: { bold: true, color: COLORS.white, fill: { color: COLORS.accent } } },
      ],
      ...data.team.leavers.map(
        (person): pptxgen.TableRow => [
          { text: person.name, options: { color: COLORS.light, fontSize: 10 } },
          { text: person.role, options: { color: COLORS.muted, fontSize: 10 } },
          { text: person.endDate, options: { color: COLORS.muted, fontSize: 10 } },
        ],
      ),
    ];
    slide.addTable(leaverRows, {
      x: 6.75,
      y: 2.85,
      w: 5.8,
      colW: [2.0, 2.5, 1.3],
      fontSize: 10,
      border: { type: "solid", color: COLORS.accent, pt: 0.5 },
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 5.0,
      w: 12.2,
      h: 1.35,
      fill: { color: COLORS.rowAlt },
      line: { color: COLORS.accent, width: 0.5 },
      rectRadius: 0.06,
    });
    slide.addText("Organisation notes", {
      x: MARGIN + 0.15,
      y: 5.12,
      w: 3,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: COLORS.amber,
      fontFace: "Calibri",
    });
    slide.addText(data.team.notes, {
      x: MARGIN + 0.15,
      y: 5.45,
      w: 11.8,
      h: 0.75,
      fontSize: 10,
      color: COLORS.light,
      fontFace: "Calibri",
      valign: "top",
    });
    footer(slide);
  }

  // Slide 11 — Strategic Discussion & AOB
  {
    const slide = pptx.addSlide();
    paintSlideBackground(slide);
    addHeaderBar(slide, "Strategic Discussion & AOB", "Board topics requiring decision or debate");

    data.strategicTopics.forEach((topic, index) => {
      const y = 1.35 + index * 1.28;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: MARGIN,
        y,
        w: 12.2,
        h: 1.15,
        fill: { color: index % 2 === 0 ? COLORS.rowAlt : COLORS.navy },
        line: { color: COLORS.accent, width: 0.5 },
        rectRadius: 0.05,
      });
      slide.addText(topic.issue, {
        x: MARGIN + 0.15,
        y: y + 0.08,
        w: 11.8,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: COLORS.white,
        fontFace: "Calibri",
      });
      slide.addText(`Evidence: ${topic.evidence}`, {
        x: MARGIN + 0.15,
        y: y + 0.38,
        w: 11.8,
        h: 0.35,
        fontSize: 8.5,
        color: COLORS.muted,
        fontFace: "Calibri",
      });
      slide.addText(`Recommendation: ${topic.recommendation}`, {
        x: MARGIN + 0.15,
        y: y + 0.75,
        w: 11.8,
        h: 0.35,
        fontSize: 8.5,
        color: COLORS.light,
        fontFace: "Calibri",
      });
    });

    slide.addText(`AOB: ${data.aob}`, {
      x: MARGIN,
      y: 6.55,
      w: 12.2,
      h: 0.35,
      fontSize: 9,
      color: COLORS.muted,
      fontFace: "Calibri",
    });
    footer(slide);
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return new Uint8Array(buffer);
}
