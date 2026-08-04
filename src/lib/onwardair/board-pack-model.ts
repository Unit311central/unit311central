/**
 * OnwardAir Board Deck — assemble from platform fixtures (Financials, Fundraising,
 * Board, Engineering, HR). Reuses AbhiBoardPackData shape for PDF/PPTX builders.
 */

import type { AbhiBoardPackData, AbhiBoardRisk } from "@/lib/abhi/board-pack-model";
import {
  ONWARDAIR_CASH_BALANCE_USD,
  ONWARDAIR_CAPITAL_RAISED_USD,
  ONWARDAIR_CASH_PRIOR_MONTH_USD,
  ONWARDAIR_BANK_BALANCES_USD,
  getOnwardAirMonthlyCashSeries,
} from "@/lib/onwardair-financials";
import {
  OA_BOARD_DASHBOARD_RISKS,
  OA_BOARD_DECKS,
  OA_HELD_BOARD_MEETINGS,
  OA_UPCOMING_BOARD_MEETINGS,
  getOaBoardDashboardSnapshot,
} from "@/lib/onwardair/board-data";
import { ONWARDAIR_LUMINARY_ADVISORS } from "@/lib/onwardair/board-members-seed";
import {
  FUNDRAISING_PIPELINE,
  ONWARDAIR_SEED_RAISE_TARGET_USD,
} from "@/lib/onwardair/fundraising-data";
import {
  OA_ENG_PROGRAMS,
  OA_ENG_RISKS,
  getOaEngineeringOverviewSummary,
} from "@/lib/onwardair/engineering-data";
import { OA_HR_TEAM_EMPLOYEES } from "@/lib/onwardair/hr-team-data";
import { buildOnwardAirRecruitmentVacancies } from "@/lib/onwardair/hr-ops-data";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function resolveMeetingDate(meetingDateIso?: string): string {
  if (meetingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateIso)) return meetingDateIso;
  return OA_UPCOMING_BOARD_MEETINGS[0]?.meetingDate ?? toIso(new Date());
}

export function formatOaBoardUsd(value: number, compact = false): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (compact) {
    if (abs >= 1_000_000) {
      const m = abs / 1_000_000;
      return `${sign}$${m >= 10 ? Math.round(m) : m.toFixed(1)}M`;
    }
    if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

const OA_AGENDA = [
  "Executive Summary",
  "Previous Actions",
  "Risk Register",
  "Programme KPIs",
  "Financial Overview",
  "Operating Spend",
  "Cash & Balance Sheet",
  "Fundraising & Pipeline",
  "Team & Organisation",
  "Strategic Discussion & AOB",
] as const;

function averageMonthlyBurn(cashTrend: number[]): number {
  if (cashTrend.length < 2) return 80_000;
  const deltas: number[] = [];
  for (let i = 1; i < cashTrend.length; i++) {
    deltas.push(Math.max(0, cashTrend[i - 1]! - cashTrend[i]!));
  }
  const last3 = deltas.slice(-3);
  const avg = last3.reduce((a, b) => a + b, 0) / Math.max(1, last3.length);
  return Math.max(25_000, Math.round(avg / 1000) * 1000);
}

function mapEngSeverity(sev: (typeof OA_ENG_RISKS)[number]["severity"]): "H" | "M" | "L" {
  if (sev === "critical" || sev === "high") return "H";
  if (sev === "medium") return "M";
  return "L";
}

function mapEngLikelihood(
  lik: (typeof OA_ENG_RISKS)[number]["likelihood"],
): "H" | "M" | "L" {
  if (lik === "likely") return "H";
  if (lik === "possible") return "M";
  return "L";
}

function buildRisks(meetingDate: string): AbhiBoardRisk[] {
  const board = OA_BOARD_DASHBOARD_RISKS.map((r, i) => {
    const rating = r.impact === "H" ? 16 : r.impact === "M" ? 9 : 4;
    return {
      id: r.id,
      risk: r.description,
      owner: r.owner,
      impact: r.impact,
      likelihood: (r.impact === "H" ? "M" : "L") as "H" | "M" | "L",
      rating,
      trend: (i === 0 ? "↑" : i === 1 ? "→" : "↓") as "↑" | "→" | "↓",
      mitigation: `${r.status} — owned by ${r.owner} (Board risk register).`,
      status: r.status,
      dateRaised: "2026-05-01",
      reviewDate: meetingDate,
      flags: {
        increased: r.impact === "H" && i === 0,
        new: false,
        overdueMitigation: r.status === "Open" && r.impact === "H",
      },
    } satisfies AbhiBoardRisk;
  });

  const eng = OA_ENG_RISKS.filter((r) => r.status === "open" || r.status === "mitigating")
    .slice(0, 4)
    .map((r, i) => {
      const impact = mapEngSeverity(r.severity);
      const likelihood = mapEngLikelihood(r.likelihood);
      const rating =
        (impact === "H" ? 5 : impact === "M" ? 3 : 1) *
        (likelihood === "H" ? 5 : likelihood === "M" ? 3 : 1);
      return {
        id: r.id.toUpperCase().replace("RK-", "ENG-R-"),
        risk: `${r.title} (${r.program})`,
        owner: r.owner,
        impact,
        likelihood,
        rating,
        trend: (r.severity === "critical" || r.severity === "high" ? "↑" : "→") as "↑" | "→" | "↓",
        mitigation: r.mitigation,
        status: r.status,
        dateRaised: "2026-06-01",
        reviewDate: r.dueDate,
        flags: {
          increased: r.severity === "critical" || r.severity === "high",
          new: i === 0,
          overdueMitigation: r.status === "open" && (r.severity === "critical" || r.severity === "high"),
        },
      } satisfies AbhiBoardRisk;
    });

  return [...board, ...eng].slice(0, 6);
}

export function buildOnwardAirBoardPackData(meetingDateIso?: string): AbhiBoardPackData {
  const meetingDate = resolveMeetingDate(meetingDateIso);
  const snap = getOaBoardDashboardSnapshot(OA_BOARD_DECKS);
  const eng = getOaEngineeringOverviewSummary();
  const packName = `OnwardAir Board Deck — ${meetingDate}`;
  const cash = ONWARDAIR_CASH_BALANCE_USD;
  const raised = ONWARDAIR_CAPITAL_RAISED_USD;
  const seedTarget = ONWARDAIR_SEED_RAISE_TARGET_USD;
  const cashSeries = getOnwardAirMonthlyCashSeries();
  const cashTrend = cashSeries.map((p) => p.amount);
  const monthlyBurn = averageMonthlyBurn(cashTrend);
  const runwayMonths = Math.max(1, Math.round(cash / monthlyBurn));
  const cashMom = cash - ONWARDAIR_CASH_PRIOR_MONTH_USD;
  const openActions = snap.openActions;
  const vacancies = buildOnwardAirRecruitmentVacancies();
  const headcount = OA_HR_TEAM_EMPLOYEES.length;
  const openRoles = vacancies.filter((v) => v.status === "open").length;

  const activePipeline = FUNDRAISING_PIPELINE.filter((d) => d.stage !== "Passed");
  const pipelineUsd = activePipeline.reduce((sum, d) => sum + d.amountUsd, 0);
  const diligenceUsd = activePipeline
    .filter((d) => d.stage === "Diligence" || d.stage === "Term sheet")
    .reduce((sum, d) => sum + d.amountUsd, 0);

  const vertex = OA_ENG_PROGRAMS.find((p) => p.id === "prog-vertex-hover")!;
  const flex = OA_ENG_PROGRAMS.find((p) => p.id === "prog-flex-pod")!;
  const engSpend = OA_ENG_PROGRAMS.reduce((s, p) => s + p.spentUsd, 0);
  const engBudget = OA_ENG_PROGRAMS.reduce((s, p) => s + p.budgetUsd, 0);
  const flightSpend = Math.round(engSpend * 0.18);
  const gaSpend = Math.round(engSpend * 0.12);
  const totalSpend = engSpend; // programmes are the operating spend story

  const mapAction = (a: (typeof openActions)[number]) => ({
    id: a.id,
    title: a.title,
    owner: a.owner,
    due: a.dueDate,
    status: (a.status === "Completed"
      ? "Completed"
      : a.status === "Overdue"
        ? "Overdue"
        : a.status === "Blocked"
          ? "Blocked"
          : "Underway") as "Completed" | "Underway" | "Overdue" | "Blocked",
  });

  const latestHeld = OA_HELD_BOARD_MEETINGS[OA_HELD_BOARD_MEETINGS.length - 1]!;
  const completed = latestHeld.actions.filter((a) => a.status === "Completed").map(mapAction);
  const overdue = openActions.filter((a) => a.status === "Overdue").map(mapAction);
  const outstanding = openActions
    .filter((a) => a.status !== "Overdue" && a.status !== "Completed")
    .map(mapAction);

  const risks = buildRisks(meetingDate);
  const seedPct = Math.round((raised / seedTarget) * 100);

  const strategicTopics = [
    {
      issue: "Seed raise vs $5.0M target",
      evidence: `Pre-Seed ${formatOaBoardUsd(raised, true)} closed; active pipeline ${formatOaBoardUsd(pipelineUsd, true)} (${activePipeline.length} deals).`,
      recommendation: "Keep Q4 diligence cadence on Horizon Aero + Northstar soft circle.",
      whyItMatters: "Protects runway through first hover demo.",
      decisionRequired: "Confirm Seed $5.0M messaging through Q4.",
      impact: "Capital runway & investor confidence",
      priority: "HIGH" as const,
    },
    {
      issue: "Vertex VTOL / FLEX Pod gates",
      evidence: `Vertex ${vertex.progressPct}% (${vertex.nextGate} ${vertex.nextGateDate}); FLEX ${flex.progressPct}% (${flex.nextGate}).`,
      recommendation: "Confirm gate owners before taxi / pod-swap campaigns.",
      whyItMatters: "Locks certification and Seed diligence proof points.",
      decisionRequired: "Confirm Vertex & FLEX gate owners.",
      impact: "Prototype schedule",
      priority: "HIGH" as const,
    },
    {
      issue: "FAA certification pathway",
      evidence: "Board risk OA-R-01 open; counsel engaged; experimental path options in play.",
      recommendation: "Note counsel recommendations in September pack.",
      whyItMatters: "First-flight demo date is investor-sensitive.",
      decisionRequired: "Note FAA counsel recommendations.",
      impact: "Certification timeline",
      priority: "MEDIUM" as const,
    },
    {
      issue: "Defence-logistics pilot pipeline",
      evidence: "McNabb advisory lead; Q2 board endorsed outreach with quarterly updates.",
      recommendation: "Map Q4 pilot opportunities before September lock.",
      whyItMatters: "Diversifies demand thesis beyond civilian cert.",
      decisionRequired: "Endorse Q4 defence pilot shortlist.",
      impact: "Go-to-market optionality",
      priority: "MEDIUM" as const,
    },
  ];

  return {
    meetingDate,
    packName,
    status: "Final",
    orgStatus: eng.programsAmberOrRed > 0 || seedPct < 50 ? "Amber" : "Green",
    attendees: ONWARDAIR_LUMINARY_ADVISORS.slice(0, 7).map((m) => ({
      name: m.fullName,
      role: m.roleTitle,
    })),
    highlightCards: [
      {
        title: "Cash on hand",
        primary: formatOaBoardUsd(cash, true),
        secondary: `~${runwayMonths} mo runway · ${formatOaBoardUsd(monthlyBurn, true)}/mo`,
      },
      {
        title: "Capital raised",
        primary: formatOaBoardUsd(raised, true),
        secondary: "Pre-Seed closed · Cap Table",
      },
      {
        title: "Seed target",
        primary: formatOaBoardUsd(seedTarget, true),
        secondary: `${seedPct}% vs closed · pipeline live`,
      },
      {
        title: "Vertex VTOL™",
        primary: `${vertex.progressPct}%`,
        secondary: `${vertex.nextGate} · ${vertex.nextGateDate}`,
      },
      {
        title: "Next board",
        primary: snap.nextMeeting.meetingDate,
        secondary: "Houston / hybrid",
      },
    ],
    concernCards: risks
      .filter((r) => r.impact === "H")
      .slice(0, 3)
      .map((r) => ({
        title: r.id,
        detail:
          r.risk.length > 52
            ? `${r.risk.slice(0, 49).trimEnd()}…`
            : r.risk,
      })),
    highlights: [
      `Cash ${formatOaBoardUsd(cash, true)} (~${runwayMonths} mo at ${formatOaBoardUsd(monthlyBurn, true)}/mo).`,
      `Pre-Seed ${formatOaBoardUsd(raised, true)}; Seed target ${formatOaBoardUsd(seedTarget, true)}; pipeline ${formatOaBoardUsd(pipelineUsd, true)}.`,
      `Vertex ${vertex.progressPct}% · FLEX ${flex.progressPct}% — next gates ${vertex.nextGateDate} / ${flex.nextGateDate}.`,
      `${headcount} Houston staff · ${openRoles} open roles · ${eng.risksCriticalOrHigh} critical/high eng risks.`,
    ],
    concerns: risks.slice(0, 5).map((r) => r.risk),
    discussionTopics: strategicTopics.map((t) => t.issue),
    boardDecisions: strategicTopics.slice(0, 3).map((t) => t.decisionRequired),
    agenda: [...OA_AGENDA],
    previousActions: {
      completed:
        completed.length > 0
          ? completed
          : [
              {
                id: "OA-A-DONE-01",
                title: "Issue updated Seed pitch narrative to pipeline leads",
                owner: "Dr. Scott Parazynski",
                due: "2026-07-15",
                status: "Completed" as const,
              },
            ],
      outstanding,
      overdue,
    },
    risks,
    kpis: [
      {
        name: "Cash runway (months)",
        actual: runwayMonths,
        budget: 18,
        variance: runwayMonths - 18,
        unit: "count" as const,
        indicator: (runwayMonths >= 12 ? "On track" : "Watch") as "On track" | "Watch",
        trend: cashMom < 0 ? -1 : 1,
        sparkline: cashTrend.slice(-6).map((v) => Math.round(v / monthlyBurn)),
      },
      {
        name: "Seed progress vs target",
        actual: seedPct,
        budget: 100,
        variance: seedPct - 100,
        unit: "percent" as const,
        indicator: "Watch" as const,
        trend: 1,
        sparkline: [10, 15, 22, 28, 32, seedPct],
      },
      {
        name: "Vertex VTOL progress",
        actual: vertex.progressPct,
        budget: 70,
        variance: vertex.progressPct - 70,
        unit: "percent" as const,
        indicator: (vertex.rag === "green" ? "On track" : "Watch") as "On track" | "Watch",
        trend: 1,
        sparkline: [35, 42, 48, 52, 55, vertex.progressPct],
      },
      {
        name: "FLEX Pod progress",
        actual: flex.progressPct,
        budget: 70,
        variance: flex.progressPct - 70,
        unit: "percent" as const,
        indicator: (flex.rag === "green" ? "On track" : "Watch") as "On track" | "Watch",
        trend: 1,
        sparkline: [40, 48, 54, 58, 61, flex.progressPct],
      },
      {
        name: "Open board actions",
        actual: openActions.length,
        budget: 3,
        variance: openActions.length - 3,
        unit: "count" as const,
        indicator: (openActions.length <= 4 ? "On track" : "Watch") as "On track" | "Watch",
        trend: 0,
        sparkline: [6, 5, 4, 4, openActions.length, openActions.length],
      },
      {
        name: "Eng risks (crit/high)",
        actual: eng.risksCriticalOrHigh,
        budget: 2,
        variance: eng.risksCriticalOrHigh - 2,
        unit: "count" as const,
        indicator: (eng.risksCriticalOrHigh <= 2 ? "On track" : "Off track") as
          | "On track"
          | "Off track",
        trend: eng.risksCriticalOrHigh > 2 ? 1 : 0,
        sparkline: [1, 2, 2, 3, eng.risksCriticalOrHigh, eng.risksCriticalOrHigh],
      },
    ],
    financialOverview: {
      revenueVsBudget: {
        label: "Capital raised vs Seed",
        actual: raised,
        budget: seedTarget,
        variance: raised - seedTarget,
      },
      operatingSurplus: {
        label: "Programme spend YTD",
        actual: -engSpend,
        budget: -engBudget,
        variance: -(engSpend - engBudget),
      },
      cashPosition: {
        label: "Cash",
        actual: cash,
        budget: 1_200_000,
        variance: cash - 1_200_000,
      },
      forecastYearEnd: {
        label: "Year-end outlook",
        revenue: 0,
        surplus: -engSpend - monthlyBurn * 4,
        cash: Math.max(0, cash - monthlyBurn * 4),
      },
    },
    financialInsights: {
      revenue: {
        title: "Capital position",
        position: `${formatOaBoardUsd(raised, true)} Pre-Seed closed`,
        variance: `${formatOaBoardUsd(seedTarget - raised, true)} Seed gap`,
        commentary:
          "Pre-revenue — board oversight focuses on runway, Seed close quality, and programme spend.",
      },
      operatingResult: {
        title: "Programme spend",
        position: `${formatOaBoardUsd(engSpend, true)} across ${OA_ENG_PROGRAMS.length} programmes`,
        variance: `${formatOaBoardUsd(engBudget - engSpend, true)} remaining vs programme budgets`,
        commentary: "Engineering-led burn concentrated in Vertex, FLEX Pod, and supporting labs.",
      },
      cash: {
        title: "Cash & runway",
        current: formatOaBoardUsd(cash, true),
        movement:
          cashMom >= 0
            ? `+${formatOaBoardUsd(cashMom, true)} vs prior month`
            : `${formatOaBoardUsd(cashMom, true)} vs prior month`,
        assessment: `~${runwayMonths} months at ~${formatOaBoardUsd(monthlyBurn, true)}/mo.`,
      },
      forecast: {
        title: "Seed outlook",
        outlook: `${formatOaBoardUsd(seedTarget, true)} target · ${formatOaBoardUsd(diligenceUsd, true)} in diligence/term sheet`,
        confidence: "Medium — pipeline dependent",
        assumptions: "Vertex taxi gate and defence-logistics pilots support diligence.",
      },
    },
    pnl: {
      rows: [
        ...OA_ENG_PROGRAMS.slice(0, 4).map((p) => ({
          line: p.name.replace("™", ""),
          actual: p.spentUsd,
          budget: p.budgetUsd,
          variance: p.spentUsd - p.budgetUsd,
          priorYear: Math.round(p.spentUsd * 0.35),
        })),
        {
          line: "Total programme spend",
          actual: engSpend,
          budget: engBudget,
          variance: engSpend - engBudget,
          priorYear: Math.round(engSpend * 0.35),
          emphasis: true,
        },
      ],
      commentary: [
        "Pre-revenue P&L — board monitors programme spend vs runway, not margin.",
        `Vertex next gate: ${vertex.nextGate} (${vertex.nextGateDate}). FLEX: ${flex.nextGate} (${flex.nextGateDate}).`,
      ],
    },
    balanceSheet: {
      assets: cash + 420_000,
      liabilities: 120_000,
      netAssets: cash + 300_000,
      cashTrend,
      cashForecast: Math.max(0, cash - monthlyBurn * 4),
      debtors: 0,
      creditors: 85_000,
      cashMovementMom: cashMom,
      cashDrivers: `Operating ${formatOaBoardUsd(ONWARDAIR_BANK_BALANCES_USD.operating, true)} · Payroll ${formatOaBoardUsd(ONWARDAIR_BANK_BALANCES_USD.payroll, true)} · Reserves ${formatOaBoardUsd(ONWARDAIR_BANK_BALANCES_USD.reserves, true)}.`,
      liquidityAssessment: `Runway ~${runwayMonths} months; Seed close is the primary liquidity lever.`,
      positiveCashDrivers: [{ label: "Pre-Seed residual", amount: raised }],
      negativeCashDrivers: [
        { label: "Programme spend YTD", amount: -engSpend },
        { label: "Flight / ops share", amount: -flightSpend },
        { label: "G&A share", amount: -gaSpend },
      ],
    },
    commercial: {
      membership: {
        new: activePipeline.filter((d) => d.stage === "Intro" || d.stage === "Pitch sent").length,
        lost: FUNDRAISING_PIPELINE.filter((d) => d.stage === "Passed").length,
        net: activePipeline.length,
        total: activePipeline.length,
      },
      sponsorship: { budget: seedTarget, actual: raised, forecast: seedTarget },
      events: {
        revenue: pipelineUsd,
        registrations: activePipeline.length,
        forecast: diligenceUsd,
      },
    },
    commercialInsights: {
      membership: {
        title: "Programme",
        lines: [
          { label: "Vertex", value: `${vertex.progressPct}% · ${vertex.rag.toUpperCase()}` },
          { label: "FLEX Pod", value: `${flex.progressPct}% · ${flex.rag.toUpperCase()}` },
          { label: "Next gate", value: `${vertex.nextGateDate}` },
        ],
      },
      sponsorship: {
        title: "Seed raise",
        lines: [
          { label: "Closed", value: `Pre-Seed ${formatOaBoardUsd(raised, true)}` },
          { label: "Target", value: `Seed ${formatOaBoardUsd(seedTarget, true)}` },
          { label: "Gap", value: formatOaBoardUsd(seedTarget - raised, true) },
        ],
      },
      events: {
        title: "Investor pipeline",
        lines: [
          { label: "Active deals", value: String(activePipeline.length) },
          { label: "Pipeline $", value: formatOaBoardUsd(pipelineUsd, true) },
          { label: "Diligence+", value: formatOaBoardUsd(diligenceUsd, true) },
        ],
      },
    },
    team: {
      headcount,
      openRoles,
      joiners: vacancies.slice(0, 3).map((v) => ({
        name: v.title,
        role: `${v.department} · hiring`,
        startDate: v.targetStartDate.slice(0, 10),
      })),
      leavers: [],
      notes: `Houston HQ · ${eng.teamHeadcount} eng allocations · avg util ${eng.avgUtilizationPct}%. Open: ${vacancies
        .map((v) => v.title)
        .join("; ")}. Mandatory training: Houston Induction, Hangar H&S, Flight Test Ground Rules, HV Battery Handling.`,
    },
    strategicTopics,
    aob: "Confirm September pack lock; review defence-logistics pilot owners; Board Portal live for advisors at /board.",
    pageSummaries: [...OA_AGENDA],
    folderPath: `Corporate Information/Board Deck/${packName}`,
  };
}
