import { jsPDF } from "jspdf";

import {
  abhiRiskScore,
  abhiRiskTrendLabel,
  formatAbhiBoardDate,
  type AbhiActionStatus,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
} from "@/lib/abhi/board-pack-model";
import {
  actionChip,
  addSlide,
  boardAttentionForRisk,
  BOARD_PACK_COLORS as C,
  BOARD_PACK_CONTENT_W as CONTENT_W,
  BOARD_PACK_MARGIN as MARGIN,
  BOARD_PACK_SLIDE_H as SLIDE_H,
  BOARD_PACK_SLIDE_W as SLIDE_W,
  drawFooter,
} from "@/lib/abhi/board-pack-pdf";
import { buildBoardImpactIntelligence } from "@/lib/talanton/board-impact-intelligence";
import { TI_BOARD_MEETINGS } from "@/lib/talanton/board-portal-data";
import { formatTalantonBoardUsd } from "@/lib/talanton/board-pack-model";
import {
  FUNDS_PLATFORM_OVERVIEW,
  listTalantonFunds,
} from "@/lib/talanton/funds-data";
import { listJourneyStoriesForBoard } from "@/lib/talanton/journey-stories-store";
import {
  companyNameById,
  courseTitleById,
  TALANTON_COMPLIANCE_COURSES,
  TALANTON_MY_TRAINING,
  TALANTON_PORTFOLIO_COMPANIES,
} from "@/lib/talanton/portfolio-data";
import { buildPortfolioExecutiveBriefing } from "@/lib/talanton/portfolio-intelligence";
import {
  HARRY_TURNER_QUOTE,
  loadTalantonBoardPackAssets,
  type TalantonBoardPackAssets,
} from "@/lib/talanton/board-pack-assets";
import { TALANTON_BOARD_DECK_BUILD } from "@/lib/talanton/board-deck-generator";
import {
  drawConcernCards,
  drawDonutChart,
  drawHorizontalBarChart,
  drawJourneyCard,
  drawMetricRow,
  drawQuotePanel,
  drawSectionPanel,
  drawSlideBackdrop,
  drawStatTile,
  drawVerticalBarChart,
} from "@/lib/talanton/board-pack-charts";
import {
  drawActionRow,
  drawBoardDecisionsPanel,
  drawFundMiniCard,
  drawProgressBarWhiteText,
  drawRiskImpactBar,
  drawRiskSummaryCard,
  drawStrategicTopicCard,
  drawTalantonHeader,
  drawTalantonLogos,
  formatCompactCount,
} from "@/lib/talanton/board-pack-layout";

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function money(value: number, compact = false) {
  return formatTalantonBoardUsd(value, compact);
}

function header(doc: jsPDF, title: string, logoDataUrl: string | null, subtitle?: string) {
  drawTalantonHeader(doc, {
    title,
    subtitle,
    logoDataUrl,
    slideW: SLIDE_W,
    margin: MARGIN,
    colors: C,
  });
}

function footer(doc: jsPDF, packName: string, slideNumber: number) {
  drawFooter(doc, packName, slideNumber);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  setText(doc, C.muted);
  doc.text(`Build ${TALANTON_BOARD_DECK_BUILD}`, SLIDE_W - MARGIN, SLIDE_H - 1, { align: "right" });
}

function lastHeldMeeting() {
  return (
    [...TI_BOARD_MEETINGS]
      .filter((m) => m.status === "Held")
      .sort((a, b) => Date.parse(b.meetingDate) - Date.parse(a.meetingDate))[0] ?? TI_BOARD_MEETINGS[1]
  );
}

function newPortfolioCompanies() {
  return [...TALANTON_PORTFOLIO_COMPANIES]
    .sort((a, b) => Date.parse(b.lastReview) - Date.parse(a.lastReview))
    .slice(0, 4);
}

function topPortfolioPerformers() {
  return [...TALANTON_PORTFOLIO_COMPANIES]
    .sort((a, b) => b.revenueGrowthPct - a.revenueGrowthPct)
    .slice(0, 5)
    .map((c) => ({
      companyName: c.name,
      country: c.country,
      healthScore: c.compliancePct,
      revenueGrowthPct: c.revenueGrowthPct,
    }));
}

/**
 * Talanton board deck — fixed 10-slide structure (same visual system as ABHI board pack PDF).
 */
export async function buildTalantonBoardPackPdf(
  data: AbhiBoardPackData,
  logoDataUrl: string | null,
  assetsInput?: TalantonBoardPackAssets,
): Promise<Uint8Array> {
  const funds = FUNDS_PLATFORM_OVERVIEW;
  const fundList = listTalantonFunds();
  const impactIntel = buildBoardImpactIntelligence();
  const journeys = listJourneyStoriesForBoard().slice(0, 2);
  const assets = assetsInput ?? (await loadTalantonBoardPackAssets(journeys));
  const heldMeeting = lastHeldMeeting();
  const performers = topPortfolioPerformers();
  const newcomers = newPortfolioCompanies();
  const trainingCompleted = TALANTON_MY_TRAINING.filter((t) => t.status === "Completed").length;
  const trainingOverdue = TALANTON_MY_TRAINING.filter((t) => t.status === "Overdue").length;
  const trainingInProgress = TALANTON_MY_TRAINING.filter((t) => t.status === "In Progress").length;
  const deploymentPct = Math.round((funds.capitalDeployedUsd / funds.capitalCommittedUsd) * 100);
  const impactTrends = impactIntel.trends;
  const q1Trend = impactTrends.find((t) => t.period === "Q1 2026");
  const q2Trend = impactTrends.find((t) => t.period === "Q2 2026");
  const jobsLastQuarter = Math.max(0, (q2Trend?.jobsCreated ?? 0) - (q1Trend?.jobsCreated ?? 0));
  const peopleLastQuarter = Math.max(0, (q2Trend?.peopleServed ?? 0) - (q1Trend?.peopleServed ?? 0));
  const statColors = { white: C.white, line: C.line, navy: C.navy, muted: C.muted, text: C.text };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [SLIDE_W, SLIDE_H] });
  doc.deletePage(1);

  // 1 — Cover
  {
    addSlide(doc);
    drawTalantonLogos(doc, logoDataUrl, SLIDE_W, MARGIN);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setText(doc, C.muted);
    doc.text("Talanton Impact", MARGIN, 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    setText(doc, C.navy);
    doc.text("Board Meeting Deck", MARGIN, 37);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    setText(doc, C.text);
    doc.text(formatAbhiBoardDate(data.meetingDate), MARGIN, 47);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.subtleRed);
    doc.text("CONFIDENTIAL", MARGIN, 54);

    let y = 64;
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
    footer(doc, data.packName, 1);
  }

  // 2 — Executive Summary (visual dashboard)
  {
    addSlide(doc);
    drawSlideBackdrop(doc, {
      w: SLIDE_W,
      h: SLIDE_H,
      margin: MARGIN,
      imageDataUrl: assets.slideBackdrops.executive,
    });
    header(doc, "Executive Summary", logoDataUrl);

    const bodyTop = 28;
    const bodyH = 94;
    const colGap = 4;
    const col1W = 74;
    const col2W = 92;
    const col3W = CONTENT_W - col1W - col2W - colGap * 2;
    const col1X = MARGIN;
    const col2X = col1X + col1W + colGap;
    const col3X = col2X + col2W + colGap;
    const panelColors = { white: C.white, line: C.line, navy: C.navy };

    drawSectionPanel(doc, { x: col1X, y: bodyTop, w: col1W, h: bodyH, title: "Agenda", colors: panelColors });
    data.agenda.forEach((item, index) => {
      const y = bodyTop + 14 + index * 8.2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setText(doc, C.navy);
      doc.text(String(index + 1), col1X + 4, y);
      doc.setFont("helvetica", "normal");
      setText(doc, C.text);
      const label = doc.splitTextToSize(item, col1W - 12);
      doc.text(label.slice(0, 2), col1X + 8, y);
    });

    drawSectionPanel(doc, {
      x: col2X,
      y: bodyTop,
      w: col2W,
      h: bodyH,
      title: "Capital deployment",
      colors: panelColors,
    });
    const donutCx = col2X + 26;
    const donutCy = bodyTop + 30;
    drawDonutChart(doc, {
      cx: donutCx,
      cy: donutCy,
      outerR: 15,
      innerR: 9,
      centerLabel: money(funds.capitalCommittedUsd, true),
      centerSubLabel: "committed",
      segments: [
        { value: funds.capitalDeployedUsd, color: C.green, label: "Deployed" },
        { value: funds.availableCapitalUsd, color: C.amber, label: "Available" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
      legendBelow: false,
    });
    const capTextX = col2X + 52;
    let capY = bodyTop + 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, C.muted);
    doc.text("DEPLOYED", capTextX, capY);
    doc.setFontSize(12);
    setText(doc, C.green);
    doc.text(money(funds.capitalDeployedUsd, true), capTextX, capY + 6);
    capY += 13;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, C.muted);
    doc.text("AVAILABLE", capTextX, capY);
    doc.setFontSize(12);
    setText(doc, C.amber);
    doc.text(money(funds.availableCapitalUsd, true), capTextX, capY + 6);
    const legendY = donutCy + 18;
    let legendX = col2X + 6;
    for (const [label, color, value] of [
      ["Deployed", C.green, funds.capitalDeployedUsd],
      ["Available", C.amber, funds.availableCapitalUsd],
    ] as const) {
      const pct = Math.round((value / funds.capitalCommittedUsd) * 100);
      setFill(doc, color);
      doc.roundedRect(legendX, legendY - 3, 3, 3, 0.5, 0.5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, C.text);
      doc.text(`${label} (${pct}%)`, legendX + 5, legendY);
      legendX += 36;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, C.navy);
    doc.text("Key concerns", col2X + 4, bodyTop + 66);
    drawConcernCards(doc, {
      x: col2X + 3,
      y: bodyTop + 70,
      width: col2W - 6,
      cardH: 13,
      cards: data.concernCards.slice(0, 2).map((card) => ({
        title: card.title,
        detail: card.detail,
      })),
      colors: { white: C.white, line: C.line, navy: C.navy, amber: C.amber, text: C.text },
    });

    drawSectionPanel(doc, {
      x: col3X,
      y: bodyTop,
      w: col3W,
      h: bodyH,
      title: "Portfolio impact",
      colors: panelColors,
    });
    const metricH = 24;
    const metricGap = 4;
    const metricX = col3X + 3;
    const metricW = col3W - 6;
    let metricY = bodyTop + 12;
    drawMetricRow(doc, {
      x: metricX,
      y: metricY,
      w: metricW,
      h: metricH,
      label: "Jobs created last quarter",
      value: `+${jobsLastQuarter.toLocaleString()}`,
      sub: "Net new across portfolio",
      accent: C.green,
      colors: statColors,
    });
    metricY += metricH + metricGap;
    drawMetricRow(doc, {
      x: metricX,
      y: metricY,
      w: metricW,
      h: metricH,
      label: "People served (Q2)",
      value: `+${formatCompactCount(peopleLastQuarter)}`,
      sub: "Quarter-on-quarter uplift",
      accent: C.navy,
      colors: statColors,
    });
    metricY += metricH + metricGap;
    drawMetricRow(doc, {
      x: metricX,
      y: metricY,
      w: metricW,
      h: metricH,
      label: "Portfolio reach",
      value: `${funds.portfolioCompanies} companies`,
      sub: `${funds.countriesRepresented} countries`,
      accent: C.amber,
      colors: statColors,
    });

    drawBoardDecisionsPanel(doc, {
      x: MARGIN,
      y: 128,
      width: CONTENT_W,
      decisions: data.boardDecisions,
      colors: C,
    });
    footer(doc, data.packName, 2);
  }

  // 3 — Previous minutes & decisions
  {
    addSlide(doc);
    drawSlideBackdrop(doc, {
      w: SLIDE_W,
      h: SLIDE_H,
      margin: MARGIN,
      imageDataUrl: assets.slideBackdrops.minutes,
    });
    header(
      doc,
      "Board Previous Minutes and Decisions",
      logoDataUrl,
      heldMeeting ? `${heldMeeting.title} · ${formatAbhiBoardDate(heldMeeting.meetingDate)}` : undefined,
    );

    drawSectionPanel(doc, {
      x: MARGIN,
      y: 26,
      w: CONTENT_W * 0.6,
      h: 58,
      title: "Minutes summary",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(doc, C.text);
    const notes = doc.splitTextToSize(
      heldMeeting?.notes || "Quorum achieved. Prior meeting minutes approved.",
      CONTENT_W * 0.56,
    );
    doc.text(notes.slice(0, 10), MARGIN + 4, 36);

    const rightResX = MARGIN + CONTENT_W * 0.62;
    drawSectionPanel(doc, {
      x: rightResX,
      y: 26,
      w: CONTENT_W * 0.38,
      h: 58,
      title: "Resolutions",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(doc, C.text);
    let ry = 36;
    for (const resolution of heldMeeting?.resolutions ?? []) {
      setFill(doc, C.soft);
      doc.roundedRect(rightResX + 3, ry - 3, CONTENT_W * 0.38 - 6, 10, 1, 1, "F");
      doc.text(`• ${resolution}`, rightResX + 6, ry + 2);
      ry += 12;
    }

    drawSectionPanel(doc, {
      x: MARGIN,
      y: 88,
      w: CONTENT_W * 0.5 - 2,
      h: 36,
      title: "Decisions recorded",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    let dy = 98;
    for (const decision of heldMeeting?.decisions ?? []) {
      setFill(doc, C.decision);
      setDraw(doc, C.line);
      doc.roundedRect(MARGIN + 3, dy - 3, CONTENT_W * 0.5 - 8, 11, 1, 1, "FD");
      setFill(doc, C.green);
      doc.roundedRect(MARGIN + 3, dy - 3, 2, 11, 1, 0, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.navy);
      doc.text(decision.resolution ?? "Approved", MARGIN + 7, dy + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setText(doc, C.text);
      const lines = doc.splitTextToSize(decision.text, CONTENT_W * 0.5 - 14);
      doc.text(lines.slice(0, 1), MARGIN + 7, dy + 6);
      dy += 13;
    }

    const actionsX = MARGIN + CONTENT_W * 0.5 + 2;
    drawSectionPanel(doc, {
      x: actionsX,
      y: 88,
      w: CONTENT_W * 0.5 - 2,
      h: 36,
      title: "Carried-forward actions",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    let ay = 96;
    for (const action of heldMeeting?.actions ?? []) {
      drawActionRow(doc, {
        x: actionsX + 3,
        y: ay,
        w: CONTENT_W * 0.5 - 8,
        title: action.title,
        owner: action.owner,
        dueDate: action.dueDate,
        status: action.status as AbhiActionStatus,
        colors: C,
      });
      ay += 15;
    }

    footer(doc, data.packName, 3);
  }

  // 4 — Risk Register
  {
    addSlide(doc);
    drawSlideBackdrop(doc, {
      w: SLIDE_W,
      h: SLIDE_H,
      margin: MARGIN,
      imageDataUrl: assets.slideBackdrops.risk,
    });
    header(doc, "Board Risk Register", logoDataUrl, "Executive risk briefing");
    const sorted = [...data.risks].sort((a, b) => abhiRiskScore(b) - abhiRiskScore(a)).slice(0, 6);
    const highCount = sorted.filter((r) => r.impact === "H").length;
    const medCount = sorted.filter((r) => r.impact === "M").length;
    const lowCount = sorted.filter((r) => r.impact === "L").length;
    const mitigatingCount = sorted.filter((r) => r.status === "Mitigating").length;
    const cardW = (CONTENT_W - 8) / 3;
    drawRiskSummaryCard(doc, {
      x: MARGIN,
      y: 26,
      w: cardW,
      h: 26,
      label: "Open risks",
      value: String(sorted.length),
      hint: "Active entries on the board risk register requiring oversight.",
      accent: C.navy,
      colors: C,
    });
    drawRiskSummaryCard(doc, {
      x: MARGIN + cardW + 4,
      y: 26,
      w: cardW,
      h: 26,
      label: "High impact",
      value: String(highCount),
      hint: "Risks rated H on the impact matrix — potential material harm.",
      accent: C.amber,
      colors: C,
    });
    drawRiskSummaryCard(doc, {
      x: MARGIN + (cardW + 4) * 2,
      y: 26,
      w: cardW,
      h: 26,
      label: "Mitigating",
      value: String(mitigatingCount),
      hint: "Risks with active mitigation plans underway.",
      accent: C.green,
      colors: C,
    });

    const colX = [MARGIN + 6, MARGIN + 120, MARGIN + 168, MARGIN + 200];
    const colW = [110, 46, 28, 73];
    let y = 56;
    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, y - 4, CONTENT_W, 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Risk", "Owner", "Trend", "Board attention"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 9;
    for (const [index, risk] of sorted.entries()) {
      drawRiskRow(doc, risk, colX, colW, y, index);
      y += 13;
    }

    drawRiskImpactBar(doc, {
      x: MARGIN,
      y: 126,
      width: CONTENT_W,
      segments: [
        { label: "High", value: highCount, color: C.subtleRed },
        { label: "Medium", value: medCount, color: C.amber },
        { label: "Low", value: lowCount, color: C.green },
      ],
      colors: C,
    });
    footer(doc, data.packName, 4);
  }

  // 5 — Fund performance
  {
    addSlide(doc);
    drawSlideBackdrop(doc, {
      w: SLIDE_W,
      h: SLIDE_H,
      margin: MARGIN,
      imageDataUrl: assets.slideBackdrops.funds,
    });
    header(doc, "Fund Performance Update", logoDataUrl, "Committed · deployed · available capital");

    const fundTileW = (CONTENT_W - 8) / 3;
    drawStatTile(doc, {
      x: MARGIN,
      y: 26,
      w: fundTileW,
      h: 28,
      label: "Capital committed",
      value: money(funds.capitalCommittedUsd, true),
      sub: `${fundList.length} stewardship funds`,
      accent: C.navy,
      colors: statColors,
    });
    drawStatTile(doc, {
      x: MARGIN + fundTileW + 4,
      y: 26,
      w: fundTileW,
      h: 28,
      label: "Capital deployed",
      value: money(funds.capitalDeployedUsd, true),
      sub: `${deploymentPct}% of committed`,
      accent: C.green,
      colors: statColors,
    });
    drawStatTile(doc, {
      x: MARGIN + (fundTileW + 4) * 2,
      y: 26,
      w: fundTileW,
      h: 28,
      label: "Available capital",
      value: money(funds.availableCapitalUsd, true),
      sub: "Ready for deployment",
      accent: C.amber,
      colors: statColors,
    });

    drawVerticalBarChart(doc, {
      x: MARGIN,
      y: 62,
      width: CONTENT_W * 0.52,
      height: 58,
      title: "Deployed capital by fund",
      bars: fundList.map((fund, index) => ({
        label: fund.shortName || fund.name,
        value: fund.capitalDeployedUsd,
        color: index === 0 ? C.navy : index === 1 ? C.green : C.amber,
        display: money(fund.capitalDeployedUsd, true),
      })),
      maxValue: Math.max(...fundList.map((f) => f.capitalDeployedUsd), 1),
      titleColor: C.navy,
      labelColor: C.text,
      trackColor: C.soft,
    });

    drawDonutChart(doc, {
      cx: MARGIN + CONTENT_W * 0.78,
      cy: 88,
      outerR: 17,
      innerR: 10,
      title: "Deployment mix",
      centerLabel: money(funds.capitalDeployedUsd, true),
      centerSubLabel: "deployed",
      segments: [
        { value: funds.capitalDeployedUsd, color: C.green, label: "Deployed" },
        { value: funds.availableCapitalUsd, color: C.amber, label: "Available" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });

    const fundCardW = (CONTENT_W - 8) / 3;
    fundList.forEach((fund, index) => {
      drawFundMiniCard(doc, {
        x: MARGIN + index * (fundCardW + 4),
        y: 108,
        w: fundCardW,
        h: 26,
        name: fund.shortName || fund.name,
        deployed: money(fund.capitalDeployedUsd, true),
        committed: money(fund.fundSizeUsd, true),
        pct: fund.deploymentPct,
        accent: index === 0 ? C.navy : index === 1 ? C.green : C.amber,
        colors: C,
      });
    });

    drawProgressBarWhiteText(doc, {
      x: MARGIN,
      y: 138,
      width: CONTENT_W,
      height: 9,
      pct: deploymentPct,
      label: `${deploymentPct}% of committed capital deployed`,
      fill: C.green,
      track: C.soft,
    });
    footer(doc, data.packName, 5);
  }

  // 6 — Portfolio companies
  {
    addSlide(doc);
    drawSlideBackdrop(doc, {
      w: SLIDE_W,
      h: SLIDE_H,
      margin: MARGIN,
      imageDataUrl: assets.slideBackdrops.portfolio,
    });
    header(
      doc,
      "Portfolio Companies Summary",
      logoDataUrl,
      "Performance highlights and recent additions",
    );

    drawSectionPanel(doc, {
      x: MARGIN,
      y: 26,
      w: CONTENT_W * 0.58,
      h: 96,
      title: "Revenue growth — top performers (%)",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    drawHorizontalBarChart(doc, {
      x: MARGIN + 4,
      y: 36,
      width: CONTENT_W * 0.54,
      rowHeight: 14,
      bars: performers.map((company, index) => ({
        label: company.companyName,
        value: Math.max(company.revenueGrowthPct, 0),
        color: index === 0 ? C.green : index === 1 ? C.navy : C.amber,
        display: `${company.revenueGrowthPct >= 0 ? "+" : ""}${company.revenueGrowthPct}%`,
      })),
      maxValue: Math.max(...performers.map((c) => c.revenueGrowthPct), 1),
      labelColor: C.text,
      trackColor: C.soft,
    });

    const portfolioBrief = buildPortfolioExecutiveBriefing();
    const cardColX = MARGIN + CONTENT_W * 0.62;
    const cardW = CONTENT_W * 0.38;
    drawSectionPanel(doc, {
      x: cardColX,
      y: 26,
      w: cardW,
      h: 96,
      title: "New / recently reviewed",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });

    const accentColors = [C.green, C.navy, C.amber, C.green] as const;
    newcomers.slice(0, 4).forEach((company, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = cardColX + col * (cardW / 2 + 2);
      const y = 38 + row * 34;
      const w = cardW / 2 - 2;
      const h = 30;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
      setFill(doc, accentColors[index % accentColors.length]);
      doc.roundedRect(x, y, 3, h, 1.5, 0, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      const nameLines = doc.splitTextToSize(company.name, w - 8);
      doc.text(nameLines.slice(0, 1), x + 6, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text(company.country, x + 6, y + 14);
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(company.sector, x + 6, y + 20);
      doc.setFont("helvetica", "bold");
      setText(doc, C.navy);
      doc.text(money(company.investmentAmountUsd, true), x + 6, y + 26);
    });

    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 128, CONTENT_W, 22, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    doc.text("Portfolio headline", MARGIN + 4, 136);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${funds.portfolioCompanies} companies · ${portfolioBrief.health.companiesRequiringAttention} require attention · ${portfolioBrief.health.reportsOutstanding} quarterly reports outstanding`,
      MARGIN + 4,
      144,
    );
    footer(doc, data.packName, 6);
  }

  // 7 — Impact Intelligence & external access
  {
    addSlide(doc);
    drawSlideBackdrop(doc, {
      w: SLIDE_W,
      h: SLIDE_H,
      margin: MARGIN,
      imageDataUrl: assets.slideBackdrops.executive,
    });
    header(
      doc,
      "Impact Intelligence & External Access",
      logoDataUrl,
      "Board oversight · portfolio portals · shared intelligence",
    );

    drawSectionPanel(doc, {
      x: MARGIN,
      y: 26,
      w: CONTENT_W * 0.34,
      h: 96,
      title: "Impact outcomes",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    const impactMetrics = [
      { label: "Jobs created", value: impactIntel.summary.jobsCreated.toLocaleString(), accent: C.green },
      {
        label: "People served",
        value: formatCompactCount(impactIntel.summary.peopleServed),
        accent: C.navy,
      },
      {
        label: "Communities impacted",
        value: String(impactIntel.summary.communitiesImpacted),
        accent: C.amber,
      },
    ];
    impactMetrics.forEach((metric, index) => {
      drawMetricRow(doc, {
        x: MARGIN + 3,
        y: 36 + index * 28,
        w: CONTENT_W * 0.34 - 6,
        h: 24,
        label: metric.label,
        value: metric.value,
        accent: metric.accent,
        colors: statColors,
      });
    });

    drawSectionPanel(doc, {
      x: MARGIN + CONTENT_W * 0.36,
      y: 26,
      w: CONTENT_W * 0.64,
      h: 58,
      title: "External access surfaces",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    drawHorizontalBarChart(doc, {
      x: MARGIN + CONTENT_W * 0.38,
      y: 36,
      width: CONTENT_W * 0.6,
      rowHeight: 12,
      bars: [
        { label: "Board portal", value: data.attendees.length, color: C.navy, display: `${data.attendees.length} directors` },
        {
          label: "Portfolio company portals",
          value: TALANTON_PORTFOLIO_COMPANIES.length,
          color: C.green,
          display: `${TALANTON_PORTFOLIO_COMPANIES.length} companies`,
        },
        { label: "Journey stories (board)", value: journeys.length, color: C.amber, display: `${journeys.length} published` },
        { label: "Impact dashboards", value: impactIntel.summary.countriesImpacted, color: C.navy, display: "Live" },
        { label: "External client access", value: 1, color: C.green, display: "Governed" },
      ],
      maxValue: TALANTON_PORTFOLIO_COMPANIES.length,
      labelColor: C.text,
      trackColor: C.soft,
    });

    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 88, CONTENT_W, 34, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.white);
    doc.text("Board attention", MARGIN + 4, 96);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, [230, 236, 245]);
    impactIntel.areasRequiringBoardAttention.slice(0, 3).forEach((item, index) => {
      const lines = doc.splitTextToSize(`• ${item}`, CONTENT_W - 10);
      doc.text(lines.slice(0, 2), MARGIN + 4, 103 + index * 8);
    });
    footer(doc, data.packName, 7);
  }

  // 8 — Journey & impact stories
  {
    addSlide(doc);
    header(doc, "Latest Journey and Impact Stories", logoDataUrl, "Field evidence for board and LP narrative");

    drawQuotePanel(doc, {
      x: MARGIN,
      y: 26,
      w: CONTENT_W,
      h: 30,
      imageDataUrl: assets.harryTurnerPhoto,
      imageFormat: "JPEG",
      name: "Harry Turner",
      role: "Partner, Talanton Impact",
      quote: HARRY_TURNER_QUOTE,
      colors: { navy: C.navy, muted: C.muted, text: C.text, soft: C.soft, white: C.white },
    });

    const cardH = 52;
    const cardW = (CONTENT_W - 6) / Math.max(journeys.length, 1);
    journeys.forEach((story, index) => {
      const x = MARGIN + index * (cardW + 6);
      const y = 60;
      const body = (story.generated.boardSummary || story.generated.executiveSummary || story.purpose)
        .replace(/^Board Journey Brief\s*—\s*/i, "")
        .replace(/Country:.*$/m, "")
        .trim();
      drawJourneyCard(doc, {
        x,
        y,
        w: cardW,
        h: cardH,
        imageDataUrl: assets.journeyPhotos.get(story.id) ?? null,
        imageFormat: "JPEG",
        country: story.country,
        title: story.title,
        subtitle: `${story.companyNames.slice(0, 2).join(", ")} · ${story.startDate}`,
        body,
        colors: { navy: C.navy, muted: C.muted, text: C.text, line: C.line, white: C.white, green: C.green },
      });
    });

    if (journeys.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text("No published journey stories for the board portal yet.", MARGIN, 80);
    }
    footer(doc, data.packName, 8);
  }

  // 9 — Training update
  {
    addSlide(doc);
    header(doc, "Training Update", logoDataUrl, "Portfolio compliance and mandatory learning");

    drawSectionPanel(doc, {
      x: MARGIN,
      y: 26,
      w: CONTENT_W * 0.3,
      h: 88,
      title: "Learner status",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    drawDonutChart(doc, {
      cx: MARGIN + CONTENT_W * 0.15,
      cy: 68,
      outerR: 20,
      innerR: 12,
      segments: [
        { value: trainingCompleted, color: C.green, label: "Completed" },
        { value: trainingInProgress, color: C.amber, label: "In progress" },
        { value: trainingOverdue, color: C.subtleRed, label: "Overdue" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });

    drawSectionPanel(doc, {
      x: MARGIN + CONTENT_W * 0.32,
      y: 26,
      w: CONTENT_W * 0.68,
      h: 60,
      title: "Mandatory course completion (%)",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    drawHorizontalBarChart(doc, {
      x: MARGIN + CONTENT_W * 0.34,
      y: 36,
      width: CONTENT_W * 0.64,
      rowHeight: 11,
      bars: TALANTON_COMPLIANCE_COURSES.slice(0, 6).map((course, index) => ({
        label: course.title,
        value: course.completionPct,
        color: course.completionPct >= 80 ? C.green : course.completionPct >= 70 ? C.amber : C.subtleRed,
        display: `${course.completionPct}%`,
      })),
      maxValue: 100,
      labelColor: C.text,
      trackColor: C.soft,
    });

    drawSectionPanel(doc, {
      x: MARGIN,
      y: 90,
      w: CONTENT_W,
      h: 32,
      title: "Priority learners",
      colors: { white: C.white, line: C.line, navy: C.navy },
    });
    let y = 100;
    for (const row of TALANTON_MY_TRAINING.filter((t) => t.status === "Overdue" || t.status === "In Progress").slice(0, 3)) {
      setFill(doc, C.soft);
      setDraw(doc, C.line);
      doc.roundedRect(MARGIN + 3, y - 3, CONTENT_W - 6, 9, 1, 1, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(
        `${row.learnerName} · ${companyNameById(row.companyId)} · ${courseTitleById(row.courseId)} · ${row.status} (${row.progress}%)`,
        MARGIN + 6,
        y + 2,
      );
      y += 10;
    }
    footer(doc, data.packName, 9);
  }

  // 10 — Strategic discussion & AOB
  {
    addSlide(doc);
    header(doc, "Strategic Discussion and AOB", logoDataUrl, "Decisions required");
    const cardW = (CONTENT_W - 8) / 3;
    const cardH = 62;
    data.strategicTopics.forEach((topic, index) => {
      const x = MARGIN + index * (cardW + 4);
      const y = 26;
      drawStrategicTopicCard(doc, {
        x,
        y,
        w: cardW,
        h: cardH,
        issue: topic.issue,
        whyItMatters: topic.whyItMatters,
        decisionRequired: topic.decisionRequired,
        impact: topic.impact,
        priority: topic.priority,
        colors: C,
      });
    });
    setFill(doc, C.soft);
    setDraw(doc, C.line);
    doc.roundedRect(MARGIN, 94, CONTENT_W, 28, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Any other business", MARGIN + 4, 101);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(doc, C.text);
    const aob = doc.splitTextToSize(data.aob, CONTENT_W - 10);
    doc.text(aob, MARGIN + 4, 107);
    footer(doc, data.packName, 10);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

function drawRiskRow(
  doc: jsPDF,
  risk: AbhiBoardRisk,
  colX: number[],
  colW: number[],
  y: number,
  index: number,
) {
  const rowH = 13;
  setFill(doc, index % 2 ? C.white : C.soft);
  doc.roundedRect(MARGIN, y - 4, CONTENT_W, rowH, 0.5, 0.5, "F");
  const impactColor = risk.impact === "H" ? C.subtleRed : risk.impact === "M" ? C.amber : C.green;
  setFill(doc, impactColor);
  doc.roundedRect(MARGIN, y - 4, 2.5, rowH, 0.5, 0, "F");
  const trend = abhiRiskTrendLabel(risk.trend);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, C.text);
  const desc = doc.splitTextToSize(risk.risk, colW[0]! - 2);
  doc.text(desc.slice(0, 2), colX[0]!, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setText(doc, C.navy);
  const owner = doc.splitTextToSize(risk.owner, colW[1]! - 2);
  doc.text(owner.slice(0, 1), colX[1]!, y);

  doc.setFont("helvetica", trend === "Increasing" ? "bold" : "normal");
  doc.setFontSize(8);
  setText(doc, trend === "Increasing" ? C.amber : trend === "Reducing" ? C.green : C.text);
  doc.text(trend, colX[2]!, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, C.text);
  const attention = doc.splitTextToSize(boardAttentionForRisk(risk), colW[3]! - 2);
  doc.text(attention.slice(0, 2), colX[3]!, y);
}
