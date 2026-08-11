/**
 * OnwardAir Executive Intelligence — Chief of Staff analysis from organisational fixtures.
 */

import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { ONWARDAIR_REPORTING_CURRENCY } from "@/lib/onwardair-surface";
import { ONWARDAIR_CASH_BALANCE_USD } from "@/lib/onwardair-financials";
import { buildOnwardAirBoardPackData, formatOaBoardUsd } from "@/lib/onwardair/board-pack-model";
import {
  OA_HELD_BOARD_MEETINGS,
  OA_UPCOMING_BOARD_MEETINGS,
  getOaBoardDashboardSnapshot,
  type OaBoardAction,
} from "@/lib/onwardair/board-data";
import {
  ONWARDAIR_SEED_RAISE_TARGET_USD,
  formatUsdCompact,
} from "@/lib/onwardair/fundraising-data";
import {
  getMergedEngineeringRisks,
  getMergedFundraisingPipeline,
  listMergedOpenBoardActions,
} from "@/lib/onwardair/executive-mutations-store";
import {
  OA_ENG_PROGRAMS,
  getOaEngineeringOverviewSummary,
} from "@/lib/onwardair/engineering-data";
import {
  listCompetitors,
  listPriorityWatchCompetitors,
} from "@/lib/onwardair/competitor-intelligence-data";
import { listCompetitorIntelFeed } from "@/lib/onwardair/competitor-intelligence-feed-store";
import { getOaOperationsDashboardSummary } from "@/lib/onwardair/operations-data";
import { getOaBcDashboardSummary } from "@/lib/onwardair/business-central-data";
import { patentSummaryStats } from "@/lib/onwardair/ip-patents-data";

export type OaHealthStatus = "Green" | "Amber" | "Red";

export type OaHealthDimension = {
  id: "financial" | "programme" | "fundraising" | "governance" | "overall";
  label: string;
  status: OaHealthStatus;
  reasoning: string;
};

export type OaExecutiveBriefing = {
  asOf: string;
  nextBoardMeeting: string | null;
  organisationStatus: OaHealthStatus;
  organisationStatusReason: string;
  financialSummary: string[];
  programmeSummary: string[];
  fundraisingSummary: string[];
  risksRequiringAttention: string[];
  openActions: string[];
  strategicIssues: string[];
  recommendedActions: string[];
};

export type OaOrgHealthAssessment = {
  asOf: string;
  overall: OaHealthStatus;
  dimensions: OaHealthDimension[];
  summary: string;
};

export type OaActionCentreQuery =
  | "overdue"
  | "due_this_week"
  | "by_owner"
  | "open"
  | "all";

export type OaActionCentreResult = {
  asOf: string;
  query: OaActionCentreQuery;
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

export type OaBoardInsightsFocus =
  | "decisions"
  | "deteriorating"
  | "improving"
  | "risks"
  | "fundraising"
  | "engineering"
  | "financial"
  | "agenda"
  | "general";

export type OaBoardInsights = {
  asOf: string;
  focus: OaBoardInsightsFocus;
  headline: string;
  decisionsRequired: string[];
  deteriorating: string[];
  improving: string[];
  topRisks: string[];
  fundraising: string[];
  engineering: string[];
  financial: string[];
  recommendedDiscussion: string[];
};

export type OaModuleId =
  | "fundraising"
  | "engineering"
  | "board"
  | "intelligence"
  | "marketing"
  | "operations"
  | "qms"
  | "technology"
  | "business-central"
  | "training"
  | "support";

export type OaModuleQueryResult = {
  asOf: string;
  module: OaModuleId;
  headline: string;
  bullets: string[];
  metrics: Record<string, string | number>;
  navigationHint: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function loadOnwardAirExecutiveSnapshot(asOf?: string | null): AbhiBoardPackData {
  const meetingDate =
    asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf)
      ? asOf
      : (OA_UPCOMING_BOARD_MEETINGS[0]?.meetingDate ?? todayIso());
  return buildOnwardAirBoardPackData(meetingDate);
}

function listOaBoardActions(): OaBoardAction[] {
  return listMergedOpenBoardActions();
}

function activePipelineUsd() {
  return getMergedFundraisingPipeline()
    .filter((d) => d.stage !== "Passed")
    .reduce((sum, d) => sum + d.amountUsd, 0);
}

function worstStatus(...statuses: OaHealthStatus[]): OaHealthStatus {
  if (statuses.includes("Red")) return "Red";
  if (statuses.includes("Amber")) return "Amber";
  return "Green";
}

export function assessOnwardAirOrgHealth(asOf?: string | null): OaOrgHealthAssessment {
  const data = loadOnwardAirExecutiveSnapshot(asOf);
  const eng = getOaEngineeringOverviewSummary();
  const actions = listOaBoardActions();
  const overdue = actions.filter((a) => a.status === "Overdue");
  const pipeline = activePipelineUsd();
  const seedPct = Math.round((pipeline / ONWARDAIR_SEED_RAISE_TARGET_USD) * 100);

  const financial: OaHealthDimension = {
    id: "financial",
    label: "Financial",
    status: ONWARDAIR_CASH_BALANCE_USD < 600_000 ? "Red" : ONWARDAIR_CASH_BALANCE_USD < 900_000 ? "Amber" : "Green",
    reasoning: `Cash ${formatOaBoardUsd(ONWARDAIR_CASH_BALANCE_USD, true)} (${ONWARDAIR_REPORTING_CURRENCY}); operating surplus YTD ${formatOaBoardUsd(data.financialOverview.operatingSurplus.actual, true)}.`,
  };

  const programme: OaHealthDimension = {
    id: "programme",
    label: "Programme / Engineering",
    status:
      eng.risksCriticalOrHigh >= 2 || eng.milestonesAtRisk >= 2
        ? "Red"
        : eng.programsAmberOrRed >= 1 || eng.milestonesAtRisk >= 1
          ? "Amber"
          : "Green",
    reasoning: `${eng.programsActive} active programmes; ${eng.milestonesAtRisk} milestones at risk; ${eng.risksCriticalOrHigh} critical/high engineering risks open.`,
  };

  const fundraising: OaHealthDimension = {
    id: "fundraising",
    label: "Fundraising",
    status: seedPct < 25 ? "Red" : seedPct < 50 ? "Amber" : "Green",
    reasoning: `Seed pipeline ${formatUsdCompact(pipeline)} active of ${formatUsdCompact(ONWARDAIR_SEED_RAISE_TARGET_USD)} target (${seedPct}% weighted pipeline coverage).`,
  };

  const governance: OaHealthDimension = {
    id: "governance",
    label: "Governance",
    status:
      overdue.length >= 2
        ? "Red"
        : overdue.length >= 1 || data.risks.filter((r) => r.impact === "H").length >= 2
          ? "Amber"
          : "Green",
    reasoning:
      overdue.length > 0
        ? `${overdue.length} overdue board actions; next board ${OA_UPCOMING_BOARD_MEETINGS[0]?.meetingDate ?? "TBC"}.`
        : `Board cadence on track; next meeting ${OA_UPCOMING_BOARD_MEETINGS[0]?.meetingDate ?? "TBC"}.`,
  };

  const overallStatus = worstStatus(
    financial.status,
    programme.status,
    fundraising.status,
    governance.status,
  );

  const overall: OaHealthDimension = {
    id: "overall",
    label: "Overall",
    status: overallStatus,
    reasoning: `Organisation status is ${overallStatus} across financial, programme, fundraising, and governance.`,
  };

  return {
    asOf: data.meetingDate,
    overall: overallStatus,
    dimensions: [financial, programme, fundraising, governance, overall],
    summary: overall.reasoning,
  };
}

export function buildOnwardAirExecutiveBriefing(asOf?: string | null): OaExecutiveBriefing {
  const data = loadOnwardAirExecutiveSnapshot(asOf);
  const health = assessOnwardAirOrgHealth(asOf);
  const eng = getOaEngineeringOverviewSummary();
  const board = getOaBoardDashboardSnapshot();
  const actions = listOaBoardActions();
  const pipeline = getMergedFundraisingPipeline().filter((d) => d.stage !== "Passed");

  return {
    asOf: data.meetingDate,
    nextBoardMeeting: OA_UPCOMING_BOARD_MEETINGS[0]?.meetingDate ?? null,
    organisationStatus: health.overall,
    organisationStatusReason: health.summary,
    financialSummary: [
      `Cash ${formatOaBoardUsd(ONWARDAIR_CASH_BALANCE_USD, true)} (${ONWARDAIR_REPORTING_CURRENCY}).`,
      `Operating surplus YTD ${formatOaBoardUsd(data.financialOverview.operatingSurplus.actual, true)}.`,
      board.financialSnapshot.map((r) => `${r.label}: ${r.value}`).join(" · "),
    ],
    programmeSummary: [
      `Vertex VTOL / FLEX Pod programmes: ${eng.programsActive} active, ${eng.programsAmberOrRed} amber/red.`,
      `Next gate: ${eng.nextHoverGateLabel} (${eng.nextHoverGateDate}).`,
      `Team utilisation ${eng.avgUtilizationPct}%; ${eng.supplyAtRisk} supply items at risk.`,
    ],
    fundraisingSummary: [
      `Seed target ${formatUsdCompact(ONWARDAIR_SEED_RAISE_TARGET_USD)}; ${pipeline.length} active pipeline deals.`,
      `Top stage: ${pipeline.find((d) => d.stage === "Term sheet" || d.stage === "Diligence")?.firm ?? pipeline[0]?.firm ?? "—"}.`,
      `Pre-seed closed ${formatUsdCompact(1_700_000)} from cap table.`,
    ],
    risksRequiringAttention: [
      ...data.risks.slice(0, 3).map((r) => `${r.risk} (${r.owner})`),
      ...getMergedEngineeringRisks().filter((r) => r.severity === "critical" || r.severity === "high")
        .slice(0, 2)
        .map((r) => `${r.title} — ${r.program}`),
    ],
    openActions: actions.slice(0, 6).map((a) => `${a.title} (${a.owner}, due ${a.dueDate})`),
    strategicIssues: board.strategicTopics,
    recommendedActions: [
      "Lock September board pack narrative (seed + certification path).",
      "Clear overdue board actions before next meeting.",
      "Prioritise engineering supply items with lead time ≥ 8 weeks.",
      `Review competitor intel feed (${listCompetitorIntelFeed().length} signals).`,
    ],
  };
}

export function formatOnwardAirExecutiveBriefingText(brief: OaExecutiveBriefing): string {
  const lines = [
    `OnwardAir executive briefing (as of ${brief.asOf})`,
    `Status: ${brief.organisationStatus} — ${brief.organisationStatusReason}`,
    brief.nextBoardMeeting ? `Next board: ${brief.nextBoardMeeting}` : "",
    "",
    "Financial",
    ...brief.financialSummary.map((l) => `• ${l}`),
    "",
    "Programme / Engineering",
    ...brief.programmeSummary.map((l) => `• ${l}`),
    "",
    "Fundraising",
    ...brief.fundraisingSummary.map((l) => `• ${l}`),
  ];
  if (brief.risksRequiringAttention.length) {
    lines.push("", "Risks requiring attention", ...brief.risksRequiringAttention.map((l) => `• ${l}`));
  }
  if (brief.openActions.length) {
    lines.push("", "Open board actions", ...brief.openActions.map((l) => `• ${l}`));
  }
  if (brief.strategicIssues.length) {
    lines.push("", "Strategic topics", ...brief.strategicIssues.map((l) => `• ${l}`));
  }
  if (brief.recommendedActions.length) {
    lines.push("", "Recommended next steps", ...brief.recommendedActions.map((l) => `• ${l}`));
  }
  return lines.filter(Boolean).join("\n");
}

export function formatOnwardAirOrgHealthText(health: OaOrgHealthAssessment): string {
  const lines = [
    `OnwardAir organisation health: ${health.overall}`,
    health.summary,
    "",
    ...health.dimensions
      .filter((d) => d.id !== "overall")
      .map((d) => `${d.label}: ${d.status} — ${d.reasoning}`),
  ];
  return lines.join("\n");
}

function parseDueWeek(action: OaBoardAction, asOf: string) {
  const due = new Date(`${action.dueDate}T12:00:00`);
  const start = new Date(`${asOf}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return due >= start && due <= end;
}

export function queryOnwardAirActionCentre(query: OaActionCentreQuery): OaActionCentreResult {
  const asOf = todayIso();
  const all = listOaBoardActions();
  let filtered = all;
  let headline = "Open board actions";

  if (query === "overdue") {
    filtered = all.filter((a) => a.status === "Overdue");
    headline = `${filtered.length} overdue board action${filtered.length === 1 ? "" : "s"}`;
  } else if (query === "due_this_week") {
    filtered = all.filter((a) => parseDueWeek(a, asOf));
    headline = `${filtered.length} board action${filtered.length === 1 ? "" : "s"} due this week`;
  } else if (query === "open") {
    filtered = all.filter((a) => a.status === "Underway" || a.status === "Blocked");
    headline = `${filtered.length} open board action${filtered.length === 1 ? "" : "s"}`;
  }

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
    actions: filtered.map((a) => ({
      id: a.id,
      title: a.title,
      owner: a.owner,
      due: a.dueDate,
      status: a.status,
    })),
    ownerLoads:
      query === "by_owner"
        ? [...ownerMap.entries()]
            .map(([owner, stats]) => ({ owner, ...stats }))
            .sort((a, b) => b.count - a.count)
        : undefined,
  };
}

export function formatOnwardAirActionCentreText(result: OaActionCentreResult): string {
  const lines = [result.headline];
  if (result.ownerLoads?.length) {
    lines.push("", "By owner:");
    for (const row of result.ownerLoads) {
      lines.push(`• ${row.owner}: ${row.count} open${row.overdue ? ` (${row.overdue} overdue)` : ""}`);
    }
  } else if (result.actions.length) {
    lines.push("");
    for (const a of result.actions) {
      lines.push(`• ${a.title} — ${a.owner}, due ${a.due} (${a.status})`);
    }
  } else {
    lines.push("No matching actions on the current register.");
  }
  return lines.join("\n");
}

export function buildOnwardAirBoardInsights(focus: OaBoardInsightsFocus): OaBoardInsights {
  const data = loadOnwardAirExecutiveSnapshot();
  const board = getOaBoardDashboardSnapshot();
  const eng = getOaEngineeringOverviewSummary();
  const pipeline = getMergedFundraisingPipeline().filter((d) => d.stage !== "Passed");

  const insights: OaBoardInsights = {
    asOf: data.meetingDate,
    focus,
    headline: "OnwardAir board discussion topics",
    decisionsRequired: board.recentDecisions.map((d) => d.text),
    deteriorating: data.risks.filter((r) => r.trend === "↑").map((r) => r.risk),
    improving: data.risks.filter((r) => r.trend === "↓").map((r) => r.risk),
    topRisks: data.risks.slice(0, 5).map((r) => `${r.risk} (${r.owner})`),
    fundraising: [
      `Seed target ${formatUsdCompact(ONWARDAIR_SEED_RAISE_TARGET_USD)}; ${pipeline.length} active deals.`,
      ...pipeline.slice(0, 3).map((d) => `${d.firm} — ${d.stage} — ${formatUsdCompact(d.amountUsd)}`),
    ],
    engineering: [
      `${eng.programsAmberOrRed} programmes amber/red; next gate ${eng.nextHoverGateLabel} (${eng.nextHoverGateDate}).`,
      `${eng.risksCriticalOrHigh} critical/high engineering risks; ${eng.supplyAtRisk} supply items at risk.`,
    ],
    financial: board.financialSnapshot.map((r) => `${r.label}: ${r.value} — ${r.hint}`),
    recommendedDiscussion: board.strategicTopics,
  };

  if (focus === "fundraising") insights.headline = "Fundraising & capitalisation — board focus";
  if (focus === "engineering") insights.headline = "Engineering & certification — board focus";
  if (focus === "risks") insights.headline = "Risk register — board focus";
  if (focus === "financial") insights.headline = "Financial overview — board focus";

  return insights;
}

export function formatOnwardAirBoardInsightsText(insights: OaBoardInsights): string {
  const sections: Array<[string, string[]]> = [
    ["Decisions required", insights.decisionsRequired],
    ["Top risks", insights.topRisks],
    ["Fundraising", insights.fundraising],
    ["Engineering", insights.engineering],
    ["Financial", insights.financial],
    ["Recommended discussion", insights.recommendedDiscussion],
  ];
  const lines = [insights.headline, `As of ${insights.asOf}`, ""];
  for (const [title, items] of sections) {
    if (!items.length) continue;
    lines.push(title, ...items.map((l) => `• ${l}`), "");
  }
  return lines.join("\n").trim();
}

export function resolveOnwardAirModuleId(raw: string): OaModuleId | null {
  const lower = raw.toLowerCase();
  if (/fundraising|seed\s+raise|investor|pipeline|term\s+sheet|data\s+room/.test(lower)) return "fundraising";
  if (/engineering|vtol|flex\s+pod|milestone|certification|prototype|programme|program/.test(lower))
    return "engineering";
  if (/board|governance|minutes|deck/.test(lower)) return "board";
  if (/competitor|intelligence|market\s+landscape|evtols?/.test(lower)) return "intelligence";
  if (/marketing|newsletter|event|mailing/.test(lower)) return "marketing";
  if (/operations|inventory|procurement|asset|logistics/.test(lower)) return "operations";
  if (/qms|quality|capa|audit|iso/.test(lower)) return "qms";
  if (/technology|saas|telecom|device|infrastructure|security/.test(lower)) return "technology";
  if (/business\s+central|crm|client|onboarding|grant/.test(lower)) return "business-central";
  if (/training|course|lms|learning/.test(lower)) return "training";
  if (/support|ticket|helpdesk/.test(lower)) return "support";
  return null;
}

export function queryOnwardAirModule(module: OaModuleId, question?: string): OaModuleQueryResult {
  const asOf = todayIso();
  const eng = getOaEngineeringOverviewSummary();
  const board = getOaBoardDashboardSnapshot();
  const ops = getOaOperationsDashboardSummary();
  const bc = getOaBcDashboardSummary();
  const ip = patentSummaryStats();
  const competitors = listPriorityWatchCompetitors();
  const intelFeed = listCompetitorIntelFeed();
  const pipeline = getMergedFundraisingPipeline().filter((d) => d.stage !== "Passed");

  switch (module) {
    case "fundraising":
      return {
        asOf,
        module,
        headline: `Seed raise: ${formatUsdCompact(activePipelineUsd())} active pipeline vs ${formatUsdCompact(ONWARDAIR_SEED_RAISE_TARGET_USD)} target`,
        bullets: pipeline.slice(0, 5).map(
          (d) => `${d.firm} (${d.stage}) — ${formatUsdCompact(d.amountUsd)} — ${d.owner}`,
        ),
        metrics: {
          activeDeals: pipeline.length,
          targetUsd: ONWARDAIR_SEED_RAISE_TARGET_USD,
          pipelineUsd: activePipelineUsd(),
        },
        navigationHint: "Fundraising → Pipeline / Investors / Data Rooms",
      };
    case "engineering":
      return {
        asOf,
        module,
        headline: `${eng.programsActive} programmes; next gate ${eng.nextHoverGateLabel} on ${eng.nextHoverGateDate}`,
        bullets: [
          ...OA_ENG_PROGRAMS.map(
            (p) => `${p.name} — ${p.rag.toUpperCase()} — ${p.progressPct}% — ${p.nextGate}`,
          ),
          ...getMergedEngineeringRisks().filter((r) => r.status === "open" || r.status === "mitigating")
            .slice(0, 3)
            .map((r) => `Risk: ${r.title} (${r.severity})`),
        ],
        metrics: {
          milestonesAtRisk: eng.milestonesAtRisk,
          utilizationPct: eng.avgUtilizationPct,
          supplyAtRisk: eng.supplyAtRisk,
        },
        navigationHint: "Engineering → Overview / Programs & Milestones / Engineering Risks",
      };
    case "board":
      return {
        asOf,
        module,
        headline: `Next board ${board.nextMeeting.meetingDate} — ${board.openActions.length} open actions`,
        bullets: [
          ...board.openActions.map((a) => `${a.title} (${a.owner}, ${a.status})`),
          ...board.strategicTopics.map((t) => `Topic: ${t}`),
        ],
        metrics: { openActions: board.openActions.length, highRisks: board.highRisks.length },
        navigationHint: "Board → Dashboard / Meetings / Risk Register",
      };
    case "intelligence":
      return {
        asOf,
        module,
        headline: `${competitors.length} priority competitors; ${intelFeed.length} intel feed items`,
        bullets: [
          ...competitors.slice(0, 4).map((c) => `${c.companyName} — ${c.certificationCategory}`),
          ...intelFeed.slice(0, 3).map((i) => i.title),
        ],
        metrics: {
          competitorsTracked: listCompetitors().length,
          patentsVerified: ip.verified,
          patentApplications: ip.applications,
        },
        navigationHint: "OnwardAir Intelligence → Competitor Intelligence / IP & Patents",
      };
    case "operations":
      return {
        asOf,
        module,
        headline: `Operations: ${ops.assetsTotal} assets, ${ops.openPurchaseOrders} open POs`,
        bullets: [
          `Inventory items: ${ops.inventoryTotal}`,
          `Procurement spend MTD: ${formatOaBoardUsd(ops.spendMtdUsd, true)}`,
        ],
        metrics: {
          assets: ops.assetsTotal,
          openPos: ops.openPurchaseOrders,
          lowStock: ops.inventoryLowStockHints,
        },
        navigationHint: "Operations → Assets / Inventory / Procurement",
      };
    case "business-central":
      return {
        asOf,
        module,
        headline: `Business Central: ${bc.activeClients} active clients, ${bc.clientsCount} total`,
        bullets: [
          `Pipeline value ${formatOaBoardUsd(bc.pipelineValueUsd, true)}`,
          `${bc.onboardingCount} onboarding in progress · ${bc.discoveryCount} discovery meetings`,
        ],
        metrics: {
          activeClients: bc.activeClients,
          arrUsd: bc.arrUsd,
          partners: bc.partnersCount,
        },
        navigationHint: "Business Central → Clients / CRM / Onboarding",
      };
    default:
      return {
        asOf,
        module,
        headline: `OnwardAir ${module} module`,
        bullets: question ? [`Question noted: ${question}`] : ["Open the module in the sidebar for full detail."],
        metrics: {},
        navigationHint: `Open ${module} from the left sidebar.`,
      };
  }
}

export function formatOnwardAirModuleQueryText(result: OaModuleQueryResult): string {
  const lines = [result.headline, "", ...result.bullets.map((b) => `• ${b}`)];
  if (Object.keys(result.metrics).length) {
    lines.push("", "Key metrics:", ...Object.entries(result.metrics).map(([k, v]) => `• ${k}: ${v}`));
  }
  lines.push("", `Navigate: ${result.navigationHint}`);
  return lines.join("\n");
}
