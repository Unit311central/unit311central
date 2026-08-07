/**
 * Talanton Executive Intelligence — Chief of Staff analysis from fund, portfolio,
 * impact, and governance data. Powers EA briefing, org health, actions, and board insights.
 */

import type { AbhiBoardAction, AbhiBoardRisk } from "@/lib/abhi/board-pack-model";
import { TI_BOARD_MEETINGS } from "@/lib/talanton/board-portal-data";
import {
  allActions,
  getTalantonGovernanceSnapshot,
  listMeetings,
  type GovernanceAction,
} from "@/lib/talanton/governance-store";
import {
  buildPortfolioExecutiveBriefing,
  type PortfolioExecutiveBriefing,
} from "@/lib/talanton/portfolio-intelligence";
import {
  buildPortfolioImpactBriefing,
  type PortfolioImpactBriefing,
} from "@/lib/talanton/impact-intelligence";
import {
  FUNDS_PLATFORM_OVERVIEW,
  buildBoardFundSummary,
  formatFundUsd,
  listTalantonFunds,
} from "@/lib/talanton/funds-data";
import {
  getTiRiskRegisterServerSnapshot,
  getTiRiskRegisterState,
  type TiRiskRegisterEntry,
} from "@/lib/talanton/risk-register-store";
import { getTalantonRequestGovernance, getTalantonRequestRisks } from "@/lib/talanton/talanton-request-org-state";
import { TALANTON_CASH_BALANCE_USD } from "@/lib/talanton-financials";

export type TalantonOrgStatus = "Green" | "Amber" | "Red";

export type TalantonHealthDimension = {
  id: "portfolio" | "funds" | "impact" | "governance" | "overall";
  label: string;
  status: TalantonOrgStatus;
  reasoning: string;
};

export type TalantonExecutiveBriefing = {
  asOf: string;
  nextBoardMeeting: string | null;
  organisationStatus: TalantonOrgStatus;
  organisationStatusReason: string;
  portfolioSummary: string[];
  fundsSummary: string[];
  impactSummary: string[];
  governanceSummary: string[];
  risksRequiringAttention: string[];
  openActions: string[];
  recommendedActions: string[];
};

export type TalantonOrgHealthAssessment = {
  asOf: string;
  overall: TalantonOrgStatus;
  dimensions: TalantonHealthDimension[];
  summary: string;
};

export type TalantonActionCentreQuery =
  | "overdue"
  | "due_this_week"
  | "by_owner"
  | "open"
  | "all";

export type TalantonActionCentreResult = {
  asOf: string;
  query: TalantonActionCentreQuery;
  headline: string;
  actions: Array<{
    id: string;
    title: string;
    owner: string;
    due: string;
    status: string;
    meetingTitle?: string;
  }>;
  ownerLoads?: Array<{ owner: string; count: number; overdue: number }>;
};

export type TalantonBoardInsightsFocus =
  | "decisions"
  | "deteriorating"
  | "improving"
  | "risks"
  | "funds"
  | "impact"
  | "portfolio"
  | "governance"
  | "general";

export type TalantonBoardInsights = {
  asOf: string;
  focus: TalantonBoardInsightsFocus;
  headline: string;
  decisionsRequired: string[];
  deteriorating: string[];
  improving: string[];
  topRisks: string[];
  funds: string[];
  impact: string[];
  portfolio: string[];
  recommendedDiscussion: string[];
};

export type TalantonPortfolioQueryResult = {
  asOf: string;
  briefing: PortfolioExecutiveBriefing;
  prose: string;
};

export type TalantonFundsQueryResult = {
  asOf: string;
  overview: typeof FUNDS_PLATFORM_OVERVIEW;
  fundNames: string[];
  prose: string;
};

export type TalantonImpactQueryResult = {
  asOf: string;
  briefing: PortfolioImpactBriefing;
  prose: string;
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

function worstStatus(...statuses: TalantonOrgStatus[]): TalantonOrgStatus {
  if (statuses.includes("Red")) return "Red";
  if (statuses.includes("Amber")) return "Amber";
  return "Green";
}

export function resolveTalantonAnalysisAsOf(explicit?: string | null): string {
  if (explicit && /^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  const next = getNextTalantonBoardMeeting();
  if (next?.meetingDate) return next.meetingDate;
  return todayIso();
}

export function getNextTalantonBoardMeeting() {
  const meetings = listTalantonGovernanceMeetings()
    .filter((m) => !m.archived && (m.status === "Scheduled" || m.status === "Draft"))
    .sort((a, b) => Date.parse(a.meetingDate) - Date.parse(b.meetingDate));
  if (meetings[0]) return meetings[0];
  return (
    TI_BOARD_MEETINGS.filter((m) => m.status === "Scheduled")
      .sort((a, b) => Date.parse(a.meetingDate) - Date.parse(b.meetingDate))[0] ?? null
  );
}

export function listTalantonGovernanceMeetings() {
  const overlay = getTalantonRequestGovernance();
  if (overlay?.meetings?.length) return overlay.meetings;
  try {
    return listMeetings({ includeArchived: false });
  } catch {
    return getTalantonGovernanceSnapshot().meetings.filter((m) => !m.archived);
  }
}

export function listTalantonLiveRisks(): TiRiskRegisterEntry[] {
  const overlay = getTalantonRequestRisks();
  if (overlay?.risks?.length) return overlay.risks.filter((r) => !r.archived);
  try {
    return getTiRiskRegisterState().risks.filter((r) => !r.archived);
  } catch {
    return getTiRiskRegisterServerSnapshot().risks.filter((r) => !r.archived);
  }
}

function mapGovernanceAction(action: GovernanceAction & { meetingTitle?: string }): AbhiBoardAction {
  const status =
    action.status === "Completed"
      ? "Completed"
      : action.status === "Overdue"
        ? "Overdue"
        : "Underway";
  return {
    id: action.id,
    title: action.title,
    owner: action.owner,
    due: action.dueDate,
    status,
  };
}

export function listTalantonBoardActions(): Array<AbhiBoardAction & { meetingTitle?: string }> {
  try {
    const overlay = getTalantonRequestGovernance();
    const source = overlay?.meetings?.length
      ? overlay.meetings.flatMap((m) =>
          m.actions.map((a) => ({ ...a, meetingTitle: m.title })),
        )
      : allActions();
    return source
      .filter((a) => a.status !== "Completed")
      .map((a) => ({ ...mapGovernanceAction(a), meetingTitle: a.meetingTitle }));
  } catch {
    return TI_BOARD_MEETINGS.flatMap((m) =>
      m.actions
        .filter((a) => a.status !== "Completed")
        .map((a) => ({
          id: a.id,
          title: a.title,
          owner: a.owner,
          due: a.dueDate,
          status: a.status === "Overdue" ? ("Overdue" as const) : ("Underway" as const),
          meetingTitle: m.title,
        })),
    );
  }
}

function mapTiRisk(risk: TiRiskRegisterEntry): AbhiBoardRisk {
  return {
    id: risk.id,
    risk: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    rating: risk.rating,
    trend: "→",
    mitigation: risk.mitigation,
    status: risk.status,
    dateRaised: risk.dateAdded,
    reviewDate: risk.reviewDate,
    flags: {},
  };
}

function topTalantonRisks(limit = 5): AbhiBoardRisk[] {
  return [...listTalantonLiveRisks()]
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, limit)
    .map(mapTiRisk);
}

export function assessTalantonOrgHealth(asOf?: string | null): TalantonOrgHealthAssessment {
  const date = resolveTalantonAnalysisAsOf(asOf);
  const portfolio = buildPortfolioExecutiveBriefing(date);
  const impact = buildPortfolioImpactBriefing();
  const funds = FUNDS_PLATFORM_OVERVIEW;
  const actions = listTalantonBoardActions();
  const overdue = actions.filter((a) => a.status === "Overdue");
  const risks = listTalantonLiveRisks();
  const highRisks = risks.filter((r) => Number(r.rating) >= 12);

  const portfolioDim: TalantonHealthDimension = {
    id: "portfolio",
    label: "Portfolio",
    status:
      portfolio.health.posture === "Elevated"
        ? "Red"
        : portfolio.health.posture === "Watch"
          ? "Amber"
          : "Green",
    reasoning: `Portfolio health ${portfolio.health.portfolioHealthScore}/100 (${portfolio.health.posture}). ${portfolio.health.companiesRequiringAttention} companies require attention; ${portfolio.health.reportsOutstanding} reports outstanding.`,
  };

  const fundsDim: TalantonHealthDimension = {
    id: "funds",
    label: "Funds & capital",
    status:
      funds.availableCapitalUsd < funds.capitalCommittedUsd * 0.08
        ? "Amber"
        : "Green",
    reasoning: `${formatFundUsd(funds.capitalDeployedUsd)} deployed of ${formatFundUsd(funds.capitalCommittedUsd)} committed across ${funds.totalFunds} funds; ${formatFundUsd(funds.availableCapitalUsd)} available for deployment.`,
  };

  const impactDim: TalantonHealthDimension = {
    id: "impact",
    label: "Impact",
    status:
      impact.health.band === "At Risk"
        ? "Red"
        : impact.health.band === "Watch"
          ? "Amber"
          : "Green",
    reasoning: `Impact health ${impact.health.score}/100 (${impact.health.band}). ${impact.summary.jobsCreated.toLocaleString()} jobs created; ${impact.summary.peopleServed.toLocaleString()} people served across ${impact.summary.countriesImpacted} countries.`,
  };

  const governanceDim: TalantonHealthDimension = {
    id: "governance",
    label: "Governance",
    status:
      overdue.length >= 2 || highRisks.length >= 3
        ? "Red"
        : overdue.length >= 1 || highRisks.length >= 1
          ? "Amber"
          : "Green",
    reasoning: `${overdue.length} overdue governance actions; ${highRisks.length} elevated risks on the register; next board meeting ${getNextTalantonBoardMeeting()?.meetingDate ?? "TBC"}.`,
  };

  const overallStatus = worstStatus(
    portfolioDim.status,
    fundsDim.status,
    impactDim.status,
    governanceDim.status,
  );

  const overall: TalantonHealthDimension = {
    id: "overall",
    label: "Overall",
    status: overallStatus,
    reasoning: `Talanton stewardship posture is ${overallStatus} — portfolio ${portfolioDim.status}, funds ${fundsDim.status}, impact ${impactDim.status}, governance ${governanceDim.status}.`,
  };

  return {
    asOf: date,
    overall: overallStatus,
    dimensions: [portfolioDim, fundsDim, impactDim, governanceDim, overall],
    summary: overall.reasoning,
  };
}

export function buildTalantonExecutiveBriefing(asOf?: string | null): TalantonExecutiveBriefing {
  const date = resolveTalantonAnalysisAsOf(asOf);
  const health = assessTalantonOrgHealth(date);
  const portfolio = buildPortfolioExecutiveBriefing(date);
  const impact = buildPortfolioImpactBriefing();
  const funds = buildBoardFundSummary();
  const actions = listTalantonBoardActions();
  const risks = topTalantonRisks(4);
  const nextMeeting = getNextTalantonBoardMeeting();

  return {
    asOf: date,
    nextBoardMeeting: nextMeeting?.meetingDate ?? null,
    organisationStatus: health.overall,
    organisationStatusReason: health.summary,
    portfolioSummary: [
      portfolio.overallStatus,
      ...portfolio.significantChanges.slice(0, 2),
    ],
    fundsSummary: [
      `${formatFundUsd(FUNDS_PLATFORM_OVERVIEW.capitalCommittedUsd)} committed · ${formatFundUsd(FUNDS_PLATFORM_OVERVIEW.capitalDeployedUsd)} deployed · ${formatFundUsd(FUNDS_PLATFORM_OVERVIEW.availableCapitalUsd)} available.`,
      ...funds.capitalOverview.slice(0, 2).map((row) => `${row.label}: ${row.value} — ${row.hint}`),
    ],
    impactSummary: [
      impact.overallImpact,
      ...impact.keyAchievements.slice(0, 2),
    ],
    governanceSummary: [
      `Management company cash: ${formatFundUsd(TALANTON_CASH_BALANCE_USD)}.`,
      `${actions.length} open board/governance actions; ${actions.filter((a) => a.status === "Overdue").length} overdue.`,
      nextMeeting ? `Next board meeting: ${nextMeeting.title} on ${nextMeeting.meetingDate}.` : "No scheduled board meeting on the calendar.",
    ],
    risksRequiringAttention: risks.map(
      (r) => `${r.risk} (owner ${r.owner}, rating ${r.rating}) — ${r.mitigation}`,
    ),
    openActions: actions.slice(0, 6).map(
      (a) => `${a.title} — ${a.owner}, due ${a.due} (${a.status})`,
    ),
    recommendedActions: portfolio.recommendedActionsNarrative.slice(0, 4),
  };
}

export function queryTalantonActionCentre(
  query: TalantonActionCentreQuery,
): TalantonActionCentreResult {
  const asOf = todayIso();
  const weekEnd = addDays(asOf, 7);
  const all = listTalantonBoardActions();

  let filtered = all;
  if (query === "overdue") {
    filtered = all.filter((a) => a.status === "Overdue");
  } else if (query === "due_this_week") {
    filtered = all.filter((a) => a.due >= asOf && a.due <= weekEnd && a.status !== "Completed");
  } else if (query === "open") {
    filtered = all.filter((a) => a.status !== "Completed");
  }

  const headline =
    query === "overdue"
      ? `${filtered.length} overdue governance action${filtered.length === 1 ? "" : "s"}`
      : query === "due_this_week"
        ? `${filtered.length} action${filtered.length === 1 ? "" : "s"} due this week`
        : `${filtered.length} open action${filtered.length === 1 ? "" : "s"}`;

  const ownerMap = new Map<string, { count: number; overdue: number }>();
  for (const action of all) {
    const row = ownerMap.get(action.owner) ?? { count: 0, overdue: 0 };
    row.count += 1;
    if (action.status === "Overdue") row.overdue += 1;
    ownerMap.set(action.owner, row);
  }

  return {
    asOf,
    query,
    headline,
    actions: filtered.slice(0, 12).map((a) => ({
      id: a.id,
      title: a.title,
      owner: a.owner,
      due: a.due,
      status: a.status,
      meetingTitle: a.meetingTitle,
    })),
    ownerLoads:
      query === "by_owner"
        ? [...ownerMap.entries()]
            .map(([owner, stats]) => ({ owner, ...stats }))
            .sort((a, b) => b.overdue - a.overdue || b.count - a.count)
        : undefined,
  };
}

export function buildTalantonBoardInsights(
  focus: TalantonBoardInsightsFocus,
): TalantonBoardInsights {
  const asOf = resolveTalantonAnalysisAsOf();
  const portfolio = buildPortfolioExecutiveBriefing(asOf);
  const impact = buildPortfolioImpactBriefing();
  const funds = buildBoardFundSummary();
  const risks = topTalantonRisks(5);
  const meetings = listTalantonGovernanceMeetings();
  const pendingDecisions = meetings.flatMap((m) =>
    m.decisions
      .filter((d) => d.status === "Proposed" || d.status === "Deferred")
      .map((d) => `${d.text} (${m.title})`),
  );

  const deteriorating = portfolio.attentionCompanies
    .filter((c) => c.priority === "Critical" || c.priority === "High")
    .map((c) => `${c.companyName}: ${c.reason} — ${c.detail}`);

  const improving = impact.topCompanies
    .filter((c) => c.trend === "Improving")
    .slice(0, 4)
    .map((c) => `${c.companyName} — impact score ${c.impactScore}/100, ${c.keyImpactMetricLabel} ${c.keyImpactMetric}`);

  const headlineByFocus: Record<TalantonBoardInsightsFocus, string> = {
    decisions: `${pendingDecisions.length} board decisions awaiting resolution`,
    deteriorating: `${deteriorating.length} portfolio companies on leadership watch`,
    improving: `${improving.length} holdings with improving impact trajectory`,
    risks: `${risks.length} priority risks for board discussion`,
    funds: `Capital stewardship across ${FUNDS_PLATFORM_OVERVIEW.totalFunds} funds`,
    impact: `Portfolio impact health ${impact.health.score}/100 (${impact.health.band})`,
    portfolio: `Portfolio posture ${portfolio.health.posture} at ${portfolio.health.portfolioHealthScore}/100`,
    governance: `${listTalantonBoardActions().filter((a) => a.status === "Overdue").length} overdue governance actions`,
    general: `Talanton board insights as of ${asOf}`,
  };

  return {
    asOf,
    focus,
    headline: headlineByFocus[focus],
    decisionsRequired: pendingDecisions.slice(0, 6),
    deteriorating: deteriorating.slice(0, 5),
    improving,
    topRisks: risks.map((r) => `${r.risk} — ${r.owner}, rating ${r.rating}`),
    funds: funds.fundCards.map(
      (f) => `${f.name}: ${f.deployed} deployed (${f.deploymentPct}%), ${f.companies} companies`,
    ),
    impact: [
      impact.health.healthText,
      ...impact.areasRequiringAttention.slice(0, 3),
    ],
    portfolio: [
      portfolio.healthSummaryText,
      ...portfolio.companiesRequiringAttentionNarrative.slice(0, 3),
    ],
    recommendedDiscussion: [
      ...portfolio.recommendedActionsNarrative.slice(0, 2),
      ...impact.recommendedActionsNarrative.slice(0, 2),
    ],
  };
}

export function queryTalantonPortfolio(): TalantonPortfolioQueryResult {
  const briefing = buildPortfolioExecutiveBriefing();
  return {
    asOf: briefing.asOf,
    briefing,
    prose: briefing.briefingText,
  };
}

export function queryTalantonFunds(): TalantonFundsQueryResult {
  const overview = FUNDS_PLATFORM_OVERVIEW;
  const fundNames = listTalantonFunds().map((f) => f.name);
  const prose = [
    `Talanton funds overview — ${formatFundUsd(overview.capitalCommittedUsd)} committed, ${formatFundUsd(overview.capitalDeployedUsd)} deployed, ${formatFundUsd(overview.availableCapitalUsd)} available.`,
    `Funds: ${fundNames.join(", ")}.`,
    `Impact health score ${overview.impactHealthScore}/100 across ${overview.portfolioCompanies} portfolio companies in ${overview.countriesRepresented} countries.`,
  ].join("\n");
  return { asOf: todayIso(), overview, fundNames, prose };
}

export function queryTalantonImpact(): TalantonImpactQueryResult {
  const briefing = buildPortfolioImpactBriefing();
  return { asOf: briefing.asOf, briefing, prose: briefing.briefingText };
}

export function formatTalantonExecutiveBriefingText(brief: TalantonExecutiveBriefing): string {
  return [
    `Talanton Executive Briefing — ${brief.asOf}`,
    `Organisation status: ${brief.organisationStatus} — ${brief.organisationStatusReason}`,
    brief.nextBoardMeeting ? `Next board meeting: ${brief.nextBoardMeeting}` : "",
    "",
    "Portfolio",
    ...brief.portfolioSummary.map((line) => `• ${line}`),
    "",
    "Funds & capital",
    ...brief.fundsSummary.map((line) => `• ${line}`),
    "",
    "Impact",
    ...brief.impactSummary.map((line) => `• ${line}`),
    "",
    "Governance",
    ...brief.governanceSummary.map((line) => `• ${line}`),
    "",
    "Risks requiring attention",
    ...(brief.risksRequiringAttention.length
      ? brief.risksRequiringAttention.map((line) => `• ${line}`)
      : ["• No elevated risks flagged."]),
    "",
    "Open actions",
    ...(brief.openActions.length
      ? brief.openActions.map((line) => `• ${line}`)
      : ["• No open governance actions."]),
    "",
    "Recommended actions",
    ...brief.recommendedActions.map((line, i) => `${i + 1}. ${line}`),
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatTalantonOrgHealthText(health: TalantonOrgHealthAssessment): string {
  return [
    `Talanton organisation health — ${health.asOf}`,
    `Overall: ${health.overall}`,
    health.summary,
    "",
    ...health.dimensions
      .filter((d) => d.id !== "overall")
      .map((d) => `${d.label}: ${d.status} — ${d.reasoning}`),
  ].join("\n");
}

export function formatTalantonActionCentreText(result: TalantonActionCentreResult): string {
  const lines = [
    `${result.headline} (as of ${result.asOf})`,
    "",
    ...result.actions.map(
      (a, i) =>
        `${i + 1}. ${a.title} — ${a.owner}, due ${a.due} (${a.status})${a.meetingTitle ? ` · ${a.meetingTitle}` : ""}`,
    ),
  ];
  if (result.ownerLoads?.length) {
    lines.push("", "By owner:");
    for (const row of result.ownerLoads) {
      lines.push(`• ${row.owner}: ${row.count} open (${row.overdue} overdue)`);
    }
  }
  if (result.actions.length === 0) {
    lines.push("No actions match that query.");
  }
  return lines.join("\n");
}

export function formatTalantonBoardInsightsText(insights: TalantonBoardInsights): string {
  return [
    insights.headline,
    "",
    insights.decisionsRequired.length ? "Decisions required:" : "",
    ...insights.decisionsRequired.map((line) => `• ${line}`),
    "",
    insights.topRisks.length ? "Top risks:" : "",
    ...insights.topRisks.map((line) => `• ${line}`),
    "",
    insights.portfolio.length ? "Portfolio:" : "",
    ...insights.portfolio.map((line) => `• ${line}`),
    "",
    insights.impact.length ? "Impact:" : "",
    ...insights.impact.map((line) => `• ${line}`),
    "",
    insights.funds.length ? "Funds:" : "",
    ...insights.funds.map((line) => `• ${line}`),
    "",
    "Recommended board discussion",
    ...insights.recommendedDiscussion.map((line, i) => `${i + 1}. ${line}`),
  ]
    .filter((line) => line !== "")
    .join("\n");
}
