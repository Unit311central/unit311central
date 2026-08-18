/**
 * Northstar Demo — Executive Intelligence (Chief of Staff analysis from demo fixtures).
 */

import "server-only";

import {
  NORTHSTAR_BOARD_ACTIONS,
  NORTHSTAR_BOARD_MEETINGS,
  NORTHSTAR_BOARD_RISKS,
  type DemoBoardAction,
} from "@/lib/demo/board-data";
import {
  NORTHSTAR_ENGINEERING_PROGRAMS,
  NORTHSTAR_ENGINEERING_RISKS,
  getNorthstarEngineeringSummary,
} from "@/lib/demo/engineering-data";
import {
  buildNorthstarClientIntelligence,
  buildNorthstarCompanyIntelligence,
  buildNorthstarMarketIntelligence,
} from "@/lib/demo/northstar-intelligence";
import {
  NORTHSTAR_CASH_GBP,
  NORTHSTAR_MONTHLY_OPEX,
  NORTHSTAR_MONTHLY_REVENUE,
  NORTHSTAR_NET_PROFIT_YTD,
  NORTHSTAR_REVENUE_YTD,
  northstarDemoAsAtLabel,
  northstarGrossMarginPct,
  northstarReportingPlMonthLabel,
  northstarYtdPeriodLabel,
} from "@/lib/demo/northstar-financial-model";
import { buildNorthstarBoardPackData } from "@/lib/demo/northstar-board-pack-model";
import {
  getNorthstarFundraisingPipeline,
  getNorthstarGrantApplications,
} from "@/lib/demo/module-fixtures";
import { buildNorthstarHeadcountGrowthSummary } from "@/lib/demo/northstar-hr-headcount-history";
import { readNorthstarEaModule, type NorthstarModuleReadOptions } from "@/lib/demo/northstar-ea-module-reads";
import { NORTHSTAR_SEED_TARGET_GBP } from "@/lib/demo/fundraising-data";
import {
  resolveNorthstarModuleId,
  type NorthstarModuleId,
} from "@/lib/demo/northstar-module-id";

export type { NorthstarModuleId } from "@/lib/demo/northstar-module-id";
export { resolveNorthstarModuleId } from "@/lib/demo/northstar-module-id";

export type NorthstarHealthStatus = "Green" | "Amber" | "Red";

export type NorthstarHealthDimension = {
  id: "financial" | "commercial" | "operational" | "governance" | "overall";
  label: string;
  status: NorthstarHealthStatus;
  reasoning: string;
};

export type NorthstarExecutiveBriefing = {
  asOf: string;
  nextBoardMeeting: string | null;
  organisationStatus: NorthstarHealthStatus;
  organisationStatusReason: string;
  financialSummary: string[];
  commercialSummary: string[];
  deliverySummary: string[];
  risksRequiringAttention: string[];
  openActions: string[];
  strategicIssues: string[];
  recommendedActions: string[];
};

export type NorthstarOrgHealthAssessment = {
  asOf: string;
  overall: NorthstarHealthStatus;
  dimensions: NorthstarHealthDimension[];
  summary: string;
};

export type NorthstarActionCentreQuery =
  | "overdue"
  | "due_this_week"
  | "by_owner"
  | "open"
  | "all";

export type NorthstarActionCentreResult = {
  asOf: string;
  query: NorthstarActionCentreQuery;
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

export type NorthstarBoardInsightsFocus =
  | "decisions"
  | "deteriorating"
  | "improving"
  | "risks"
  | "financial"
  | "engineering"
  | "clients"
  | "agenda"
  | "general";

export type NorthstarBoardInsights = {
  asOf: string;
  focus: NorthstarBoardInsightsFocus;
  headline: string;
  decisionsRequired: string[];
  deteriorating: string[];
  improving: string[];
  topRisks: string[];
  financial: string[];
  engineering: string[];
  clients: string[];
  recommendedDiscussion: string[];
};

const NORTHSTAR_EA_READ_ONLY_MODULES = new Set<NorthstarModuleId>([
  "home",
  "executive-assistant",
  "business-central",
  "marketing",
  "operations",
  "technology",
  "training",
  "corporate",
  "project-management",
  "productivity",
  "tools",
  "external-client-access",
  "settings",
]);

export type NorthstarModuleQueryResult = {
  asOf: string;
  module: NorthstarModuleId;
  headline: string;
  bullets: string[];
  metrics: Record<string, string | number>;
  navigationHint: string;
  records?: Record<string, unknown>;
};

const AS_OF = "2026-08-16";

function formatGbp(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}m`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `£${Math.round(value / 1_000)}k`;
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function worstStatus(...statuses: NorthstarHealthStatus[]): NorthstarHealthStatus {
  if (statuses.includes("Red")) return "Red";
  if (statuses.includes("Amber")) return "Amber";
  return "Green";
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isOverdue(dueDate: string, asOf = AS_OF) {
  return dueDate < asOf;
}

function isDueThisWeek(dueDate: string, asOf = AS_OF) {
  return dueDate >= asOf && dueDate <= addDays(asOf, 7);
}

function openBoardActions(): DemoBoardAction[] {
  return NORTHSTAR_BOARD_ACTIONS.filter((a) => a.status !== "closed");
}

export function loadNorthstarExecutiveSnapshot(asOf?: string | null) {
  const meetingDate =
    asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf)
      ? asOf
      : (NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled")?.date ?? AS_OF);
  return buildNorthstarBoardPackData(meetingDate);
}

export function assessNorthstarOrgHealth(asOf?: string | null): NorthstarOrgHealthAssessment {
  const data = loadNorthstarExecutiveSnapshot(asOf);
  const company = buildNorthstarCompanyIntelligence();
  const clients = buildNorthstarClientIntelligence();
  const eng = getNorthstarEngineeringSummary();
  const actions = openBoardActions();
  const overdue = actions.filter((a) => isOverdue(a.dueDate));
  const margin = northstarGrossMarginPct(NORTHSTAR_MONTHLY_REVENUE);
  const runwayMonths = Math.round(NORTHSTAR_CASH_GBP / NORTHSTAR_MONTHLY_OPEX);

  const financial: NorthstarHealthDimension = {
    id: "financial",
    label: "Financial",
    status: runwayMonths < 10 ? "Red" : margin < 52 ? "Amber" : "Green",
    reasoning: `Cash ${formatGbp(NORTHSTAR_CASH_GBP, true)} (~${runwayMonths} mo runway); gross margin ${margin}% vs 58% target; net profit YTD ${formatGbp(NORTHSTAR_NET_PROFIT_YTD, true)}.`,
  };

  const commercial: NorthstarHealthDimension = {
    id: "commercial",
    label: "Commercial",
    status:
      clients.summary.atRisk >= 2
        ? "Red"
        : clients.summary.atRisk >= 1 || clients.summary.renewalNext90Days >= 2
          ? "Amber"
          : "Green",
    reasoning: `${clients.summary.atRisk} at-risk account(s); Sheffield Precision renewal in 87 days; portfolio ARR ${formatGbp(clients.summary.portfolioArrGbp, true)}.`,
  };

  const operational: NorthstarHealthDimension = {
    id: "operational",
    label: "Operational / Delivery",
    status:
      eng.risksCriticalOrHigh >= 2 || eng.programsAtRisk >= 2
        ? "Red"
        : eng.programsAtRisk >= 1 || eng.milestonesAtRisk >= 2
          ? "Amber"
          : "Green",
    reasoning: `${eng.programsAtRisk} programme(s) at risk/delayed; Atlas UAT due ${eng.nextGateDate}; ${eng.risksCriticalOrHigh} critical/high engineering risks open.`,
  };

  const governance: NorthstarHealthDimension = {
    id: "governance",
    label: "Governance",
    status:
      overdue.length >= 2
        ? "Red"
        : overdue.length >= 1 ||
            NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "Critical" || r.rating === "High")
              .length >= 3
          ? "Amber"
          : "Green",
    reasoning:
      overdue.length > 0
        ? `${overdue.length} overdue board action(s); next board ${NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled")?.date ?? "TBC"}.`
        : `Board cadence on track; ${actions.length} open actions.`,
  };

  const overallStatus = worstStatus(
    financial.status,
    commercial.status,
    operational.status,
    governance.status,
  );

  return {
    asOf: data.meetingDate,
    overall: overallStatus,
    dimensions: [
      financial,
      commercial,
      operational,
      governance,
      {
        id: "overall",
        label: "Overall",
        status: overallStatus,
        reasoning: `Organisation status is ${overallStatus} across financial, commercial, operational, and governance.`,
      },
    ],
    summary: company.postureReason,
  };
}

export function buildNorthstarExecutiveBriefing(asOf?: string | null): NorthstarExecutiveBriefing {
  const data = loadNorthstarExecutiveSnapshot(asOf);
  const health = assessNorthstarOrgHealth(asOf);
  const company = buildNorthstarCompanyIntelligence();
  const clients = buildNorthstarClientIntelligence();
  const market = buildNorthstarMarketIntelligence();
  const eng = getNorthstarEngineeringSummary();
  const actions = openBoardActions();
  const pipeline = getNorthstarFundraisingPipeline().filter((d) => d.stage !== "Passed");

  return {
    asOf: data.meetingDate,
    nextBoardMeeting: NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled")?.date ?? null,
    organisationStatus: health.overall,
    organisationStatusReason: health.summary,
    financialSummary: [
      `Revenue YTD ${formatGbp(NORTHSTAR_REVENUE_YTD, true)} (${northstarYtdPeriodLabel()}).`,
      `Cash ${formatGbp(NORTHSTAR_CASH_GBP, true)}; monthly opex ${formatGbp(NORTHSTAR_MONTHLY_OPEX, true)}.`,
      `Gross margin ${northstarGrossMarginPct(NORTHSTAR_MONTHLY_REVENUE)}% in ${northstarReportingPlMonthLabel()} — target 58%.`,
      data.financialInsights.cash.assessment,
    ],
    commercialSummary: [
      `${clients.summary.activeAccounts} active accounts; ${clients.summary.atRisk} at-risk.`,
      `Sheffield Precision — health score 41; renewal in 87 days; 8 open support tickets.`,
      `Seed pipeline ${pipeline.length} active investors toward ${formatGbp(NORTHSTAR_SEED_TARGET_GBP, true)} target.`,
    ],
    deliverySummary: [
      `Atlas Monitoring Platform delayed — ${eng.programsAtRisk} programmes at risk; UAT sign-off ${eng.nextGateDate}.`,
      `Voltex lead time +6 weeks — root cause of Sheffield slippage and margin compression.`,
      `Firmware QA backlog — 3-week validation queue blocking Bristol onboarding.`,
    ],
    risksRequiringAttention: [
      ...NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "High" || r.rating === "Critical")
        .slice(0, 3)
        .map((r) => `${r.title} (${r.owner})`),
      ...company.deliverySignals
        .filter((s) => s.severity === "critical" || s.severity === "high")
        .slice(0, 2)
        .map((s) => s.title),
    ],
    openActions: actions.slice(0, 6).map((a) => `${a.title} — ${a.owner}, due ${a.dueDate}`),
    strategicIssues: [
      "Margin recovery to 58% gross margin by Q4.",
      "Atlas go-live and Sheffield retention — largest ARR concentration (~22%).",
      "Seed round execution — Midlands Growth Partners term sheet in progress.",
      market.signals[0]?.title ?? "SenseForge competitive pricing pressure in EU mid-market.",
    ],
    recommendedActions: company.priorityActions.slice(0, 4).map((a) => a.title),
  };
}

export function formatNorthstarExecutiveBriefingText(briefing: NorthstarExecutiveBriefing): string {
  const lines = [
    `Northstar executive briefing — ${briefing.organisationStatus} overall`,
    `As of ${briefing.asOf}${briefing.nextBoardMeeting ? ` · Next board ${briefing.nextBoardMeeting}` : ""}`,
    "",
    briefing.organisationStatusReason,
    "",
    "Financial",
    ...briefing.financialSummary.map((l) => `• ${l}`),
    "",
    "Commercial",
    ...briefing.commercialSummary.map((l) => `• ${l}`),
    "",
    "Delivery",
    ...briefing.deliverySummary.map((l) => `• ${l}`),
    "",
    "Risks requiring attention",
    ...briefing.risksRequiringAttention.map((l) => `• ${l}`),
    "",
    "Recommended actions",
    ...briefing.recommendedActions.map((l) => `• ${l}`),
  ];
  return lines.join("\n");
}

export function formatNorthstarOrgHealthText(health: NorthstarOrgHealthAssessment): string {
  const lines = [
    `Organisation health — ${health.overall} overall (as of ${health.asOf})`,
    "",
    health.summary,
    "",
    ...health.dimensions
      .filter((d) => d.id !== "overall")
      .map((d) => `${d.label}: ${d.status} — ${d.reasoning}`),
  ];
  return lines.join("\n");
}

export function queryNorthstarActionCentre(
  query: NorthstarActionCentreQuery,
): NorthstarActionCentreResult {
  const all = NORTHSTAR_BOARD_ACTIONS;
  let filtered = all.filter((a) => a.status !== "closed");

  if (query === "overdue") {
    filtered = filtered.filter((a) => isOverdue(a.dueDate));
  } else if (query === "due_this_week") {
    filtered = filtered.filter((a) => isDueThisWeek(a.dueDate));
  } else if (query === "open") {
    filtered = filtered.filter((a) => a.status === "open" || a.status === "in_progress");
  }

  if (query === "by_owner") {
    const loads = new Map<string, { count: number; overdue: number }>();
    for (const action of filtered) {
      const row = loads.get(action.owner) ?? { count: 0, overdue: 0 };
      row.count += 1;
      if (isOverdue(action.dueDate)) row.overdue += 1;
      loads.set(action.owner, row);
    }
    const ownerLoads = [...loads.entries()]
      .map(([owner, row]) => ({ owner, ...row }))
      .sort((a, b) => b.count - a.count);
    return {
      asOf: AS_OF,
      query,
      headline: "Board action owners by open load",
      actions: [],
      ownerLoads,
    };
  }

  const headline =
    query === "overdue"
      ? `${filtered.length} overdue board action(s)`
      : query === "due_this_week"
        ? `${filtered.length} board action(s) due this week`
        : `${filtered.length} open board action(s)`;

  return {
    asOf: AS_OF,
    query,
    headline,
    actions: filtered.map((a) => ({
      id: a.id,
      title: a.title,
      owner: a.owner,
      due: a.dueDate,
      status: a.status === "in_progress" ? "In progress" : a.status,
    })),
  };
}

export function formatNorthstarActionCentreText(result: NorthstarActionCentreResult): string {
  const lines = [result.headline, `As of ${result.asOf}`, ""];
  if (result.ownerLoads?.length) {
    for (const row of result.ownerLoads) {
      lines.push(`• ${row.owner}: ${row.count} open${row.overdue ? ` (${row.overdue} overdue)` : ""}`);
    }
  } else if (result.actions.length) {
    for (const a of result.actions) {
      lines.push(`• ${a.title} — ${a.owner}, due ${a.due} (${a.status})`);
    }
  } else {
    lines.push("No matching actions on the current register.");
  }
  return lines.join("\n");
}

export function buildNorthstarBoardInsights(
  focus: NorthstarBoardInsightsFocus,
): NorthstarBoardInsights {
  const data = loadNorthstarExecutiveSnapshot();
  const clients = buildNorthstarClientIntelligence();
  const eng = getNorthstarEngineeringSummary();
  const scheduled = NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled");

  const insights: NorthstarBoardInsights = {
    asOf: data.meetingDate,
    focus,
    headline: "Northstar board discussion topics",
    decisionsRequired: scheduled?.agenda.slice(0, 4) ?? data.strategicTopics.map((t) => t.decisionRequired),
    deteriorating: NORTHSTAR_BOARD_RISKS.filter((r) => r.trend === "up").map((r) => r.title),
    improving: NORTHSTAR_BOARD_RISKS.filter((r) => r.trend === "down").map((r) => r.title),
    topRisks: NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "High" || r.rating === "Critical")
      .slice(0, 5)
      .map((r) => `${r.title} (${r.owner})`),
    financial: [
      `Cash ${formatGbp(NORTHSTAR_CASH_GBP, true)}; revenue YTD ${formatGbp(NORTHSTAR_REVENUE_YTD, true)}.`,
      `Gross margin ${northstarGrossMarginPct(NORTHSTAR_MONTHLY_REVENUE)}% — recovery programme to 58% target.`,
      data.financialInsights.cash.assessment,
    ],
    engineering: [
      `${eng.programsAtRisk} programme(s) at risk; next gate ${eng.nextGateLabel} (${eng.nextGateDate}).`,
      `${eng.risksCriticalOrHigh} critical/high engineering risks; ${eng.milestonesAtRisk} milestones at risk.`,
    ],
    clients: clients.rows
      .filter((r) => r.healthBand !== "healthy")
      .slice(0, 4)
      .map((r) => `${r.name} — score ${r.healthScore} — ${r.issues[0] ?? "monitor"}`),
    recommendedDiscussion: data.strategicTopics.map((t) => t.issue),
  };

  if (focus === "engineering") insights.headline = "Engineering & Atlas delivery — board focus";
  if (focus === "financial") insights.headline = "Financial overview — board focus";
  if (focus === "clients") insights.headline = "Client retention & commercial — board focus";
  if (focus === "risks") insights.headline = "Risk register — board focus";

  return insights;
}

export function formatNorthstarBoardInsightsText(insights: NorthstarBoardInsights): string {
  const sections: Array<[string, string[]]> = [
    ["Decisions / agenda", insights.decisionsRequired],
    ["Top risks", insights.topRisks],
    ["Financial", insights.financial],
    ["Engineering", insights.engineering],
    ["Clients", insights.clients],
    ["Recommended discussion", insights.recommendedDiscussion],
  ];
  const lines = [insights.headline, `As of ${insights.asOf}`, ""];
  for (const [title, items] of sections) {
    if (!items.length) continue;
    lines.push(title, ...items.map((l) => `• ${l}`), "");
  }
  return lines.join("\n").trim();
}

export function queryNorthstarModule(
  module: NorthstarModuleId,
  questionOrOptions?: string | NorthstarModuleReadOptions,
  legacyFocus?: string,
): NorthstarModuleQueryResult {
  const options: NorthstarModuleReadOptions =
    typeof questionOrOptions === "string"
      ? { question: questionOrOptions, focus: legacyFocus }
      : (questionOrOptions ?? {});

  if (NORTHSTAR_EA_READ_ONLY_MODULES.has(module)) {
    return readNorthstarEaModule(module, options);
  }

  if (
    module === "qms" ||
    module === "hr" ||
    (options.focus || options.viewId || options.pageLabel)
  ) {
    const enhanced = readNorthstarEaModule(module, options);
    if (enhanced.bullets.length > 0) return enhanced;
  }

  const _question = options.question;
  const asOf = northstarDemoAsAtLabel();
  const company = buildNorthstarCompanyIntelligence();
  const clients = buildNorthstarClientIntelligence();
  const market = buildNorthstarMarketIntelligence();
  const eng = getNorthstarEngineeringSummary();
  const pipeline = getNorthstarFundraisingPipeline().filter((d) => d.stage !== "Passed");
  const pipelineGbp = pipeline.reduce((sum, d) => sum + d.amountGbp, 0);
  const grants = getNorthstarGrantApplications();
  const scheduled = NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled");

  switch (module) {
    case "financials":
      return {
        asOf,
        module,
        headline: `Revenue YTD ${formatGbp(NORTHSTAR_REVENUE_YTD, true)} · margin ${northstarGrossMarginPct(NORTHSTAR_MONTHLY_REVENUE)}% · cash ${formatGbp(NORTHSTAR_CASH_GBP, true)}`,
        bullets: [
          `Net profit YTD ${formatGbp(NORTHSTAR_NET_PROFIT_YTD, true)}.`,
          ...company.costDrivers.slice(0, 3).map((c) => `${c.label}: ${formatGbp(c.amountGbp, true)} — ${c.detail}`),
          company.marginHistory[company.marginHistory.length - 1]?.note ?? "Margin recovery path to 58%.",
        ],
        metrics: {
          revenueYtd: NORTHSTAR_REVENUE_YTD,
          grossMarginPct: northstarGrossMarginPct(NORTHSTAR_MONTHLY_REVENUE),
          cashGbp: NORTHSTAR_CASH_GBP,
          monthlyOpex: NORTHSTAR_MONTHLY_OPEX,
        },
        navigationHint: "Financials → Overview / General Ledger / Bank",
        records: { companyIntelligence: company },
      };
    case "engineering":
      return {
        asOf,
        module,
        headline: `Atlas UAT due ${eng.nextGateDate}; ${eng.programsAtRisk} programme(s) at risk`,
        bullets: [
          ...NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status !== "complete")
            .slice(0, 4)
            .map(
              (p) =>
                `${p.name} — ${p.status.replace("_", " ")} — ${p.progressPct}% — ${p.nextGate} (${p.nextGateDate})`,
            ),
          ...NORTHSTAR_ENGINEERING_RISKS.filter((r) => r.severity === "critical" || r.severity === "high")
            .slice(0, 2)
            .map((r) => `Risk: ${r.title} (${r.severity})`),
        ],
        metrics: {
          programsAtRisk: eng.programsAtRisk,
          milestonesAtRisk: eng.milestonesAtRisk,
          risksCriticalOrHigh: eng.risksCriticalOrHigh,
          utilizationPct: eng.avgUtilizationPct,
        },
        navigationHint: "Engineering → Overview / Programmes & Milestones / Risks",
        records: { overview: eng, programs: NORTHSTAR_ENGINEERING_PROGRAMS },
      };
    case "fundraising":
      return {
        asOf,
        module,
        headline: `Seed round ${formatGbp(pipelineGbp, true)} active pipeline vs ${formatGbp(NORTHSTAR_SEED_TARGET_GBP, true)} target`,
        bullets: pipeline.slice(0, 5).map(
          (d) => `${d.firm} (${d.stage}) — ${formatGbp(d.amountGbp, true)} — ${d.owner}`,
        ),
        metrics: {
          activeDeals: pipeline.length,
          targetGbp: NORTHSTAR_SEED_TARGET_GBP,
          pipelineGbp,
        },
        navigationHint: "Fundraising → Pipeline / Investors / Data Rooms",
        records: { deals: pipeline },
      };
    case "grants":
      return {
        asOf,
        module,
        headline: `${grants.length} grant applications — UK & EU programmes`,
        bullets: grants
          .slice(0, 5)
          .map(
            (g) =>
              `${g.programme} (${g.status}) — ${formatGbp(g.amountEur, true)} — ${g.region} — ${g.owner}`,
          ),
        metrics: {
          totalApplications: grants.length,
          approved: grants.filter((g) => g.status === "Approved").length,
          underReview: grants.filter((g) => g.status === "Under Review" || g.status === "Submitted").length,
        },
        navigationHint: "Fundraising → Grants",
        records: { grants },
      };
    case "board":
      return {
        asOf,
        module,
        headline: scheduled?.title ?? "Board governance snapshot",
        bullets: [
          `Next meeting ${scheduled?.date ?? "TBC"} — ${openBoardActions().length} open actions.`,
          ...NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "High" || r.rating === "Critical")
            .slice(0, 3)
            .map((r) => `Risk: ${r.title}`),
          ...(scheduled?.agenda.slice(0, 3) ?? []),
        ],
        metrics: {
          openActions: openBoardActions().length,
          highRisks: NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "High" || r.rating === "Critical")
            .length,
        },
        navigationHint: "Board → Meetings / Actions / Risk Register",
        records: { meetings: NORTHSTAR_BOARD_MEETINGS, actions: openBoardActions() },
      };
    case "clients":
      return {
        asOf,
        module,
        headline: `${clients.summary.atRisk} at-risk · ${clients.summary.activeAccounts} active accounts`,
        bullets: clients.rows
          .slice(0, 5)
          .map(
            (r) =>
              `${r.name} — health ${r.healthScore} (${r.healthBand}) — ARR ${formatGbp(r.arrGbp, true)} — ${r.issues[0] ?? "stable"}`,
          ),
        metrics: {
          atRisk: clients.summary.atRisk,
          portfolioArrGbp: clients.summary.portfolioArrGbp,
          renewalNext90Days: clients.summary.renewalNext90Days,
        },
        navigationHint: "Business Central → Clients / Client Intelligence",
        records: { clients: clients.rows },
      };
    case "intelligence":
      return {
        asOf,
        module,
        headline: `Intelligence posture — company ${company.posture}, clients ${clients.posture}, market ${market.posture}`,
        bullets: [
          company.postureReason,
          clients.postureReason,
          market.signals[0]?.title ?? "No critical market signals.",
        ],
        metrics: {
          companyPosture: company.posture,
          clientPosture: clients.posture,
          marketPosture: market.posture,
        },
        navigationHint: "Northstar Intelligence → Company / Client / Market",
        records: { company, clients, market },
      };
    case "hr": {
      const hr = buildNorthstarHeadcountGrowthSummary();
      return {
        asOf: hr.asOf,
        module,
        headline: hr.headline,
        bullets: hr.bullets,
        metrics: {
          headcount2026: hr.series[hr.series.length - 1]?.total ?? 25,
          manchester: hr.locations.find((l) => l.id === "manchester")?.current ?? 0,
          bristol: hr.locations.find((l) => l.id === "bristol")?.current ?? 0,
          austin: hr.locations.find((l) => l.id === "austin")?.current ?? 0,
        },
        navigationHint: "Human Resources → Reports → Headcount",
        records: {
          headcountByYear: hr.series,
          chart: {
            type: "stacked_bar",
            title: "Staff growth by location (year-end FTE)",
            xKey: "year",
            series: [
              { key: "manchester", label: "Manchester" },
              { key: "bristol", label: "Bristol" },
              { key: "austin", label: "Austin" },
            ],
            rows: hr.series,
          },
        },
      };
    }
    case "support":
      return {
        asOf,
        module,
        headline: "Support desk — Sheffield drives elevated ticket volume",
        bullets: clients.rows
          .filter((r) => r.openSupportTickets > 0)
          .map((r) => `${r.name}: ${r.openSupportTickets} open ticket(s)`),
        metrics: {
          openTickets: clients.rows.reduce((sum, r) => sum + r.openSupportTickets, 0),
        },
        navigationHint: "Support Desk → Tickets",
        records: { clients: clients.rows },
      };
    case "qms":
      return {
        asOf,
        module,
        headline: "QMS — ISO surveillance and CAPA in progress",
        bullets: [
          "ISO 9001 surveillance schedule update in progress (board action).",
          "Firmware QA backlog flagged as delivery risk — CAPA linkage under review.",
          "Support engineer PIP — quality escape mitigation active.",
        ],
        metrics: { openCapa: 2, auditsDue: 1 },
        navigationHint: "QMS → Audits / CAPA / Documents",
      };
    default:
      return {
        asOf,
        module,
        headline: "Northstar module snapshot",
        bullets: [],
        metrics: {},
        navigationHint: "Use searchApplications for module navigation.",
      };
  }
}

export function formatNorthstarModuleQueryText(result: NorthstarModuleQueryResult): string {
  const lines = [
    result.headline,
    `As of ${result.asOf}`,
    "",
    ...result.bullets.map((b) => `• ${b}`),
    "",
    `Open in platform: ${result.navigationHint}`,
  ];
  return lines.join("\n");
}
