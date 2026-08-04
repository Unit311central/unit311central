import pptxgen from "pptxgenjs";

import {
  ONWARDAIR_LOGO_INTRINSIC_HEIGHT,
  ONWARDAIR_LOGO_INTRINSIC_WIDTH,
} from "@/lib/onwardair-surface";
import {
  abhiRiskRatingBand,
  abhiRiskScore,
  abhiRiskTrendLabel,
  abhiSortedBoardActions,
  formatAbhiBoardBudgetStatus,
  formatAbhiBoardBudgetVarianceNarrative,
  formatAbhiBoardDate,
  formatAbhiBoardKpiValue,
  formatAbhiBoardKpiVariance,
  type AbhiActionStatus,
  type AbhiBoardKpi,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
  type AbhiKpiIndicator,
} from "@/lib/abhi/board-pack-model";
import { formatOaBoardUsd } from "@/lib/onwardair/board-pack-model";

/** OnwardAir board-paper palette — white page, teal accent lines (home RGB 38,123,144). */
const C = {
  navy: "267B90",
  navySoft: "1F6A7C",
  white: "FFFFFF",
  page: "FFFFFF",
  soft: "EEF1F5",
  line: "267B90",
  text: "1B2430",
  muted: "5B6577",
  subtleRed: "A6192E",
  green: "0F766E",
  amber: "B45309",
  chipGreen: "D1FAE5",
  chipAmber: "FEF3C7",
  chipRed: "FEE2E2",
  chipGreenText: "065F46",
  chipAmberText: "92400E",
  chipRedText: "991B1B",
  decision: "E8F4F7",
} as const;

const SLIDE_W = 13.33;
const MARGIN = 0.5;
const CONTENT_TOP = 1.05;
const FOOTER_Y = 7.05;

export function oaBoardPackPptxFileName(meetingDate: string): string {
  return `Board Pack - ${meetingDate}.pptx`;
}

function actionChip(status: AbhiActionStatus): { fill: string; text: string } {
  if (status === "Completed") return { fill: C.chipGreen, text: C.chipGreenText };
  if (status === "Underway") return { fill: C.chipAmber, text: C.chipAmberText };
  return { fill: C.chipRed, text: C.chipRedText };
}

function indicatorChip(indicator: AbhiKpiIndicator): { fill: string; text: string } {
  if (indicator === "On track") return { fill: C.chipGreen, text: C.chipGreenText };
  if (indicator === "Watch") return { fill: C.chipAmber, text: C.chipAmberText };
  return { fill: C.chipRed, text: C.chipRedText };
}

function varianceText(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatOaBoardUsd(value, true)}`;
}

function paintSlide(slide: pptxgen.Slide) {
  slide.background = { color: C.page };
}

/** Transparent PNG wordmark — consistent size, correct aspect. */
const LOGO_W = 1.35;
const LOGO_H = LOGO_W * (ONWARDAIR_LOGO_INTRINSIC_HEIGHT / ONWARDAIR_LOGO_INTRINSIC_WIDTH);

function addLogo(slide: pptxgen.Slide, logoDataUrl: string | null) {
  if (!logoDataUrl) return;
  slide.addImage({
    data: logoDataUrl,
    x: SLIDE_W - MARGIN - LOGO_W,
    y: 0.28,
    w: LOGO_W,
    h: LOGO_H,
  });
}

function boardAttentionForRisk(risk: AbhiBoardRisk): string {
  if (risk.flags.overdueMitigation) return "Mitigation overdue — escalate this cycle";
  if (risk.flags.increased || risk.trend === "↑") return "Increasing — board oversight required";
  if (risk.flags.new) return "New risk — confirm ownership and response";
  if (abhiRiskRatingBand(risk) === "High") return "High exposure — monitor closely";
  if (abhiRiskRatingBand(risk) === "Medium") return "Watch — review at next meeting";
  return "Monitor";
}

function addProgressBar(
  slide: pptxgen.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fillColor: string,
) {
  const clamped = Math.max(0, Math.min(1, ratio));
  slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
    x,
    y,
    w,
    h,
    fill: { color: C.soft },
    line: { color: C.soft, width: 0 },
    rectRadius: 0.08,
  });
  if (clamped > 0.02) {
    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x,
      y,
      w: Math.max(0.12, w * clamped),
      h,
      fill: { color: fillColor },
      line: { color: fillColor, width: 0 },
      rectRadius: 0.08,
    });
  }
}

function addStatusPill(
  slide: pptxgen.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  tone: "green" | "amber" | "red" | "navy",
) {
  const fill =
    tone === "green"
      ? C.chipGreen
      : tone === "amber"
        ? C.chipAmber
        : tone === "red"
          ? C.chipRed
          : C.decision;
  const text =
    tone === "green"
      ? C.chipGreenText
      : tone === "amber"
        ? C.chipAmberText
        : tone === "red"
          ? C.chipRedText
          : C.navy;
  slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: fill, width: 0 },
    rectRadius: 0.1,
  });
  slide.addText(label, {
    x,
    y,
    w,
    h,
    fontSize: 11,
    bold: true,
    color: text,
    align: "center",
    valign: "middle",
    fontFace: "Calibri",
  });
}

function addHeader(
  slide: pptxgen.Slide,
  title: string,
  opts?: { subtitle?: string; logoDataUrl?: string | null; titleWidth?: number },
) {
  addLogo(slide, opts?.logoDataUrl ?? null);
  slide.addText(title, {
    x: MARGIN,
    y: 0.28,
    w: opts?.titleWidth ?? SLIDE_W - MARGIN * 2 - 1.4,
    h: 0.45,
    fontSize: 26,
    bold: true,
    color: C.navy,
    fontFace: "Calibri",
  });
  if (opts?.subtitle) {
    slide.addText(opts.subtitle, {
      x: MARGIN,
      y: 0.72,
      w: SLIDE_W - MARGIN * 2 - 1.4,
      h: 0.28,
      fontSize: 12,
      color: C.muted,
      fontFace: "Calibri",
    });
  }
  slide.addShape("rect" as pptxgen.SHAPE_NAME, {
    x: MARGIN,
    y: 0.95,
    w: SLIDE_W - MARGIN * 2,
    h: 0.015,
    fill: { color: C.line },
    line: { color: C.line, width: 0 },
  });
}

function addFooter(slide: pptxgen.Slide, packName: string, slideNumber: number) {
  slide.addShape("rect" as pptxgen.SHAPE_NAME, {
    x: 0,
    y: FOOTER_Y,
    w: SLIDE_W,
    h: 0.45,
    fill: { color: C.navy },
    line: { color: C.navy, width: 0 },
  });
  slide.addText(packName, {
    x: MARGIN,
    y: 7.16,
    w: 8,
    h: 0.24,
    fontSize: 10,
    color: C.white,
    fontFace: "Calibri",
  });
  slide.addText(`Confidential  ·  Slide ${slideNumber}`, {
    x: SLIDE_W - 3.2,
    y: 7.16,
    w: 2.7,
    h: 0.24,
    fontSize: 10,
    color: C.white,
    align: "right",
    fontFace: "Calibri",
  });
}

function sectionLabel(
  slide: pptxgen.Slide,
  text: string,
  x: number,
  y: number,
  w: number,
  color: string = C.navy,
) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 0.32,
    fontSize: 14,
    bold: true,
    color,
    fontFace: "Calibri",
  });
}

export async function buildOnwardAirBoardPackPptx(
  data: AbhiBoardPackData,
  logoDataUrl: string | null,
): Promise<Uint8Array> {
  const { validateAndSanitizeAbhiBoardPackData } = await import(
    "@/lib/abhi/board-pack-validate"
  );
  data = validateAndSanitizeAbhiBoardPackData(data).data;

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "OnwardAir";
  pptx.company = "ABHI";
  pptx.title = data.packName;
  pptx.subject = "Board Deck";
  pptx.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

  let slideNumber = 0;
  const finish = (slide: pptxgen.Slide) => {
    slideNumber += 1;
    addFooter(slide, data.packName, slideNumber);
  };

  // ——— Slide 1 Cover ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    if (logoDataUrl) {
      slide.addImage({
        data: logoDataUrl,
        x: MARGIN,
        y: 0.55,
        w: LOGO_W * 1.45,
        h: LOGO_H * 1.45,
      });
    }
    slide.addText("OnwardAir", {
      x: MARGIN,
      y: 1.9,
      w: 10,
      h: 0.35,
      fontSize: 14,
      color: C.muted,
      fontFace: "Calibri",
    });
    slide.addText("Board Deck", {
      x: MARGIN,
      y: 2.35,
      w: 11,
      h: 0.7,
      fontSize: 40,
      bold: true,
      color: C.navy,
      fontFace: "Calibri",
    });
    slide.addText(formatAbhiBoardDate(data.meetingDate), {
      x: MARGIN,
      y: 3.15,
      w: 8,
      h: 0.4,
      fontSize: 18,
      color: C.text,
      fontFace: "Calibri",
    });
    slide.addText("CONFIDENTIAL", {
      x: MARGIN,
      y: 3.65,
      w: 3,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: C.subtleRed,
      fontFace: "Calibri",
    });

    const attendeeRows: pptxgen.TableRow[] = [
      [
        { text: "Name", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Role", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ...data.attendees.map(
        (person, index): pptxgen.TableRow => [
          {
            text: person.name,
            options: {
              color: C.text,
              fontSize: 12,
              fill: { color: index % 2 ? C.soft : C.white },
            },
          },
          {
            text: person.role,
            options: {
              color: C.muted,
              fontSize: 12,
              fill: { color: index % 2 ? C.soft : C.white },
            },
          },
        ],
      ),
    ];
    slide.addTable(attendeeRows, {
      x: MARGIN,
      y: 4.2,
      w: 9.5,
      colW: [3.2, 6.3],
      border: { type: "solid", color: C.line, pt: 0.5 },
      fontFace: "Calibri",
      fontSize: 12,
    });
    finish(slide);
  }

  // ——— Slide 2 Executive Summary ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Executive Summary", { logoDataUrl, titleWidth: 8.5 });

    // Org status beside heading
    slide.addText("Organisation Status", {
      x: 9.2,
      y: 0.28,
      w: 1.8,
      h: 0.22,
      fontSize: 9,
      color: C.muted,
      fontFace: "Calibri",
    });
    const statusColor =
      data.orgStatus === "Green" ? C.green : data.orgStatus === "Red" ? C.subtleRed : C.amber;
    slide.addShape("ellipse" as pptxgen.SHAPE_NAME, {
      x: 9.2,
      y: 0.54,
      w: 0.2,
      h: 0.2,
      fill: { color: statusColor },
      line: { color: statusColor, width: 0 },
    });
    slide.addText(data.orgStatus, {
      x: 9.5,
      y: 0.5,
      w: 1.2,
      h: 0.28,
      fontSize: 13,
      bold: true,
      color: C.text,
      fontFace: "Calibri",
    });

    const leftX = MARGIN;
    const leftW = 3.2;
    const centreX = 3.95;
    const centreW = 4.4;
    const rightX = 8.55;
    const rightW = 4.25;
    const bodyTop = 1.2;
    const cardsTop = 1.55;

    sectionLabel(slide, "Agenda", leftX, bodyTop, leftW);
    data.agenda.forEach((item, index) => {
      const y = bodyTop + 0.4 + index * 0.38;
      slide.addText(
        [
          { text: `${index + 1}`, options: { bold: true, color: C.navy, fontSize: 13 } },
          { text: `   ${item}`, options: { color: C.text, fontSize: 13 } },
        ],
        { x: leftX, y, w: leftW, h: 0.36, fontFace: "Calibri", valign: "middle" },
      );
    });

    sectionLabel(slide, "Key Highlights", centreX, cardsTop, centreW, C.green);
    data.highlightCards.forEach((card, index) => {
      const y = cardsTop + 0.4 + index * 0.72;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: centreX,
        y,
        w: centreW,
        h: 0.64,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.04,
      });
      slide.addText(card.title, {
        x: centreX + 0.18,
        y: y + 0.06,
        w: centreW - 0.3,
        h: 0.18,
        fontSize: 10,
        color: C.muted,
        bold: true,
        fontFace: "Calibri",
      });
      slide.addText(card.primary, {
        x: centreX + 0.18,
        y: y + 0.24,
        w: centreW - 0.3,
        h: 0.22,
        fontSize: 15,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      if (card.secondary) {
        slide.addText(card.secondary, {
          x: centreX + 0.18,
          y: y + 0.44,
          w: centreW - 0.3,
          h: 0.16,
          fontSize: 11,
          color: C.text,
          fontFace: "Calibri",
        });
      }
    });

    sectionLabel(slide, "Key Concerns", rightX, cardsTop, rightW, C.amber);
    data.concernCards.forEach((card, index) => {
      const y = cardsTop + 0.4 + index * 0.72;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: rightX,
        y,
        w: rightW,
        h: 0.64,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.04,
      });
      slide.addText(card.title, {
        x: rightX + 0.18,
        y: y + 0.1,
        w: rightW - 0.3,
        h: 0.18,
        fontSize: 10,
        color: C.muted,
        bold: true,
        fontFace: "Calibri",
      });
      slide.addText(card.detail, {
        x: rightX + 0.18,
        y: y + 0.3,
        w: rightW - 0.3,
        h: 0.24,
        fontSize: 15,
        bold: true,
        color: C.text,
        fontFace: "Calibri",
      });
    });

    // Board Decisions — white text on navy band (subtle, prominent)
    const dy = 5.75;
    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: dy,
      w: SLIDE_W - MARGIN * 2,
      h: 1.15,
      fill: { color: C.navy },
      line: { color: C.navy, width: 0 },
      rectRadius: 0.04,
    });
    slide.addText("Board Decisions Required", {
      x: MARGIN + 0.25,
      y: dy + 0.12,
      w: 12,
      h: 0.28,
      fontSize: 14,
      bold: true,
      color: C.white,
      fontFace: "Calibri",
    });
    data.boardDecisions.forEach((decision, index) => {
      slide.addText(`${index + 1}.  ${decision}`, {
        x: MARGIN + 0.25,
        y: dy + 0.42 + index * 0.22,
        w: 12,
        h: 0.22,
        fontSize: 13,
        color: C.white,
        fontFace: "Calibri",
      });
    });
    finish(slide);
  }

  // ——— Slide 3 Previous Actions ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Previous Meeting Actions", {
      logoDataUrl,
      subtitle: "Board action register",
    });

    const actions = abhiSortedBoardActions(data);
    const rows: pptxgen.TableRow[] = [
      [
        { text: "Ref", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
        { text: "Action", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Owner", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Due Date", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
        { text: "Status", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
      ],
      ...actions.map((action, index): pptxgen.TableRow => {
        const fill = index % 2 ? C.soft : C.white;
        const chip = actionChip(action.status);
        return [
          { text: action.id, options: { color: C.navy, fontSize: 12, bold: true, fill: { color: fill }, align: "center" } },
          { text: action.title, options: { color: C.text, fontSize: 12, fill: { color: fill }, valign: "middle" } },
          { text: action.owner, options: { color: C.text, fontSize: 12, fill: { color: fill } } },
          { text: action.due, options: { color: C.muted, fontSize: 12, fill: { color: fill }, align: "center" } },
          {
            text: action.status,
            options: {
              color: chip.text,
              fontSize: 12,
              bold: true,
              align: "center",
              fill: { color: chip.fill },
            },
          },
        ];
      }),
    ];
    slide.addTable(rows, {
      x: MARGIN,
      y: CONTENT_TOP + 0.15,
      w: SLIDE_W - MARGIN * 2,
      colW: [0.95, 6.4, 2.0, 1.45, 1.55],
      border: { type: "solid", color: C.line, pt: 0.6 },
      fontFace: "Calibri",
      valign: "middle",
      rowH: 0.62,
    });
    finish(slide);
  }

  // ——— Slide 4 Risk Register (executive briefing) ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Risk Register", {
      logoDataUrl,
      subtitle: "Executive risk briefing",
    });

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
    summary.forEach((item, index) => {
      const x = MARGIN + index * 4.2;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.05,
        w: 4.0,
        h: 1.15,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.05,
      });
      slide.addText(item.label, {
        x: x + 0.25,
        y: CONTENT_TOP + 0.2,
        w: 3.5,
        h: 0.28,
        fontSize: 13,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(item.value, {
        x: x + 0.25,
        y: CONTENT_TOP + 0.5,
        w: 3.5,
        h: 0.55,
        fontSize: 36,
        bold: true,
        color: item.color,
        fontFace: "Calibri",
      });
    });

    const rows: pptxgen.TableRow[] = [
      [
        { text: "Risk", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Owner", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Trend", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
        {
          text: "Board Attention Required",
          options: { bold: true, color: C.white, fill: { color: C.navy } },
        },
      ],
      ...sorted.map((risk, index): pptxgen.TableRow => {
        const fill = index % 2 ? C.soft : C.white;
        const trend = abhiRiskTrendLabel(risk.trend);
        return [
          {
            text: risk.risk,
            options: { color: C.text, fontSize: 14, fill: { color: fill }, valign: "middle" },
          },
          {
            text: risk.owner,
            options: { color: C.navy, fontSize: 14, bold: true, fill: { color: fill }, valign: "middle" },
          },
          {
            text: trend,
            options: {
              color: trend === "Increasing" ? C.amber : trend === "Reducing" ? C.green : C.text,
              fontSize: 14,
              bold: trend === "Increasing",
              fill: { color: fill },
              align: "center",
              valign: "middle",
            },
          },
          {
            text: boardAttentionForRisk(risk),
            options: { color: C.text, fontSize: 13, fill: { color: fill }, valign: "middle" },
          },
        ];
      }),
    ];
    slide.addTable(rows, {
      x: MARGIN,
      y: CONTENT_TOP + 1.45,
      w: SLIDE_W - MARGIN * 2,
      colW: [5.4, 2.2, 1.5, 3.25],
      border: { type: "solid", color: C.line, pt: 0.5 },
      fontFace: "Calibri",
      valign: "middle",
      rowH: 0.72,
    });
    finish(slide);
  }

  // ——— Slide 5 KPI Dashboard ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "KPI Dashboard", {
      logoDataUrl,
      subtitle: "Actual vs budget with performance indicator",
    });

    const rows: pptxgen.TableRow[] = [
      [
        { text: "KPI", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Actual", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
        { text: "Budget", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
        { text: "Variance", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
        { text: "Status", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center" } },
      ],
      ...data.kpis.map((kpi: AbhiBoardKpi, index): pptxgen.TableRow => {
        const fill = index % 2 ? C.soft : C.white;
        const chip = indicatorChip(kpi.indicator);
        return [
          { text: kpi.name, options: { color: C.text, fontSize: 14, fill: { color: fill } } },
          {
            text: formatAbhiBoardKpiValue(kpi.actual, kpi.unit),
            options: { color: C.navy, fontSize: 15, bold: true, fill: { color: fill }, align: "center" },
          },
          {
            text: formatAbhiBoardKpiValue(kpi.budget, kpi.unit),
            options: { color: C.muted, fontSize: 14, fill: { color: fill }, align: "center" },
          },
          {
            text: formatAbhiBoardKpiVariance(kpi.variance, kpi.unit),
            options: { color: C.text, fontSize: 14, fill: { color: fill }, align: "center" },
          },
          {
            text: kpi.indicator,
            options: {
              color: chip.text,
              fontSize: 13,
              bold: true,
              align: "center",
              fill: { color: chip.fill },
            },
          },
        ];
      }),
    ];
    slide.addTable(rows, {
      x: MARGIN,
      y: CONTENT_TOP + 0.15,
      w: SLIDE_W - MARGIN * 2,
      colW: [4.2, 2.0, 2.0, 2.0, 2.15],
      border: { type: "solid", color: C.line, pt: 0.6 },
      fontFace: "Calibri",
      valign: "middle",
      rowH: 0.58,
    });
    finish(slide);
  }

  // ——— Slide 6 Financial Overview (CEO visual metrics) ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Financial Overview", {
      logoDataUrl,
      subtitle: "10-second board view",
    });

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
        value: formatOaBoardUsd(rev.actual, true),
        signal: formatAbhiBoardBudgetStatus(rev.variance ?? 0, { percentAbs: revPct }),
        tone: "amber" as const,
        detail: null as string | null,
      },
      {
        title: "Operating Result",
        value: formatOaBoardUsd(op.actual, true),
        signal: formatAbhiBoardBudgetVarianceNarrative(op.variance ?? 0),
        tone: "red" as const,
        detail: null as string | null,
      },
      {
        title: "Cash",
        value: formatOaBoardUsd(cash, true),
        signal: "Net cash increase this month",
        tone: "green" as const,
        detail: `+${formatOaBoardUsd(cashMove, true)}`,
      },
    ];

    metricCards.forEach((card, index) => {
      const x = MARGIN + index * 4.2;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.05,
        w: 4.0,
        h: 2.55,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.06,
      });
      slide.addText(card.title, {
        x: x + 0.25,
        y: CONTENT_TOP + 0.22,
        w: 3.5,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(card.value, {
        x: x + 0.25,
        y: CONTENT_TOP + 0.65,
        w: 3.5,
        h: 0.65,
        fontSize: 36,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      if (card.detail) {
        slide.addText(card.signal, {
          x: x + 0.25,
          y: CONTENT_TOP + 1.45,
          w: 3.5,
          h: 0.28,
          fontSize: 13,
          bold: true,
          color: C.muted,
          fontFace: "Calibri",
        });
        addStatusPill(slide, x + 0.25, CONTENT_TOP + 1.8, 3.5, 0.5, card.detail, card.tone);
      } else {
        addStatusPill(slide, x + 0.25, CONTENT_TOP + 1.55, 3.5, 0.55, card.signal, card.tone);
      }
    });

    // Forecast panel
    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 3.9,
      w: SLIDE_W - MARGIN * 2,
      h: 2.85,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
      rectRadius: 0.06,
    });
    slide.addText("Year-End Forecast", {
      x: MARGIN + 0.3,
      y: 4.1,
      w: 6,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: C.navy,
      fontFace: "Calibri",
    });
    addStatusPill(slide, 9.9, 4.05, 2.8, 0.35, "Confidence: Medium", "amber");
    slide.addText("Based on current trading assumptions", {
      x: 9.5,
      y: 4.45,
      w: 3.2,
      h: 0.25,
      fontSize: 10,
      color: C.muted,
      align: "right",
      fontFace: "Calibri",
    });

    const forecastCards = [
      { label: "Revenue", value: formatOaBoardUsd(fc.revenue, true) },
      { label: "Operating Result", value: formatOaBoardUsd(fc.surplus, true) },
      { label: "Cash", value: formatOaBoardUsd(fc.cash, true) },
    ];
    forecastCards.forEach((card, index) => {
      const x = MARGIN + 0.35 + index * 4.05;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: 4.85,
        w: 3.85,
        h: 1.55,
        fill: { color: C.soft },
        line: { color: C.soft, width: 0 },
        rectRadius: 0.05,
      });
      slide.addText(card.label, {
        x: x + 0.2,
        y: 5.0,
        w: 3.45,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(card.value, {
        x: x + 0.2,
        y: 5.4,
        w: 3.45,
        h: 0.7,
        fontSize: 28,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
    });
    finish(slide);
  }

  // ——— Slide 7 Profit & Loss ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Profit & Loss", {
      logoDataUrl,
      subtitle: "YTD actual vs budget",
    });

    const rows: pptxgen.TableRow[] = [
      [
        { text: "Line", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Actual", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "right" } },
        { text: "Budget", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "right" } },
        { text: "Variance", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "right" } },
        { text: "Prior Year", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "right" } },
      ],
      ...data.pnl.rows.map((row, index): pptxgen.TableRow => {
        const fill = row.emphasis ? C.decision : index % 2 ? C.soft : C.white;
        const varColor = row.variance < 0 ? C.subtleRed : C.green;
        return [
          {
            text: row.line,
            options: { color: C.text, fontSize: 13, bold: Boolean(row.emphasis), fill: { color: fill } },
          },
          {
            text: formatOaBoardUsd(row.actual, true),
            options: {
              color: C.navy,
              fontSize: 13,
              bold: Boolean(row.emphasis),
              fill: { color: fill },
              align: "right",
            },
          },
          {
            text: formatOaBoardUsd(row.budget, true),
            options: { color: C.muted, fontSize: 13, fill: { color: fill }, align: "right" },
          },
          {
            text: varianceText(row.variance),
            options: {
              color: varColor,
              fontSize: 13,
              bold: true,
              fill: { color: fill },
              align: "right",
            },
          },
          {
            text: formatOaBoardUsd(row.priorYear, true),
            options: { color: C.muted, fontSize: 13, fill: { color: fill }, align: "right" },
          },
        ];
      }),
    ];
    slide.addTable(rows, {
      x: MARGIN,
      y: CONTENT_TOP + 0.1,
      w: SLIDE_W - MARGIN * 2,
      colW: [4.0, 2.05, 2.05, 2.05, 2.2],
      border: { type: "solid", color: C.line, pt: 0.6 },
      fontFace: "Calibri",
      valign: "middle",
      rowH: 0.42,
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 5.7,
      w: SLIDE_W - MARGIN * 2,
      h: 1.15,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
      rectRadius: 0.04,
    });
    slide.addText("Variance commentary", {
      x: MARGIN + 0.2,
      y: 5.82,
      w: 4,
      h: 0.25,
      fontSize: 12,
      bold: true,
      color: C.navy,
      fontFace: "Calibri",
    });
    data.pnl.commentary.forEach((line, index) => {
      slide.addText(`•  ${line}`, {
        x: MARGIN + 0.2,
        y: 6.12 + index * 0.22,
        w: 12,
        h: 0.22,
        fontSize: 11,
        color: C.text,
        fontFace: "Calibri",
      });
    });
    finish(slide);
  }

  // ——— Slide 8 Balance Sheet & Cash (visual cash story) ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Balance Sheet & Cash", {
      logoDataUrl,
      subtitle: "Cash position at a glance",
    });

    const position = [
      { label: "Assets", value: data.balanceSheet.assets },
      { label: "Liabilities", value: data.balanceSheet.liabilities },
      { label: "Net Assets", value: data.balanceSheet.netAssets },
    ];
    position.forEach((item, index) => {
      const x = MARGIN + index * 4.2;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.05,
        w: 4.0,
        h: 1.15,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.06,
      });
      slide.addText(item.label, {
        x: x + 0.22,
        y: CONTENT_TOP + 0.18,
        w: 3.5,
        h: 0.25,
        fontSize: 12,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(formatOaBoardUsd(item.value, true), {
        x: x + 0.22,
        y: CONTENT_TOP + 0.5,
        w: 3.5,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
    });

    // Central cash graphic
    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 2.5,
      w: 5.5,
      h: 4.25,
      fill: { color: C.navy },
      line: { color: C.navy, width: 0 },
      rectRadius: 0.08,
    });
    slide.addText("CURRENT CASH", {
      x: MARGIN + 0.3,
      y: 2.85,
      w: 4.9,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: "A8C0DC",
      align: "center",
      fontFace: "Calibri",
    });
    slide.addText(formatOaBoardUsd(data.financialOverview.cashPosition.actual, true), {
      x: MARGIN + 0.3,
      y: 3.4,
      w: 4.9,
      h: 0.9,
      fontSize: 48,
      bold: true,
      color: C.white,
      align: "center",
      fontFace: "Calibri",
    });
    addStatusPill(slide, MARGIN + 1.35, 4.5, 2.8, 0.45, "Liquidity: GREEN", "green");
    slide.addText("No short-term funding pressure", {
      x: MARGIN + 0.3,
      y: 5.2,
      w: 4.9,
      h: 0.3,
      fontSize: 13,
      color: "D6E4F5",
      align: "center",
      fontFace: "Calibri",
    });
    slide.addText(
      `Expected Year End Cash  ${formatOaBoardUsd(data.balanceSheet.cashForecast, true)}`,
      {
        x: MARGIN + 0.2,
        y: 5.85,
        w: 5.1,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: C.white,
        align: "center",
        fontFace: "Calibri",
      },
    );

    // Supporting indicators
    const support = [
      {
        label: "Net Cash Movement This Month",
        value: `+${formatOaBoardUsd(data.balanceSheet.cashMovementMom, true)}`,
        tone: "green" as const,
      },
      {
        label: "Expected Year End Cash",
        value: formatOaBoardUsd(data.balanceSheet.cashForecast, true),
        tone: "navy" as const,
      },
      { label: "Liquidity Rating", value: "GREEN", tone: "green" as const },
    ];
    support.forEach((item, index) => {
      const y = 2.5 + index * 0.72;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: 6.3,
        y,
        w: 6.5,
        h: 0.65,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.05,
      });
      slide.addText(item.label, {
        x: 6.5,
        y: y + 0.1,
        w: 3.6,
        h: 0.45,
        fontSize: 12,
        color: C.muted,
        bold: true,
        valign: "middle",
        fontFace: "Calibri",
      });
      slide.addText(item.value, {
        x: 10.0,
        y: y + 0.1,
        w: 2.55,
        h: 0.45,
        fontSize: 16,
        bold: true,
        color: item.tone === "green" ? C.green : C.navy,
        align: "right",
        valign: "middle",
        fontFace: "Calibri",
      });
    });

    // Cash drivers — biggest positive / negative
    slide.addText("Cash Drivers", {
      x: 6.3,
      y: 4.68,
      w: 6.5,
      h: 0.22,
      fontSize: 13,
      bold: true,
      color: C.navy,
      fontFace: "Calibri",
    });
    slide.addText(data.balanceSheet.cashDrivers, {
      x: 6.3,
      y: 4.9,
      w: 6.5,
      h: 0.28,
      fontSize: 11,
      color: C.muted,
      fontFace: "Calibri",
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: 6.3,
      y: 5.22,
      w: 3.15,
      h: 1.53,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText("Positive Drivers", {
      x: 6.45,
      y: 5.32,
      w: 2.85,
      h: 0.24,
      fontSize: 12,
      bold: true,
      color: C.green,
      fontFace: "Calibri",
    });
    data.balanceSheet.positiveCashDrivers.slice(0, 3).forEach((driver, index) => {
      slide.addText(
        `${driver.label}  +${formatOaBoardUsd(driver.amount, true)}`,
        {
          x: 6.45,
          y: 5.58 + index * 0.35,
          w: 2.85,
          h: 0.32,
          fontSize: 12,
          color: C.text,
          fontFace: "Calibri",
        },
      );
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: 9.65,
      y: 5.22,
      w: 3.15,
      h: 1.53,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText("Negative Drivers", {
      x: 9.8,
      y: 5.32,
      w: 2.85,
      h: 0.24,
      fontSize: 12,
      bold: true,
      color: C.subtleRed,
      fontFace: "Calibri",
    });
    data.balanceSheet.negativeCashDrivers.slice(0, 3).forEach((driver, index) => {
      slide.addText(
        `${driver.label}  -${formatOaBoardUsd(driver.amount, true)}`,
        {
          x: 9.8,
          y: 5.58 + index * 0.35,
          w: 2.85,
          h: 0.32,
          fontSize: 12,
          color: C.text,
          fontFace: "Calibri",
        },
      );
    });
    finish(slide);
  }

  // ——— Slide 9 Commercial Performance (growth / pipeline visuals) ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Commercial Performance", {
      logoDataUrl,
      subtitle: "Growth · Pipeline · Momentum",
    });

    // Membership
    {
      const x = MARGIN;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.05,
        w: 4.0,
        h: 5.7,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.06,
      });
      slide.addText("MEMBERSHIP", {
        x: x + 0.25,
        y: CONTENT_TOP + 0.25,
        w: 3.5,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText(String(data.commercial.membership.total), {
        x: x + 0.25,
        y: CONTENT_TOP + 0.85,
        w: 3.5,
        h: 0.75,
        fontSize: 48,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText("Active members", {
        x: x + 0.25,
        y: CONTENT_TOP + 1.6,
        w: 3.5,
        h: 0.3,
        fontSize: 13,
        color: C.muted,
        fontFace: "Calibri",
      });
      addStatusPill(slide, x + 0.25, CONTENT_TOP + 2.2, 3.5, 0.5, "+18 YTD growth", "green");
      addStatusPill(slide, x + 0.25, CONTENT_TOP + 2.9, 3.5, 0.5, "11 at risk", "amber");
      slide.addText("Net this quarter", {
        x: x + 0.25,
        y: CONTENT_TOP + 3.7,
        w: 3.5,
        h: 0.25,
        fontSize: 12,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(`+${data.commercial.membership.net}`, {
        x: x + 0.25,
        y: CONTENT_TOP + 4.05,
        w: 3.5,
        h: 0.55,
        fontSize: 28,
        bold: true,
        color: C.green,
        fontFace: "Calibri",
      });
      slide.addText(`${data.commercial.membership.new} new  ·  ${data.commercial.membership.lost} lost`, {
        x: x + 0.25,
        y: CONTENT_TOP + 4.7,
        w: 3.5,
        h: 0.35,
        fontSize: 13,
        color: C.text,
        fontFace: "Calibri",
      });
    }

    // Sponsorship
    {
      const x = 4.8;
      const s = data.commercial.sponsorship;
      const progress = s.actual / s.budget;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.05,
        w: 4.0,
        h: 5.7,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.06,
      });
      slide.addText("SPONSORSHIP", {
        x: x + 0.25,
        y: CONTENT_TOP + 0.25,
        w: 3.5,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText(formatOaBoardUsd(s.actual, true), {
        x: x + 0.25,
        y: CONTENT_TOP + 0.85,
        w: 3.5,
        h: 0.65,
        fontSize: 36,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText(`of ${formatOaBoardUsd(s.budget, true)} target`, {
        x: x + 0.25,
        y: CONTENT_TOP + 1.55,
        w: 3.5,
        h: 0.3,
        fontSize: 13,
        color: C.muted,
        fontFace: "Calibri",
      });
      addProgressBar(slide, x + 0.25, CONTENT_TOP + 2.1, 3.5, 0.35, progress, C.amber);
      slide.addText(`${Math.round(progress * 100)}% of target`, {
        x: x + 0.25,
        y: CONTENT_TOP + 2.55,
        w: 3.5,
        h: 0.3,
        fontSize: 12,
        color: C.text,
        fontFace: "Calibri",
      });
      addStatusPill(
        slide,
        x + 0.25,
        CONTENT_TOP + 3.15,
        3.5,
        0.55,
        `GAP  ${formatOaBoardUsd(s.actual - s.budget, true)}`,
        "red",
      );
      slide.addText("Forecast", {
        x: x + 0.25,
        y: CONTENT_TOP + 4.0,
        w: 3.5,
        h: 0.25,
        fontSize: 12,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(formatOaBoardUsd(s.forecast, true), {
        x: x + 0.25,
        y: CONTENT_TOP + 4.35,
        w: 3.5,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText("if MedCore & Helix close", {
        x: x + 0.25,
        y: CONTENT_TOP + 4.95,
        w: 3.5,
        h: 0.3,
        fontSize: 12,
        color: C.muted,
        fontFace: "Calibri",
      });
    }

    // Events / WHX
    {
      const x = 9.05;
      const secured = 28;
      const target = 32;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.05,
        w: 3.75,
        h: 5.7,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.06,
      });
      slide.addText("EVENTS / WHX", {
        x: x + 0.2,
        y: CONTENT_TOP + 0.25,
        w: 3.35,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText(`${secured}`, {
        x: x + 0.2,
        y: CONTENT_TOP + 0.75,
        w: 3.35,
        h: 0.55,
        fontSize: 40,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
      });
      slide.addText(`of ${target} target commitments`, {
        x: x + 0.2,
        y: CONTENT_TOP + 1.35,
        w: 3.35,
        h: 0.3,
        fontSize: 13,
        color: C.muted,
        fontFace: "Calibri",
      });
      addProgressBar(slide, x + 0.2, CONTENT_TOP + 1.85, 3.35, 0.35, secured / target, C.navy);

      const whxStats = [
        { label: "Current commitments", value: String(secured) },
        { label: "Remaining to target", value: String(target - secured) },
        { label: "Commercial status", value: "On track" },
        { label: "Delivery status", value: "Watch — deposit due" },
      ];
      whxStats.forEach((stat, index) => {
        const y = CONTENT_TOP + 2.45 + index * 0.48;
        slide.addText(stat.label, {
          x: x + 0.2,
          y,
          w: 3.35,
          h: 0.2,
          fontSize: 11,
          color: C.muted,
          fontFace: "Calibri",
        });
        slide.addText(stat.value, {
          x: x + 0.2,
          y: y + 0.18,
          w: 3.35,
          h: 0.25,
          fontSize: 14,
          bold: true,
          color: C.text,
          fontFace: "Calibri",
        });
      });
      addStatusPill(slide, x + 0.2, CONTENT_TOP + 4.55, 3.35, 0.4, "Programme status: AMBER", "amber");
      slide.addText(`Events revenue YTD  ${formatOaBoardUsd(data.commercial.events.revenue, true)}`, {
        x: x + 0.2,
        y: CONTENT_TOP + 5.15,
        w: 3.35,
        h: 0.3,
        fontSize: 12,
        color: C.muted,
        fontFace: "Calibri",
      });
    }
    finish(slide);
  }

  // ——— Slide 10 Team & Organisation ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Team & Organisation", {
      logoDataUrl,
      subtitle: "Headcount, vacancies and recent changes",
    });

    const tiles = [
      { label: "Headcount", value: String(data.team.headcount), color: C.navy },
      { label: "Open roles", value: String(data.team.openRoles), color: C.amber },
    ];
    tiles.forEach((tile, index) => {
      const x = MARGIN + index * 3.3;
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y: CONTENT_TOP + 0.1,
        w: 3.1,
        h: 1.3,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.05,
      });
      slide.addText(tile.label, {
        x: x + 0.2,
        y: CONTENT_TOP + 0.28,
        w: 2.7,
        h: 0.3,
        fontSize: 13,
        color: C.muted,
        bold: true,
        fontFace: "Calibri",
      });
      slide.addText(tile.value, {
        x: x + 0.2,
        y: CONTENT_TOP + 0.65,
        w: 2.7,
        h: 0.55,
        fontSize: 36,
        bold: true,
        color: tile.color,
        fontFace: "Calibri",
      });
    });

    const joinerRows: pptxgen.TableRow[] = [
      [
        { text: "Recent joiners", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Role", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Start", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ...data.team.joiners.map(
        (person, index): pptxgen.TableRow => [
          { text: person.name, options: { color: C.text, fontSize: 13, fill: { color: index % 2 ? C.soft : C.white } } },
          { text: person.role, options: { color: C.muted, fontSize: 13, fill: { color: index % 2 ? C.soft : C.white } } },
          { text: person.startDate, options: { color: C.muted, fontSize: 13, fill: { color: index % 2 ? C.soft : C.white } } },
        ],
      ),
    ];
    slide.addTable(joinerRows, {
      x: MARGIN,
      y: 2.7,
      w: 6.0,
      colW: [2.1, 2.5, 1.4],
      border: { type: "solid", color: C.line, pt: 0.6 },
      fontFace: "Calibri",
      rowH: 0.5,
    });

    const leaverRows: pptxgen.TableRow[] = [
      [
        { text: "Recent leavers", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Role", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "End", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ...data.team.leavers.map(
        (person, index): pptxgen.TableRow => [
          { text: person.name, options: { color: C.text, fontSize: 13, fill: { color: index % 2 ? C.soft : C.white } } },
          { text: person.role, options: { color: C.muted, fontSize: 13, fill: { color: index % 2 ? C.soft : C.white } } },
          { text: person.endDate, options: { color: C.muted, fontSize: 13, fill: { color: index % 2 ? C.soft : C.white } } },
        ],
      ),
    ];
    slide.addTable(leaverRows, {
      x: 6.8,
      y: 2.7,
      w: 6.0,
      colW: [2.1, 2.5, 1.4],
      border: { type: "solid", color: C.line, pt: 0.6 },
      fontFace: "Calibri",
      rowH: 0.5,
    });

    slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
      x: MARGIN,
      y: 4.6,
      w: SLIDE_W - MARGIN * 2,
      h: 2.15,
      fill: { color: C.white },
      line: { color: C.line, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText("Organisation notes", {
      x: MARGIN + 0.25,
      y: 4.8,
      w: 4,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: C.navy,
      fontFace: "Calibri",
    });
    slide.addText(data.team.notes, {
      x: MARGIN + 0.25,
      y: 5.25,
      w: 12,
      h: 1.25,
      fontSize: 14,
      color: C.text,
      fontFace: "Calibri",
      valign: "top",
    });
    finish(slide);
  }

  // ——— Slide 11 Strategic Discussion (decision-first) ———
  {
    const slide = pptx.addSlide();
    paintSlide(slide);
    addHeader(slide, "Strategic Discussion & AOB", {
      logoDataUrl,
      subtitle: "Decisions required",
    });

    data.strategicTopics.forEach((topic, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = MARGIN + col * 6.35;
      const y = CONTENT_TOP + 0.05 + row * 2.7;
      const priorityTone =
        topic.priority === "HIGH" ? "red" : topic.priority === "MEDIUM" ? "amber" : "green";

      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x,
        y,
        w: 6.15,
        h: 2.55,
        fill: { color: C.white },
        line: { color: C.line, width: 1 },
        rectRadius: 0.06,
      });

      // Priority chip top-right
      addStatusPill(slide, x + 4.55, y + 0.15, 1.4, 0.35, topic.priority, priorityTone);

      slide.addText("ISSUE", {
        x: x + 0.25,
        y: y + 0.12,
        w: 4,
        h: 0.18,
        fontSize: 9,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(topic.issue, {
        x: x + 0.25,
        y: y + 0.3,
        w: 4.2,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: C.navy,
        fontFace: "Calibri",
        valign: "top",
      });
      slide.addText("WHY IT MATTERS", {
        x: x + 0.25,
        y: y + 0.68,
        w: 5.5,
        h: 0.16,
        fontSize: 9,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(topic.whyItMatters, {
        x: x + 0.25,
        y: y + 0.84,
        w: 5.5,
        h: 0.28,
        fontSize: 12,
        color: C.text,
        fontFace: "Calibri",
      });

      // Decision panel — most prominent
      slide.addShape("roundRect" as pptxgen.SHAPE_NAME, {
        x: x + 0.2,
        y: y + 1.2,
        w: 5.75,
        h: 0.7,
        fill: { color: C.navy },
        line: { color: C.navy, width: 0 },
        rectRadius: 0.05,
      });
      slide.addText("DECISION REQUIRED", {
        x: x + 0.35,
        y: y + 1.28,
        w: 5.45,
        h: 0.18,
        fontSize: 9,
        bold: true,
        color: "A8C0DC",
        fontFace: "Calibri",
      });
      slide.addText(topic.decisionRequired, {
        x: x + 0.35,
        y: y + 1.48,
        w: 5.45,
        h: 0.32,
        fontSize: 13,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      });

      slide.addText("IMPACT", {
        x: x + 0.25,
        y: y + 2.05,
        w: 1.2,
        h: 0.2,
        fontSize: 9,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      slide.addText(topic.impact, {
        x: x + 1.4,
        y: y + 2.02,
        w: 4.5,
        h: 0.35,
        fontSize: 12,
        color: C.text,
        fontFace: "Calibri",
      });
    });

    slide.addText(`AOB: ${data.aob}`, {
      x: MARGIN,
      y: 6.55,
      w: SLIDE_W - MARGIN * 2,
      h: 0.35,
      fontSize: 12,
      color: C.muted,
      fontFace: "Calibri",
    });
    finish(slide);
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return new Uint8Array(buffer);
}
