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
): Promise<Uint8Array> {
  const funds = FUNDS_PLATFORM_OVERVIEW;
  const fundList = listTalantonFunds();
  const impactIntel = buildBoardImpactIntelligence();
  const journeys = listJourneyStoriesForBoard().slice(0, 4);
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

  // 2 — Executive Summary
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setText(doc, C.navy);
    doc.text("Agenda", MARGIN, 28);
    data.agenda.forEach((item, index) => {
      const y = 34 + index * 5.8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.navy);
      doc.text(String(index + 1), MARGIN, y);
      doc.setFont("helvetica", "normal");
      setText(doc, C.text);
      doc.text(item, MARGIN + 6, y);
    });

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
    drawFooter(doc, data.packName, 4);
  }

  // 5 — Fund performance
  {
    addSlide(doc);
    drawHeader(doc, "Fund Performance Update", logoDataUrl, "Committed · deployed · available capital");
    const metricW = (CONTENT_W - 8) / 3;
    const metrics = [
      { label: "Capital committed", value: formatFundUsd(funds.capitalCommittedUsd), tone: "navy" as const },
      { label: "Capital deployed", value: formatFundUsd(funds.capitalDeployedUsd), tone: "green" as const },
      { label: "Available capital", value: formatFundUsd(funds.availableCapitalUsd), tone: "amber" as const },
    ];
    metrics.forEach((metric, index) => {
      const x = MARGIN + index * (metricW + 4);
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, 24, metricW, 28, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(metric.label, x + 4, 31);
      doc.setFontSize(20);
      setText(doc, C.navy);
      doc.text(metric.value, x + 4, 42);
    });
    drawStatusPill(doc, MARGIN, 56, 52, 9, `${deploymentPct}% deployed`, "green");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Fund-by-fund snapshot", MARGIN, 72);
    const colX = [MARGIN, MARGIN + 72, MARGIN + 132, MARGIN + 182, MARGIN + 232];
    let y = 78;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 7, "F");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Fund", "Committed", "Deployed", "Companies", "Status"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 8;
    for (const [index, fund] of fundList.slice(0, 5).entries()) {
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, 11, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      doc.text(fund.name, colX[0]!, y);
      doc.text(formatFundUsd(fund.capitalRaisedUsd), colX[1]!, y);
      doc.text(formatFundUsd(fund.capitalDeployedUsd), colX[2]!, y);
      doc.text(String(fund.portfolioCompanyCount), colX[3]!, y);
      doc.text(fund.status, colX[4]!, y);
      y += 11;
    }
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
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Top performers", MARGIN, 28);
    let y = 34;
    for (const company of performers) {
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(MARGIN, y - 3, CONTENT_W * 0.58, 10, 1, 1, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setText(doc, C.text);
      doc.text(
        `${company.companyName} · ${company.country} · Health ${company.healthScore}/100 · ${company.revenueGrowthPct >= 0 ? "+" : ""}${company.revenueGrowthPct}% revenue`,
        MARGIN + 3,
        y + 2,
      );
      y += 11;
    }

    const rightX = MARGIN + CONTENT_W * 0.62;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("New / recently reviewed", rightX, 28);
    let ny = 34;
    for (const company of newcomers) {
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(rightX, ny - 3, CONTENT_W * 0.38, 12, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setText(doc, C.navy);
      doc.text(company.name, rightX + 3, ny + 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(
        `${company.country} · ${company.sector} · ${money(company.investmentAmountUsd, true)} invested`,
        rightX + 3,
        ny + 6,
      );
      ny += 13;
    }

    setFill(doc, C.navy);
    doc.roundedRect(MARGIN, 118, CONTENT_W, 24, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.white);
    doc.text("Portfolio headline", MARGIN + 4, 126);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const portfolioBrief = buildPortfolioExecutiveBriefing();
    doc.text(
      `${funds.portfolioCompanies} companies · ${portfolioBrief.health.companiesRequiringAttention} require attention · ${portfolioBrief.health.reportsOutstanding} quarterly reports outstanding`,
      MARGIN + 4,
      134,
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
    const leftW = CONTENT_W * 0.58;
    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(MARGIN, 24, leftW, 72, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Impact Intelligence", MARGIN + 4, 31);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.text);
    const impactLines = [
      `Impact health: ${impactIntel.health.score}/100 (${impactIntel.health.band})`,
      `Jobs created: ${impactIntel.summary.jobsCreated.toLocaleString()}`,
      `People served: ${impactIntel.summary.peopleServed.toLocaleString()}`,
      `Countries impacted: ${impactIntel.summary.countriesImpacted}`,
      ...impactIntel.keyAchievements.slice(0, 2).map((x) => `• ${x}`),
    ];
    impactLines.forEach((line, index) => doc.text(line, MARGIN + 4, 38 + index * 6));

    const rightX = MARGIN + leftW + 6;
    const rightW = CONTENT_W - leftW - 6;
    setFill(doc, C.white);
    setDraw(doc, C.line);
    doc.roundedRect(rightX, 24, rightW, 72, 1.2, 1.2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("External access surfaces", rightX + 4, 31);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setText(doc, C.text);
    const accessLines = [
      `Board portal — ${data.attendees.length} directors`,
      `Portfolio company portals — ${TALANTON_PORTFOLIO_COMPANIES.length} companies`,
      `Journey stories (board) — ${journeys.length} published`,
      `Impact dashboards — portfolio & company views`,
      `External client access — governed file sharing`,
    ];
    accessLines.forEach((line, index) => doc.text(line, rightX + 4, 38 + index * 6));

    setFill(doc, C.soft);
    doc.roundedRect(MARGIN, 102, CONTENT_W, 40, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Board attention", MARGIN + 4, 109);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.text);
    impactIntel.areasRequiringBoardAttention.slice(0, 3).forEach((item, index) => {
      doc.text(`• ${item}`, MARGIN + 4, 115 + index * 5);
    });
    drawFooter(doc, data.packName, 7);
  }

  // 8 — Journey & impact stories
  {
    addSlide(doc);
    drawHeader(doc, "Latest Journey and Impact Stories", logoDataUrl, "Field evidence for board and LP narrative");
    let y = 28;
    for (const [index, story] of journeys.entries()) {
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 3, CONTENT_W, 18, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setText(doc, C.navy);
      doc.text(story.title, MARGIN + 3, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.muted);
      doc.text(
        `${story.country} · ${story.companyNames.join(", ")} · ${story.startDate}`,
        MARGIN + 3,
        y + 7,
      );
      doc.setFontSize(9);
      setText(doc, C.text);
      const summary = doc.splitTextToSize(
        story.generated.boardSummary || story.generated.executiveSummary || story.purpose,
        CONTENT_W - 8,
      );
      doc.text(summary.slice(0, 2), MARGIN + 3, y + 12);
      y += 19;
    }
    if (journeys.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setText(doc, C.muted);
      doc.text("No published journey stories for the board portal yet.", MARGIN, 40);
    }
    drawFooter(doc, data.packName, 8);
  }

  // 9 — Training update
  {
    addSlide(doc);
    drawHeader(doc, "Training Update", logoDataUrl, "Portfolio compliance and mandatory learning");
    const tileW = (CONTENT_W - 8) / 3;
    [
      { label: "Completed", value: String(trainingCompleted), tone: "green" as const },
      { label: "In progress", value: String(trainingInProgress), tone: "amber" as const },
      { label: "Overdue", value: String(trainingOverdue), tone: "red" as const },
    ].forEach((tile, index) => {
      const x = MARGIN + index * (tileW + 4);
      setFill(doc, C.white);
      setDraw(doc, C.line);
      doc.roundedRect(x, 24, tileW, 24, 1.2, 1.2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setText(doc, C.muted);
      doc.text(tile.label, x + 4, 31);
      doc.setFontSize(22);
      setText(doc, C.navy);
      doc.text(tile.value, x + 4, 42);
      drawStatusPill(doc, x + 4, 44, tileW - 8, 7, tile.label, tile.tone);
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setText(doc, C.navy);
    doc.text("Mandatory courses", MARGIN, 56);
    const colX = [MARGIN, MARGIN + 118, MARGIN + 198, MARGIN + 238];
    let y = 62;
    setFill(doc, C.navy);
    doc.rect(MARGIN, y - 4, CONTENT_W, 7, "F");
    doc.setFontSize(9);
    setText(doc, C.white);
    ["Course", "Assigned cos.", "Completion", "Renewal"].forEach((h, i) => doc.text(h, colX[i]!, y));
    y += 8;
    for (const [index, course] of TALANTON_COMPLIANCE_COURSES.slice(0, 6).entries()) {
      setFill(doc, index % 2 ? C.soft : C.white);
      doc.rect(MARGIN, y - 4, CONTENT_W, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(course.title, colX[0]!, y);
      doc.text(String(course.assignedCompanies), colX[1]!, y);
      doc.text(`${course.completionPct}%`, colX[2]!, y);
      doc.text(`${course.renewEveryMonths} mo`, colX[3]!, y);
      y += 10;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, C.navy);
    doc.text("Priority learners", MARGIN, y + 6);
    y += 12;
    for (const row of TALANTON_MY_TRAINING.filter((t) => t.status === "Overdue" || t.status === "In Progress").slice(0, 4)) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setText(doc, C.text);
      doc.text(
        `${row.learnerName} · ${companyNameById(row.companyId)} · ${courseTitleById(row.courseId)} · ${row.status} (${row.progress}%)`,
        MARGIN,
        y,
      );
      y += 6;
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
