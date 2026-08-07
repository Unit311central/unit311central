import { jsPDF } from "jspdf";

import {
  abhiRiskScore,
  abhiRiskTrendLabel,
  formatAbhiBoardDate,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
} from "@/lib/abhi/board-pack-model";
import {
  actionChip,
  addSlide,
  boardAttentionForRisk,
  BOARD_PACK_COLORS as C,
  BOARD_PACK_CONTENT_W as CONTENT_W,
  BOARD_PACK_LOGO_H as LOGO_H,
  BOARD_PACK_LOGO_W as LOGO_W,
  BOARD_PACK_MARGIN as MARGIN,
  BOARD_PACK_SLIDE_H as SLIDE_H,
  BOARD_PACK_SLIDE_W as SLIDE_W,
  drawFooter,
  drawHeader,
  drawProgressBar,
  drawStatusPill,
  logoImageFormat,
} from "@/lib/abhi/board-pack-pdf";
import { buildBoardImpactIntelligence } from "@/lib/talanton/board-impact-intelligence";
import { TI_BOARD_MEETINGS } from "@/lib/talanton/board-portal-data";
import { formatTalantonBoardUsd } from "@/lib/talanton/board-pack-model";
import {
  FUNDS_PLATFORM_OVERVIEW,
  formatFundUsd,
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
import {
  drawDonutChart,
  drawGauge,
  drawHorizontalBarChart,
  drawPhotoCard,
  drawQuotePanel,
} from "@/lib/talanton/board-pack-charts";

type PillTone = "green" | "amber" | "red" | "navy";

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

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [SLIDE_W, SLIDE_H] });
  doc.deletePage(1);

  // 1 — Cover
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
    doc.text("Talanton Impact", MARGIN, 32);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    setText(doc, C.navy);
    doc.text("Board Meeting Deck", MARGIN, 45);
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

  // 2 — Executive Summary (visual dashboard)
  {
    addSlide(doc);
    drawHeader(doc, "Executive Summary", logoDataUrl);

    const statusColor =
      data.orgStatus === "Green" ? C.green : data.orgStatus === "Red" ? C.subtleRed : C.amber;
    drawGauge(doc, {
      cx: SLIDE_W - MARGIN - 22,
      cy: 38,
      radius: 14,
      value: impactIntel.health.score,
      max: 100,
      label: `Impact health · ${data.orgStatus}`,
      fill: statusColor,
      textColor: C.navy,
      mutedColor: C.muted,
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Agenda", MARGIN, 28);
    data.agenda.forEach((item, index) => {
      const col = index < 5 ? 0 : 1;
      const row = index % 5;
      const x = MARGIN + col * 68;
      const y = 34 + row * 5.4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      doc.text(String(index + 1), x, y);
      doc.setFont("helvetica", "normal");
      setText(doc, C.text);
      const label = doc.splitTextToSize(item, 60);
      doc.text(label.slice(0, 1), x + 4, y);
    });

    drawDonutChart(doc, {
      cx: MARGIN + 92,
      cy: 72,
      outerR: 22,
      innerR: 13,
      title: "Capital deployment ($M)",
      segments: [
        { value: funds.capitalDeployedUsd / 1_000_000, color: C.green, label: "Deployed" },
        { value: funds.availableCapitalUsd / 1_000_000, color: C.amber, label: "Available" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });

    const kpiX = MARGIN + 138;
    const kpiW = 48;
    data.highlightCards.slice(0, 4).forEach((card, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = kpiX + col * (kpiW + 4);
      const y = 30 + row * 24;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, y, kpiW, 20, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setText(doc, C.muted);
      doc.text(card.title, x + 3, y + 6);
      doc.setFontSize(11);
      setText(doc, C.navy);
      doc.text(card.primary, x + 3, y + 12);
      if (card.secondary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        setText(doc, C.text);
        doc.text(card.secondary, x + 3, y + 17);
      }
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.amber);
    doc.text("Key concerns", MARGIN + 138, 82);
    data.concernCards.slice(0, 2).forEach((card, index) => {
      const y = 88 + index * 12;
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(MARGIN + 138, y, CONTENT_W - 138, 10, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      doc.text(card.title, MARGIN + 141, y + 4);
      doc.setFont("helvetica", "normal");
      setText(doc, C.text);
      doc.text(card.detail, MARGIN + 141, y + 8);
    });

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

  // 3 — Previous minutes & decisions
  {
    addSlide(doc);
    drawHeader(
      doc,
      "Board Previous Minutes and Decisions",
      logoDataUrl,
      heldMeeting ? `${heldMeeting.title} · ${formatAbhiBoardDate(heldMeeting.meetingDate)}` : undefined,
    );

    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(MARGIN, 24, CONTENT_W * 0.48, 58, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Minutes summary", MARGIN + 4, 31);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.text);
    const notes = doc.splitTextToSize(
      heldMeeting?.notes || "Quorum achieved. Prior meeting minutes approved.",
      CONTENT_W * 0.44,
    );
    doc.text(notes.slice(0, 4), MARGIN + 4, 38);

    const rightX = MARGIN + CONTENT_W * 0.52;
    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(rightX, 24, CONTENT_W * 0.48, 58, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Resolutions", rightX + 4, 31);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.text);
    let ry = 38;
    for (const resolution of heldMeeting?.resolutions ?? []) {
      doc.text(`• ${resolution}`, rightX + 4, ry);
      ry += 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Decisions recorded", MARGIN, 88);
    let dy = 94;
    for (const decision of heldMeeting?.decisions ?? []) {
      setFill(doc, C.decision);
      doc.roundedRect(MARGIN, dy - 4, CONTENT_W, 10, 1, 1, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      doc.text(`${decision.resolution ?? "Approved"} — ${decision.text}`, MARGIN + 3, dy + 1);
      dy += 12;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Carried-forward actions", MARGIN, dy + 4);
    dy += 10;
    for (const action of heldMeeting?.actions ?? []) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      doc.text(`• ${action.title} (${action.owner}, due ${action.dueDate}) — ${action.status}`, MARGIN, dy);
      dy += 6;
    }
    drawFooter(doc, data.packName, 3);
  }

  // 4 — Risk Register
  {
    addSlide(doc);
    drawHeader(doc, "Board Risk Register", logoDataUrl, "Executive risk briefing");
    const sorted = [...data.risks].sort((a, b) => abhiRiskScore(b) - abhiRiskScore(a)).slice(0, 6);
    const summary = [
      { label: "Open risks", value: String(sorted.length), color: C.navy },
      {
        label: "High impact",
        value: String(sorted.filter((r) => r.impact === "H").length),
        color: C.amber,
      },
      {
        label: "Mitigating",
        value: String(sorted.filter((r) => r.status === "Mitigating").length),
        color: C.green,
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
    ["Risk", "Owner", "Trend", "Board Attention Required"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 9;
    for (const [index, risk] of sorted.entries()) {
      drawRiskRow(doc, risk, colX, colW, y, index);
      y += 14;
    }

    drawDonutChart(doc, {
      cx: SLIDE_W - MARGIN - 28,
      cy: 40,
      outerR: 16,
      innerR: 9,
      title: "Risk profile",
      segments: [
        {
          value: sorted.filter((r) => r.impact === "H").length,
          color: C.subtleRed,
          label: "High impact",
        },
        {
          value: sorted.filter((r) => r.impact === "M").length,
          color: C.amber,
          label: "Medium",
        },
        {
          value: sorted.filter((r) => r.impact === "L").length,
          color: C.green,
          label: "Low",
        },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });
    drawFooter(doc, data.packName, 4);
  }

  // 5 — Fund performance
  {
    addSlide(doc);
    drawHeader(doc, "Fund Performance Update", logoDataUrl, "Committed · deployed · available capital");

    drawDonutChart(doc, {
      cx: MARGIN + 36,
      cy: 78,
      outerR: 28,
      innerR: 16,
      title: "Platform capital ($M)",
      segments: [
        { value: funds.capitalDeployedUsd / 1_000_000, color: C.green, label: "Deployed" },
        { value: funds.availableCapitalUsd / 1_000_000, color: C.amber, label: "Available" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });
    drawStatusPill(doc, MARGIN + 8, 118, 56, 9, `${deploymentPct}% deployed`, "green");

    drawHorizontalBarChart(doc, {
      x: MARGIN + 88,
      y: 28,
      width: CONTENT_W - 96,
      rowHeight: 14,
      title: "Fund deployment by vehicle",
      bars: fundList.map((fund, index) => ({
        label: fund.shortName || fund.name,
        value: fund.capitalDeployedUsd,
        color: index === 0 ? C.navy : index === 1 ? C.green : C.amber,
        display: formatFundUsd(fund.capitalDeployedUsd),
      })),
      maxValue: Math.max(...fundList.map((f) => f.capitalDeployedUsd), 1),
      titleColor: C.navy,
      labelColor: C.text,
      trackColor: C.soft,
    });

    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 128, CONTENT_W, 22, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    doc.text("Stewardship headline", MARGIN + 4, 136);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${formatFundUsd(funds.capitalCommittedUsd)} committed · ${formatFundUsd(funds.capitalDeployedUsd)} deployed · ${funds.portfolioCompanies} portfolio companies · ${funds.countriesRepresented} countries`,
      MARGIN + 4,
      144,
    );
    drawFooter(doc, data.packName, 5);
  }

  // 6 — Portfolio companies
  {
    addSlide(doc);
    drawHeader(
      doc,
      "Portfolio Companies Summary",
      logoDataUrl,
      "Performance highlights and recent additions",
    );

    drawHorizontalBarChart(doc, {
      x: MARGIN,
      y: 28,
      width: CONTENT_W * 0.58,
      rowHeight: 13,
      title: "Revenue growth — top performers (%)",
      bars: performers.map((company, index) => ({
        label: company.companyName,
        value: Math.max(company.revenueGrowthPct, 0),
        color: index === 0 ? C.green : index === 1 ? C.navy : C.amber,
        display: `${company.revenueGrowthPct >= 0 ? "+" : ""}${company.revenueGrowthPct}%`,
      })),
      maxValue: Math.max(...performers.map((c) => c.revenueGrowthPct), 1),
      titleColor: C.navy,
      labelColor: C.text,
      trackColor: C.soft,
    });

    const portfolioBrief = buildPortfolioExecutiveBriefing();
    drawDonutChart(doc, {
      cx: MARGIN + CONTENT_W * 0.78,
      cy: 62,
      outerR: 24,
      innerR: 14,
      title: "Portfolio health",
      segments: [
        {
          value: funds.portfolioCompanies - portfolioBrief.health.companiesRequiringAttention,
          color: C.green,
          label: "On track",
        },
        {
          value: portfolioBrief.health.companiesRequiringAttention,
          color: C.amber,
          label: "Attention",
        },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("New / recently reviewed", MARGIN, 98);
    let ny = 104;
    for (const company of newcomers.slice(0, 3)) {
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(MARGIN, ny - 3, CONTENT_W * 0.58, 11, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      doc.text(company.name, MARGIN + 3, ny + 2);
      doc.setFont("helvetica", "normal");
      setText(doc, C.muted);
      doc.text(
        `${company.country} · ${company.sector} · ${money(company.investmentAmountUsd, true)} invested`,
        MARGIN + 3,
        ny + 7,
      );
      ny += 12;
    }

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
    drawFooter(doc, data.packName, 6);
  }

  // 7 — Impact Intelligence & external access
  {
    addSlide(doc);
    drawHeader(
      doc,
      "Impact Intelligence & External Access",
      logoDataUrl,
      "Board oversight · portfolio portals · shared intelligence",
    );

    drawDonutChart(doc, {
      cx: MARGIN + 34,
      cy: 72,
      outerR: 26,
      innerR: 15,
      title: "Impact outcomes (index)",
      segments: [
        { value: impactIntel.summary.jobsCreated, color: C.green, label: "Jobs created" },
        { value: Math.round(impactIntel.summary.peopleServed / 1000), color: C.navy, label: "People served (k)" },
        { value: impactIntel.summary.communitiesImpacted, color: C.amber, label: "Communities" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });

    drawHorizontalBarChart(doc, {
      x: MARGIN + 82,
      y: 28,
      width: CONTENT_W - 90,
      rowHeight: 12,
      title: "External access surfaces",
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
      titleColor: C.navy,
      labelColor: C.text,
      trackColor: C.soft,
    });

    setFill(doc, C.soft);
    doc.roundedRect(MARGIN, 108, CONTENT_W, 34, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Board attention", MARGIN + 4, 115);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.text);
    impactIntel.areasRequiringBoardAttention.slice(0, 3).forEach((item, index) => {
      doc.text(`• ${item}`, MARGIN + 4, 121 + index * 5);
    });
    drawFooter(doc, data.packName, 7);
  }

  // 8 — Journey & impact stories
  {
    addSlide(doc);
    drawHeader(doc, "Latest Journey and Impact Stories", logoDataUrl, "Field evidence for board and LP narrative");

    drawQuotePanel(doc, {
      x: MARGIN,
      y: 24,
      w: CONTENT_W,
      h: 34,
      imageDataUrl: assets.harryTurnerPhoto,
      imageFormat: "JPEG",
      name: "Harry Turner",
      role: "Partner, Talanton Impact",
      quote: HARRY_TURNER_QUOTE,
      colors: { navy: C.navy, muted: C.muted, text: C.text, soft: C.soft, white: C.white },
    });

    const cardH = 44;
    const cardW = (CONTENT_W - 6) / Math.max(journeys.length, 1);
    journeys.forEach((story, index) => {
      const x = MARGIN + index * (cardW + 6);
      const y = 64;
      drawPhotoCard(doc, {
        x,
        y,
        w: cardW,
        h: cardH,
        imageDataUrl: assets.journeyPhotos.get(story.id) ?? null,
        imageFormat: "JPEG",
        title: story.title,
        subtitle: `${story.country} · ${story.companyNames.slice(0, 2).join(", ")} · ${story.startDate}`,
        body: story.generated.boardSummary || story.generated.executiveSummary || story.purpose,
        colors: { navy: C.navy, muted: C.muted, text: C.text, line: C.line, white: C.white },
      });
    });

    if (journeys.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text("No published journey stories for the board portal yet.", MARGIN, 80);
    }
    drawFooter(doc, data.packName, 8);
  }

  // 9 — Training update
  {
    addSlide(doc);
    drawHeader(doc, "Training Update", logoDataUrl, "Portfolio compliance and mandatory learning");

    drawDonutChart(doc, {
      cx: MARGIN + 30,
      cy: 72,
      outerR: 24,
      innerR: 14,
      title: "Learner status",
      segments: [
        { value: trainingCompleted, color: C.green, label: "Completed" },
        { value: trainingInProgress, color: C.amber, label: "In progress" },
        { value: trainingOverdue, color: C.subtleRed, label: "Overdue" },
      ],
      titleColor: C.navy,
      mutedColor: C.muted,
      textColor: C.text,
    });

    drawHorizontalBarChart(doc, {
      x: MARGIN + 68,
      y: 28,
      width: CONTENT_W - 76,
      rowHeight: 11,
      title: "Mandatory course completion (%)",
      bars: TALANTON_COMPLIANCE_COURSES.slice(0, 6).map((course, index) => ({
        label: course.title,
        value: course.completionPct,
        color: course.completionPct >= 80 ? C.green : course.completionPct >= 70 ? C.amber : C.subtleRed,
        display: `${course.completionPct}%`,
      })),
      maxValue: 100,
      titleColor: C.navy,
      labelColor: C.text,
      trackColor: C.soft,
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Priority learners", MARGIN, 118);
    let y = 124;
    for (const row of TALANTON_MY_TRAINING.filter((t) => t.status === "Overdue" || t.status === "In Progress").slice(0, 3)) {
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(MARGIN, y - 3, CONTENT_W, 9, 1, 1, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(
        `${row.learnerName} · ${companyNameById(row.companyId)} · ${courseTitleById(row.courseId)} · ${row.status} (${row.progress}%)`,
        MARGIN + 3,
        y + 2,
      );
      y += 10;
    }
    drawFooter(doc, data.packName, 9);
  }

  // 10 — Strategic discussion & AOB
  {
    addSlide(doc);
    drawHeader(doc, "Strategic Discussion and AOB", logoDataUrl, "Decisions required");
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
    drawFooter(doc, data.packName, 10);
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
  const rowH = 14;
  setFill(doc, C.soft);
  if (index % 2) setFill(doc, C.white);
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
  setText(doc, trend === "Increasing" ? C.amber : trend === "Reducing" ? C.green : C.text);
  doc.text(trend, colX[2]!, y + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(doc, C.text);
  const attention = doc.splitTextToSize(boardAttentionForRisk(risk), colW[3]! - 2);
  doc.text(attention.slice(0, 2), colX[3]!, y);
}
