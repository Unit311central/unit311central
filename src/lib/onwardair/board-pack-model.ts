/**
 * OnwardAir Board Deck — live fixture assembly for EA `boardpack.generate`.
 * Reuses AbhiBoardPackData shape so PDF/PPTX slide builders stay compatible;
 * all narrative and figures are OnwardAir aerospace (not ABHI HealthTech).
 */

import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import {
  ONWARDAIR_CASH_BALANCE_USD,
  ONWARDAIR_CAPITAL_RAISED_USD,
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
import { ONWARDAIR_SEED_RAISE_TARGET_USD } from "@/lib/onwardair/fundraising-data";

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

export function buildOnwardAirBoardPackData(meetingDateIso?: string): AbhiBoardPackData {
  const meetingDate = resolveMeetingDate(meetingDateIso);
  const snap = getOaBoardDashboardSnapshot(OA_BOARD_DECKS);
  const packName = `OnwardAir Board Deck — ${meetingDate}`;
  const cash = ONWARDAIR_CASH_BALANCE_USD;
  const raised = ONWARDAIR_CAPITAL_RAISED_USD;
  const seedTarget = ONWARDAIR_SEED_RAISE_TARGET_USD;
  const cashTrend = getOnwardAirMonthlyCashSeries().map((p) => p.amount);
  const monthlyBurn = 80_000;
  const runwayMonths = Math.round(cash / monthlyBurn);
  const latestHeld = OA_HELD_BOARD_MEETINGS[OA_HELD_BOARD_MEETINGS.length - 1]!;
  const openActions = snap.openActions;

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

  const completed = latestHeld.actions
    .filter((a) => a.status === "Completed")
    .map(mapAction);
  const overdue = openActions.filter((a) => a.status === "Overdue").map(mapAction);
  const outstanding = openActions
    .filter((a) => a.status !== "Overdue" && a.status !== "Completed")
    .map(mapAction);

  const engSpend = 520_000;
  const flightSpend = 180_000;
  const gaSpend = 240_000;
  const totalSpend = engSpend + flightSpend + gaSpend;

  return {
    meetingDate,
    packName,
    status: "Final",
    orgStatus: "Amber",
    attendees: ONWARDAIR_LUMINARY_ADVISORS.slice(0, 7).map((m) => ({
      name: m.fullName,
      role: m.roleTitle,
    })),
    highlightCards: [
      {
        title: "Cash on hand",
        primary: formatOaBoardUsd(cash, true),
        secondary: `~${runwayMonths} mo runway`,
      },
      {
        title: "Capital raised",
        primary: formatOaBoardUsd(raised, true),
        secondary: "Pre-Seed closed",
      },
      {
        title: "Seed target",
        primary: formatOaBoardUsd(seedTarget, true),
        secondary: "Active through Q4 2026",
      },
      {
        title: "Lead programme",
        primary: "Vertex VTOL™",
        secondary: "FLEX Pod™ interface",
      },
      {
        title: "Next board",
        primary: snap.nextMeeting.meetingDate,
        secondary: "Houston / hybrid",
      },
    ],
    concernCards: OA_BOARD_DASHBOARD_RISKS.filter((r) => r.impact === "H").map((r) => ({
      title: r.id,
      detail: r.description,
    })),
    highlights: [
      `Cash ${formatOaBoardUsd(cash, true)} with ~${runwayMonths} months runway at current burn.`,
      `Pre-Seed ${formatOaBoardUsd(raised, true)} closed; Seed targeting ${formatOaBoardUsd(seedTarget, true)}.`,
      "Vertex VTOL™ / FLEX Pod™ remain the primary engineering and certification focus.",
      "Houston HQ Flight Test training and QMS paths are live for campaign staff.",
    ],
    concerns: OA_BOARD_DASHBOARD_RISKS.slice(0, 5).map((r) => r.description),
    discussionTopics: snap.strategicTopics,
    boardDecisions: latestHeld.decisions.map((d) => d.resolution || d.text),
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
                status: "Completed",
              },
            ],
      outstanding,
      overdue,
    },
    risks: OA_BOARD_DASHBOARD_RISKS.map((r, i) => ({
      id: r.id,
      risk: r.description,
      owner: r.owner,
      impact: r.impact,
      likelihood: (r.impact === "H" ? "M" : "L") as "H" | "M" | "L",
      rating: r.impact === "H" ? 15 : r.impact === "M" ? 9 : 4,
      trend: (i === 0 ? "↑" : i === 1 ? "→" : "↓") as "↑" | "→" | "↓",
      mitigation: `${r.status} — owned by ${r.owner}.`,
      status: r.status,
      dateRaised: "2026-05-01",
      reviewDate: meetingDate,
      flags: {
        increased: r.impact === "H" && i === 0,
        new: i === OA_BOARD_DASHBOARD_RISKS.length - 1,
        overdueMitigation: r.status === "Open" && r.impact === "H",
      },
    })),
    kpis: [
      {
        name: "Cash runway (months)",
        actual: runwayMonths,
        budget: 18,
        variance: runwayMonths - 18,
        unit: "count",
        indicator: runwayMonths >= 12 ? "On track" : "Watch",
        trend: -1,
        sparkline: cashTrend.slice(-6).map((v) => Math.round(v / monthlyBurn)),
      },
      {
        name: "Seed progress vs target",
        actual: Math.round((raised / seedTarget) * 100),
        budget: 100,
        variance: Math.round((raised / seedTarget) * 100) - 100,
        unit: "percent",
        indicator: "Watch",
        trend: 1,
        sparkline: [10, 15, 22, 28, 32, 34],
      },
      {
        name: "Prototype gates closed",
        actual: 3,
        budget: 4,
        variance: -1,
        unit: "count",
        indicator: "Watch",
        trend: 0,
        sparkline: [1, 1, 2, 2, 3, 3],
      },
      {
        name: "Open board actions",
        actual: openActions.length,
        budget: 3,
        variance: openActions.length - 3,
        unit: "count",
        indicator: openActions.length <= 4 ? "On track" : "Watch",
        trend: 0,
        sparkline: [6, 5, 4, 4, openActions.length, openActions.length],
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
        label: "YTD operating spend",
        actual: -totalSpend,
        budget: -860_000,
        variance: -(totalSpend - 860_000),
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
        surplus: -totalSpend - monthlyBurn * 4,
        cash: Math.max(0, cash - monthlyBurn * 4),
      },
    },
    financialInsights: {
      revenue: {
        title: "Capital position",
        position: `${formatOaBoardUsd(raised, true)} Pre-Seed closed`,
        variance: `${formatOaBoardUsd(seedTarget - raised, true)} Seed gap`,
        commentary:
          "OnwardAir is pre-revenue. Board financial oversight focuses on runway and Seed close quality.",
      },
      operatingResult: {
        title: "Operating spend",
        position: `${formatOaBoardUsd(totalSpend, true)} YTD prototype & HQ`,
        variance: "Engineering-led burn",
        commentary: "Spend concentrated in engineering, flight test, and Houston operations.",
      },
      cash: {
        title: "Cash & runway",
        current: formatOaBoardUsd(cash, true),
        movement: "Soft glide as prototype spend continues",
        assessment: `~${runwayMonths} months at ~${formatOaBoardUsd(monthlyBurn, true)}/mo.`,
      },
      forecast: {
        title: "Seed outlook",
        outlook: `${formatOaBoardUsd(seedTarget, true)} target through Q4`,
        confidence: "Medium — pipeline dependent",
        assumptions: "Vertex milestones and defence-logistics pilots support diligence.",
      },
    },
    pnl: {
      rows: [
        {
          line: "Engineering & prototype",
          actual: engSpend,
          budget: 480_000,
          variance: engSpend - 480_000,
          priorYear: 210_000,
        },
        {
          line: "Flight test & ops",
          actual: flightSpend,
          budget: 160_000,
          variance: flightSpend - 160_000,
          priorYear: 40_000,
        },
        {
          line: "G&A / Houston HQ",
          actual: gaSpend,
          budget: 220_000,
          variance: gaSpend - 220_000,
          priorYear: 90_000,
        },
        {
          line: "Total operating spend",
          actual: totalSpend,
          budget: 860_000,
          variance: totalSpend - 860_000,
          priorYear: 340_000,
          emphasis: true,
        },
      ],
      commentary: [
        "Pre-revenue P&L — board monitors spend vs runway, not margin.",
        "Engineering remains the primary cost centre ahead of first flight demo.",
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
      cashMovementMom: cash - (cashTrend[cashTrend.length - 2] ?? cash),
      cashDrivers: "Prototype spend and Houston ops outweigh residual Pre-Seed cash.",
      liquidityAssessment: `Runway ~${runwayMonths} months; Seed close is the primary liquidity lever.`,
      positiveCashDrivers: [{ label: "Pre-Seed residual", amount: raised }],
      negativeCashDrivers: [
        { label: "Engineering", amount: -engSpend },
        { label: "Flight test & HQ", amount: -(flightSpend + gaSpend) },
      ],
    },
    commercial: {
      membership: { new: 0, lost: 0, net: 0, total: 0 },
      sponsorship: { budget: seedTarget, actual: raised, forecast: seedTarget },
      events: { revenue: 0, registrations: 0, forecast: 0 },
    },
    commercialInsights: {
      membership: {
        title: "Programme",
        lines: [
          { label: "Lead product", value: "Vertex VTOL™ + FLEX Pod™" },
          { label: "HQ", value: "Houston" },
          { label: "Stage", value: "Prototype / certification pathway" },
        ],
      },
      sponsorship: {
        title: "Fundraising",
        lines: [
          { label: "Closed", value: `Pre-Seed ${formatOaBoardUsd(raised, true)}` },
          { label: "Active", value: `Seed ${formatOaBoardUsd(seedTarget, true)}` },
          { label: "ESOP", value: "15% FD reserved" },
        ],
      },
      events: {
        title: "Pipeline",
        lines: [
          { label: "Defence logistics", value: "Pilot outreach — McNabb advisory" },
          { label: "Civilian cert", value: "FAA counsel pathway" },
          { label: "Board portal", value: "Live for advisors at /board" },
        ],
      },
    },
    team: {
      headcount: 28,
      openRoles: 4,
      joiners: [
        { name: "Flight Test tech cohort", role: "Campaign support", startDate: "2026-06-01" },
      ],
      leavers: [],
      notes:
        "Mandatory training: Houston Induction, Hangar H&S, Flight Test Ground Rules, HV Battery Handling.",
    },
    strategicTopics: snap.strategicTopics.map((issue, i) => ({
      issue,
      evidence:
        i === 0
          ? `Cash ${formatOaBoardUsd(cash, true)}; Seed target ${formatOaBoardUsd(seedTarget, true)}.`
          : "See Engineering gates and risk register.",
      recommendation:
        i === 0
          ? "Keep Seed narrative and pipeline cadence through Q4."
          : "Confirm gate evidence owners before next taxi/hover campaign.",
      whyItMatters: "Protects certification timeline and capital runway.",
      decisionRequired: i === 0 ? "Confirm Seed target messaging." : "Note for board — no resolution required.",
      impact: "Programme schedule and investor confidence.",
      priority: (i < 2 ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM" | "LOW",
    })),
    aob: "Confirm September pack lock; review defence-logistics pilot owners; note Board Portal live for advisors.",
    pageSummaries: [...OA_AGENDA],
    folderPath: `Corporate Information/Board Deck/${packName}`,
  };
}
