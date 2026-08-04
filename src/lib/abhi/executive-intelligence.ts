/**
 * ABHI Executive Intelligence — Chief of Staff analysis from organisational data.
 * Powers briefing, org health, action centre, and board insights.
 * Board Pack generation is a separate document output — not the default path.
 */

import {
  getAbhiBoardMeetingsState,
  getNextScheduledAbhiBoardMeeting,
  type AbhiMeetingAction,
} from "@/lib/abhi/board-meetings-store";
import { getAbhiRiskRegisterState } from "@/lib/abhi/risk-register-store";
import {
  abhiRiskScore,
  abhiRiskTrendLabel,
  buildAbhiBoardPackData,
  formatAbhiBoardGbp,
  type AbhiBoardAction,
  type AbhiBoardPackData,
  type AbhiBoardRisk,
  type AbhiOrgStatus,
} from "@/lib/abhi/board-pack-model";

export type AbhiHealthStatus = AbhiOrgStatus;

export type AbhiHealthDimension = {
  id: "financial" | "commercial" | "operational" | "governance" | "overall";
  label: string;
  status: AbhiHealthStatus;
  reasoning: string;
};

export type AbhiExecutiveBriefing = {
  asOf: string;
  nextBoardMeeting: string | null;
  organisationStatus: AbhiHealthStatus;
  organisationStatusReason: string;
  financialSummary: string[];
  commercialSummary: string[];
  risksRequiringAttention: string[];
  openActions: string[];
  strategicIssues: string[];
  recommendedActions: string[];
};

export type AbhiOrgHealthAssessment = {
  asOf: string;
  overall: AbhiHealthStatus;
  dimensions: AbhiHealthDimension[];
  summary: string;
};

export type AbhiActionCentreQuery =
  | "overdue"
  | "due_this_week"
  | "by_owner"
  | "open"
  | "all";

export type AbhiActionCentreResult = {
  asOf: string;
  query: AbhiActionCentreQuery;
  headline: string;
  actions: Array<{
    id: string;
    title: string;
    owner: string;
    due: string;
    status: string;
  }>;
  ownerLoads?: Array<{ owner: string; count: number; overdue: number }>;
};

export type AbhiBoardInsightsFocus =
  | "decisions"
  | "deteriorating"
  | "improving"
  | "risks"
  | "sponsorship"
  | "whx"
  | "financial"
  | "agenda"
  | "general";

export type AbhiBoardInsights = {
  asOf: string;
  focus: AbhiBoardInsightsFocus;
  headline: string;
  decisionsRequired: string[];
  deteriorating: string[];
  improving: string[];
  topRisks: string[];
  sponsorship: string[];
  whx: string[];
  financial: string[];
  recommendedDiscussion: string[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Resolve a reference date for analysis (next board meeting, else today). */
export function resolveAbhiAnalysisAsOf(explicit?: string | null): string {
  if (explicit && /^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  try {
    const next = getNextScheduledAbhiBoardMeeting();
    if (next?.meetingDate) return next.meetingDate;
  } catch {
    // fall through
  }
  return todayIso();
}

/** Load canonical ABHI organisational snapshot used by briefing / health / insights. */
export function loadAbhiExecutiveSnapshot(asOf?: string | null): AbhiBoardPackData {
  const meetingDate = resolveAbhiAnalysisAsOf(asOf);
  return buildAbhiBoardPackData(meetingDate);
}

function mapMeetingAction(action: AbhiMeetingAction): AbhiBoardAction {
  const status =
    action.status === "Completed" || action.status === "Closed"
      ? "Completed"
      : action.status === "Overdue"
        ? "Overdue"
        : action.status === "Blocked"
          ? "Blocked"
          : "Underway";
  return {
    id: action.id,
    title: action.title,
    owner: action.owner,
    due: action.dueDate,
    status,
  };
}

/**
 * Prefer Board Meetings store (includes client snapshot during EA turns);
 * fall back to pack buckets.
 */
export function listAbhiBoardActions(data: AbhiBoardPackData): AbhiBoardAction[] {
  try {
    const outstanding = getAbhiBoardMeetingsState()
      .meetings.filter((m) => m.status !== "Archived")
      .flatMap((m) => m.actions)
      .filter((a) => a.status !== "Completed" && a.status !== "Closed");
    if (outstanding.length > 0) {
      return outstanding.map(mapMeetingAction);
    }
  } catch {
    // fall through to pack data
  }
  return [
    ...data.previousActions.overdue,
    ...data.previousActions.outstanding,
  ];
}

/** Risk register (includes client snapshot during EA turns). */
export function listAbhiLiveRisks(): AbhiBoardRisk[] {
  try {
    return getAbhiRiskRegisterState()
      .risks.filter((r) => !r.archived)
      .map((r) => ({
        id: r.id,
        risk: r.description,
        owner: r.owner,
        impact: r.impact,
        likelihood: r.likelihood,
        rating: r.rating,
        trend: r.trend,
        mitigation: r.mitigation,
        status: r.status,
        dateRaised: r.dateRaised,
        reviewDate: r.reviewDate,
        flags: {},
      }));
  } catch {
    return [];
  }
}

function worstStatus(...statuses: AbhiHealthStatus[]): AbhiHealthStatus {
  if (statuses.includes("Red")) return "Red";
  if (statuses.includes("Amber")) return "Amber";
  return "Green";
}

function topRisks(data: AbhiBoardPackData, limit = 3): AbhiBoardRisk[] {
  const live = listAbhiLiveRisks();
  const source = live.length > 0 ? live : data.risks;
  return [...source]
    .sort((a, b) => {
      const byScore = abhiRiskScore(b) - abhiRiskScore(a);
      if (byScore !== 0) return byScore;
      const trendRank = (t: AbhiBoardRisk["trend"]) => (t === "↑" ? 0 : t === "→" ? 1 : 2);
      return trendRank(a.trend) - trendRank(b.trend);
    })
    .slice(0, limit);
}

function sponsorshipGap(data: AbhiBoardPackData) {
  return data.commercial.sponsorship.budget - data.commercial.sponsorship.actual;
}

function whxCommitments(data: AbhiBoardPackData) {
  const kpi = data.kpis.find((row) => /whx/i.test(row.name));
  const actual = typeof kpi?.actual === "number" ? kpi.actual : 28;
  const budget = typeof kpi?.budget === "number" ? kpi.budget : 32;
  return { actual, budget, gap: budget - actual };
}

export function assessAbhiOrgHealth(asOf?: string | null): AbhiOrgHealthAssessment {
  const data = loadAbhiExecutiveSnapshot(asOf);
  const actions = listAbhiBoardActions(data);
  const overdue = actions.filter((a) => a.status === "Overdue");
  const blocked = actions.filter((a) => a.status === "Blocked");
  const gap = sponsorshipGap(data);
  const whx = whxCommitments(data);
  const revenueVar = data.financialOverview.revenueVsBudget.variance ?? 0;
  const riskSource = (() => {
    const live = listAbhiLiveRisks();
    return live.length > 0 ? live : data.risks;
  })();
  const increasingRisks = riskSource.filter((r) => r.trend === "↑");
  const overdueMitigations = riskSource.filter((r) => r.flags.overdueMitigation);

  const financial: AbhiHealthDimension = {
    id: "financial",
    label: "Financial",
    status:
      revenueVar < -200_000 || gap >= 150_000
        ? "Red"
        : revenueVar < -50_000 || gap >= 80_000
          ? "Amber"
          : "Green",
    reasoning:
      revenueVar < 0
        ? `YTD revenue is ${formatAbhiBoardGbp(Math.abs(revenueVar), true)} below budget; cash remains strong at ${formatAbhiBoardGbp(data.financialOverview.cashPosition.actual, true)}.`
        : `Revenue is on or ahead of budget with cash at ${formatAbhiBoardGbp(data.financialOverview.cashPosition.actual, true)}.`,
  };

  const commercial: AbhiHealthDimension = {
    id: "commercial",
    label: "Commercial",
    status: gap >= 180_000 || whx.gap >= 8 ? "Red" : gap >= 60_000 || whx.gap >= 3 ? "Amber" : "Green",
    reasoning: `Sponsorship is ${formatAbhiBoardGbp(gap, true)} below budget; WHX pavilion commitments stand at ${whx.actual} of ${whx.budget}; membership net growth remains positive.`,
  };

  const operational: AbhiHealthDimension = {
    id: "operational",
    label: "Operational",
    status:
      overdue.length >= 3 || blocked.length >= 2
        ? "Red"
        : overdue.length >= 1 || blocked.length >= 1
          ? "Amber"
          : "Green",
    reasoning:
      overdue.length || blocked.length
        ? `${overdue.length} overdue and ${blocked.length} blocked board actions; WHX deposit (£85k due 22 Aug) remains on the critical path.`
        : "No overdue or blocked board actions on the current register.",
  };

  const governance: AbhiHealthDimension = {
    id: "governance",
    label: "Governance",
    status:
      increasingRisks.length >= 2 || overdueMitigations.length >= 1
        ? "Amber"
        : increasingRisks.length >= 1
          ? "Amber"
          : "Green",
    reasoning:
      increasingRisks.length || overdueMitigations.length
        ? `${increasingRisks.length} risks trending up; ${overdueMitigations.length} with overdue mitigation; MHRA SaMD response pack still incomplete ahead of 15 Sep close.`
        : "Risk trends stable; no overdue mitigations flagged.",
  };

  const overallStatus = worstStatus(
    financial.status,
    commercial.status,
    operational.status,
    governance.status,
  );

  const overall: AbhiHealthDimension = {
    id: "overall",
    label: "Overall",
    status: overallStatus,
    reasoning: `Organisation status is ${overallStatus} — driven by ${
      overallStatus === "Green"
        ? "balanced financial, commercial, operational and governance signals"
        : [
            financial.status !== "Green" ? "financial pressure" : null,
            commercial.status !== "Green" ? "commercial gaps" : null,
            operational.status !== "Green" ? "action / delivery pressure" : null,
            governance.status !== "Green" ? "governance watch items" : null,
          ]
            .filter(Boolean)
            .join(", ")
    }.`,
  };

  return {
    asOf: data.meetingDate,
    overall: overallStatus,
    dimensions: [financial, commercial, operational, governance, overall],
    summary: overall.reasoning,
  };
}

export function buildAbhiExecutiveBriefing(asOf?: string | null): AbhiExecutiveBriefing {
  const data = loadAbhiExecutiveSnapshot(asOf);
  const health = assessAbhiOrgHealth(data.meetingDate);
  const actions = listAbhiBoardActions(data);
  const overdue = actions.filter((a) => a.status === "Overdue");
  const open = actions.filter((a) => a.status !== "Completed");
  const risks = topRisks(data, 3);
  const gap = sponsorshipGap(data);
  const whx = whxCommitments(data);
  const nextMeeting = (() => {
    try {
      return getNextScheduledAbhiBoardMeeting()?.meetingDate ?? null;
    } catch {
      return null;
    }
  })();

  return {
    asOf: data.meetingDate,
    nextBoardMeeting: nextMeeting,
    organisationStatus: health.overall,
    organisationStatusReason: health.summary,
    financialSummary: [
      `YTD revenue ${formatAbhiBoardGbp(data.financialOverview.revenueVsBudget.actual, true)} vs budget ${formatAbhiBoardGbp(data.financialOverview.revenueVsBudget.budget ?? 0, true)} (${data.financialInsights.revenue.variance}).`,
      `Operating result ${data.financialInsights.operatingResult.position} — ${data.financialInsights.operatingResult.variance}.`,
      `Cash ${data.financialInsights.cash.current} — ${data.financialInsights.cash.assessment}`,
      `Year-end outlook: ${data.financialInsights.forecast.outlook} (${data.financialInsights.forecast.confidence}).`,
    ],
    commercialSummary: [
      `Membership: ${data.commercial.membership.total} active · net +${data.commercial.membership.net} this quarter.`,
      `Sponsorship: ${formatAbhiBoardGbp(data.commercial.sponsorship.actual, true)} YTD vs ${formatAbhiBoardGbp(data.commercial.sponsorship.budget, true)} budget — gap ${formatAbhiBoardGbp(gap, true)}.`,
      `WHX Dubai: ${whx.actual} of ${whx.budget} pavilion commitments; deposit £85k due 22 Aug on critical path.`,
      `Events: ${formatAbhiBoardGbp(data.commercial.events.revenue, true)} revenue · ${data.commercial.events.registrations.toLocaleString("en-GB")} registrations.`,
    ],
    risksRequiringAttention: risks.map(
      (r) =>
        `${r.id}: ${r.risk} (${abhiRiskTrendLabel(r.trend)}; owner ${r.owner}) — ${r.mitigation}`,
    ),
    openActions: [
      ...overdue.map((a) => `OVERDUE · ${a.id} · ${a.owner} · due ${a.due} — ${a.title}`),
      ...open
        .filter((a) => a.status !== "Overdue")
        .slice(0, 4)
        .map((a) => `${a.status.toUpperCase()} · ${a.id} · ${a.owner} · due ${a.due} — ${a.title}`),
    ],
    strategicIssues: data.strategicTopics.map(
      (t) => `${t.priority}: ${t.issue} — Decision: ${t.decisionRequired}`,
    ),
    recommendedActions: [
      ...data.strategicTopics
        .filter((t) => t.priority === "HIGH")
        .map((t) => t.recommendation),
      ...overdue.slice(0, 2).map((a) => `Clear overdue action ${a.id} (${a.owner}).`),
      "Escalate WHX deposit authority and stand programme before 22 Aug.",
    ].slice(0, 6),
  };
}

export function queryAbhiActionCentre(
  query: AbhiActionCentreQuery = "open",
  asOf?: string | null,
): AbhiActionCentreResult {
  const data = loadAbhiExecutiveSnapshot(asOf);
  const asOfDate = todayIso();
  const weekEnd = addDays(asOfDate, 7);
  const actions = listAbhiBoardActions(data);

  const enriched = actions.map((a) => ({
    id: a.id,
    title: a.title,
    owner: a.owner,
    due: a.due,
    status: a.status,
  }));

  if (query === "by_owner") {
    const map = new Map<string, { owner: string; count: number; overdue: number }>();
    for (const action of enriched) {
      const row = map.get(action.owner) ?? { owner: action.owner, count: 0, overdue: 0 };
      row.count += 1;
      if (action.status === "Overdue") row.overdue += 1;
      map.set(action.owner, row);
    }
    const ownerLoads = [...map.values()].sort(
      (a, b) => b.count - a.count || b.overdue - a.overdue || a.owner.localeCompare(b.owner),
    );
    return {
      asOf: asOfDate,
      query,
      headline:
        ownerLoads.length === 0
          ? "No open board actions on the register."
          : `${ownerLoads[0]!.owner} owns the most open actions (${ownerLoads[0]!.count}).`,
      actions: enriched.sort((a, b) => a.owner.localeCompare(b.owner) || a.due.localeCompare(b.due)),
      ownerLoads,
    };
  }

  let filtered = enriched;
  if (query === "overdue") {
    filtered = enriched.filter((a) => a.status === "Overdue" || a.due < asOfDate);
  } else if (query === "due_this_week") {
    filtered = enriched.filter(
      (a) => a.status !== "Completed" && a.due >= asOfDate && a.due <= weekEnd,
    );
  } else if (query === "open") {
    filtered = enriched.filter((a) => a.status !== "Completed");
  }

  filtered = [...filtered].sort((a, b) => {
    const rank = (s: string) =>
      s === "Overdue" ? 0 : s === "Blocked" ? 1 : s === "Underway" ? 2 : 3;
    const byStatus = rank(a.status) - rank(b.status);
    if (byStatus !== 0) return byStatus;
    return a.due.localeCompare(b.due);
  });

  const headlines: Record<AbhiActionCentreQuery, string> = {
    overdue:
      filtered.length === 0
        ? "No overdue board actions."
        : `${filtered.length} overdue board action${filtered.length === 1 ? "" : "s"} requiring clearance.`,
    due_this_week:
      filtered.length === 0
        ? "No board actions due in the next 7 days."
        : `${filtered.length} board action${filtered.length === 1 ? "" : "s"} due in the next 7 days.`,
    by_owner: "Action ownership",
    open:
      filtered.length === 0
        ? "No open board actions."
        : `${filtered.length} open board action${filtered.length === 1 ? "" : "s"} on the register.`,
    all: `${enriched.length} board actions on the register.`,
  };

  return {
    asOf: asOfDate,
    query,
    headline: headlines[query],
    actions: filtered,
  };
}

export function buildAbhiBoardInsights(
  focus: AbhiBoardInsightsFocus = "general",
  asOf?: string | null,
): AbhiBoardInsights {
  const data = loadAbhiExecutiveSnapshot(asOf);
  const risks = topRisks(data, 3);
  const gap = sponsorshipGap(data);
  const whx = whxCommitments(data);

  const riskSource = (() => {
    const live = listAbhiLiveRisks();
    return live.length > 0 ? live : data.risks;
  })();

  const deteriorating = riskSource
    .filter((r) => r.trend === "↑" || r.flags.increased)
    .map(
      (r) =>
        `${r.id}: ${r.risk} — trend ${abhiRiskTrendLabel(r.trend)}; mitigation: ${r.mitigation}`,
    );

  const improving = riskSource
    .filter((r) => r.trend === "↓")
    .map(
      (r) =>
        `${r.id}: ${r.risk} — trend ${abhiRiskTrendLabel(r.trend)}; mitigation: ${r.mitigation}`,
    );

  const concernDeteriorating = data.concernCards.map(
    (c) => `${c.title}: ${c.detail}`,
  );

  const decisionsRequired = [
    ...data.boardDecisions,
    ...data.strategicTopics
      .filter((t) => t.priority === "HIGH")
      .map((t) => t.decisionRequired),
  ].filter((value, index, all) => all.indexOf(value) === index);

  const sponsorship = data.commercialInsights.sponsorship.lines.map(
    (line) => `${line.label}: ${line.value}`,
  );
  const whxLines = [
    `Pavilion commitments: ${whx.actual} of ${whx.budget} (gap ${whx.gap}).`,
    "Stand build contractor deposit £85k due 22 Aug — critical path.",
    data.commercialInsights.events.lines.find((l) => /whx|delivery/i.test(l.label))
      ?.value
      ? `Delivery: ${data.commercialInsights.events.lines.find((l) => /whx|delivery/i.test(l.label))!.value}`
      : "Delivery confidence Amber pending deposit and elevations sign-off.",
  ];
  const financial = [
    data.financialInsights.revenue.commentary,
    `Revenue position: ${data.financialInsights.revenue.position} · ${data.financialInsights.revenue.variance}.`,
    `Cash: ${data.financialInsights.cash.current} · ${data.financialInsights.cash.movement}.`,
    data.financialInsights.forecast.outlook,
  ];

  const recommendedDiscussion = data.discussionTopics.slice(0, 5);

  const headlines: Record<AbhiBoardInsightsFocus, string> = {
    decisions: `${decisionsRequired.length} board decisions likely required at the next meeting.`,
    deteriorating:
      deteriorating.length > 0
        ? `${deteriorating.length} issues deteriorating (risk trend up).`
        : "No risks currently marked as increasing.",
    improving:
      improving.length > 0
        ? `${improving.length} issues improving (risk trend down).`
        : "No risks currently marked as reducing.",
    risks: `Top ${risks.length} risks facing ABHI.`,
    sponsorship: `Sponsorship is ${formatAbhiBoardGbp(gap, true)} below YTD budget.`,
    whx:
      whx.gap > 0
        ? `WHX targets are at risk — ${whx.gap} pavilion slots still open.`
        : "WHX pavilion commitment target is met.",
    financial: `Financial performance: ${data.financialInsights.revenue.variance}; cash ${data.financialInsights.cash.current}.`,
    agenda: "Recommended board discussion topics for the next meeting.",
    general: `Board insights — organisation ${data.orgStatus}; ${decisionsRequired.length} decisions pending; sponsorship gap ${formatAbhiBoardGbp(gap, true)}.`,
  };

  return {
    asOf: data.meetingDate,
    focus,
    headline: headlines[focus],
    decisionsRequired,
    deteriorating: deteriorating.length ? deteriorating : concernDeteriorating.slice(0, 3),
    improving,
    topRisks: risks.map(
      (r) =>
        `${r.id}: ${r.risk} (score ${abhiRiskScore(r)}, ${abhiRiskTrendLabel(r.trend)}) — Owner: ${r.owner}`,
    ),
    sponsorship,
    whx: whxLines,
    financial,
    recommendedDiscussion,
  };
}

/** Chief-of-Staff prose for an executive briefing. */
export function formatAbhiExecutiveBriefingText(brief: AbhiExecutiveBriefing): string {
  const parts = [
    `Executive briefing (as of ${brief.asOf})`,
    brief.nextBoardMeeting ? `Next board meeting: ${brief.nextBoardMeeting}` : null,
    "",
    "Organisation Status",
    `${brief.organisationStatus} — ${brief.organisationStatusReason}`,
    "",
    "Financial Summary",
    ...brief.financialSummary.map((line) => `• ${line}`),
    "",
    "Commercial Summary",
    ...brief.commercialSummary.map((line) => `• ${line}`),
    "",
    "Risks Requiring Attention",
    ...brief.risksRequiringAttention.map((line, i) => `${i + 1}. ${line}`),
    "",
    "Open Actions",
    ...(brief.openActions.length
      ? brief.openActions.map((line) => `• ${line}`)
      : ["• None outstanding."]),
    "",
    "Strategic Issues",
    ...brief.strategicIssues.map((line) => `• ${line}`),
    "",
    "Recommended Actions",
    ...brief.recommendedActions.map((line, i) => `${i + 1}. ${line}`),
  ];
  return parts.filter((line) => line != null).join("\n");
}

export function formatAbhiOrgHealthText(health: AbhiOrgHealthAssessment): string {
  const lines = [
    `Organisation health: ${health.overall}`,
    health.summary,
    "",
    ...health.dimensions
      .filter((d) => d.id !== "overall")
      .map((d) => `${d.label}: ${d.status} — ${d.reasoning}`),
  ];
  return lines.join("\n");
}

export function formatAbhiActionCentreText(result: AbhiActionCentreResult): string {
  if (result.query === "by_owner" && result.ownerLoads?.length) {
    const lines = [
      result.headline,
      "",
      ...result.ownerLoads.map(
        (row, i) =>
          `${i + 1}. ${row.owner} — ${row.count} open (${row.overdue} overdue)`,
      ),
    ];
    return lines.join("\n");
  }
  if (result.actions.length === 0) return result.headline;
  const lines = [
    result.headline,
    "",
    ...result.actions.map(
      (a, i) =>
        `${i + 1}. [${a.status}] ${a.id} · ${a.owner} · due ${a.due} — ${a.title}`,
    ),
  ];
  return lines.join("\n");
}

export function formatAbhiBoardInsightsText(insights: AbhiBoardInsights): string {
  const focusBlocks: Array<{ title: string; lines: string[] }> = [];
  if (insights.focus === "decisions" || insights.focus === "general" || insights.focus === "agenda") {
    focusBlocks.push({ title: "Decisions likely required", lines: insights.decisionsRequired });
  }
  if (insights.focus === "deteriorating" || insights.focus === "general") {
    focusBlocks.push({ title: "Issues deteriorating", lines: insights.deteriorating });
  }
  if (insights.focus === "improving" || insights.focus === "general") {
    focusBlocks.push({ title: "Issues improving", lines: insights.improving });
  }
  if (insights.focus === "risks" || insights.focus === "general") {
    focusBlocks.push({ title: "Top risks", lines: insights.topRisks });
  }
  if (insights.focus === "sponsorship" || insights.focus === "general") {
    focusBlocks.push({ title: "Sponsorship", lines: insights.sponsorship });
  }
  if (insights.focus === "whx" || insights.focus === "general") {
    focusBlocks.push({ title: "WHX", lines: insights.whx });
  }
  if (insights.focus === "financial" || insights.focus === "general") {
    focusBlocks.push({ title: "Financial performance", lines: insights.financial });
  }
  if (insights.focus === "agenda" || insights.focus === "general") {
    focusBlocks.push({
      title: "What the board should discuss",
      lines: insights.recommendedDiscussion,
    });
  }

  const parts = [insights.headline, ""];
  for (const block of focusBlocks) {
    if (!block.lines.length) continue;
    parts.push(block.title);
    parts.push(...block.lines.map((line, i) => `${i + 1}. ${line}`));
    parts.push("");
  }
  return parts.join("\n").trim();
}
