/**
 * Northstar Demo — board pack data (AbhiBoardPackData shape for PDF builder).
 */

import type {
  AbhiBoardPackData,
  AbhiBoardRisk,
  AbhiBoardAction,
} from "@/lib/abhi/board-pack-model";
import { buildNorthstarFinancialOverview } from "@/lib/demo/module-fixtures";
import { NORTHSTAR_BOARD_DIRECTORS } from "@/lib/demo/board-data";

const NS_AGENDA = [
  "Executive Summary",
  "Previous Actions",
  "Risk Register",
  "KPI Dashboard",
  "Financial Overview",
  "Operating Performance",
  "Cash & Balance Sheet",
  "Commercial Pipeline",
  "Team & Organisation",
  "Strategic Discussion & AOB",
] as const;

function formatGbp(value: number, compact = false): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (compact) {
    if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(1)}m`;
    if (abs >= 1_000) return `${sign}£${Math.round(abs / 1_000)}k`;
  }
  return `${sign}£${abs.toLocaleString("en-GB")}`;
}

import { NORTHSTAR_BOARD_MEETINGS } from "@/lib/demo/board-data";

function resolveMeetingDate(meetingDateIso?: string): string {
  if (meetingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateIso)) return meetingDateIso;
  const scheduled = NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled");
  if (scheduled) return scheduled.date;
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildPackName(meetingDate: string): string {
  const d = new Date(`${meetingDate}T12:00:00`);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Northstar Board Pack — Q${q} ${d.getFullYear()}`;
}

function mapRisk(
  id: string,
  risk: string,
  owner: string,
  impact: "H" | "M" | "L",
  likelihood: "H" | "M" | "L",
  mitigation: string,
): AbhiBoardRisk {
  const score = { H: 5, M: 3, L: 1 };
  return {
    id,
    risk,
    owner,
    impact,
    likelihood,
    rating: score[impact] * score[likelihood],
    trend: "→",
    mitigation,
    status: "Active",
    flags: {},
  };
}

export function northstarBoardDeckPdfFileName(meetingDate: string): string {
  return `northstar-board-deck-${meetingDate}.pdf`;
}

export function northstarBoardDeckPdfUrl(meetingDate: string, disposition: "inline" | "attachment" = "inline") {
  void disposition;
  return northstarBoardDeckSampleUrl(meetingDate);
}

export function northstarBoardDeckSampleUrl(meetingDate: string): string {
  return `/samples/${northstarBoardDeckPdfFileName(meetingDate)}`;
}

/** Build Northstar board pack fixture for PDF generation. */
export function buildNorthstarBoardPackData(meetingDateIso?: string): AbhiBoardPackData {
  const meetingDate = resolveMeetingDate(meetingDateIso);
  const packName = buildPackName(meetingDate);
  const fin = buildNorthstarFinancialOverview();
  const cash = fin.cashPosition;
  const revenueYtd = fin.revenueYtd;
  const monthlyBurn = fin.burnRate.monthly;
  const runwayMonths = fin.burnRate.runwayMonths ?? 12;
  const cashTrend = fin.charts.cashPosition.map((p) => p.amount);
  const revenueSparkline = fin.charts.monthlyRevenue.map((p) => p.amount);
  const cashMom =
    cashTrend.length >= 2 ? cashTrend[cashTrend.length - 1]! - cashTrend[cashTrend.length - 2]! : 0;

  const risks: AbhiBoardRisk[] = [
    mapRisk(
      "R-01",
      "Supplier concentration — Voltex Automation",
      "James Okonkwo",
      "H",
      "M",
      "Qualify Siemens Industrial as secondary source",
    ),
    mapRisk(
      "R-02",
      "Atlas programme delay / reputational impact",
      "Marcus Reed",
      "H",
      "M",
      "Weekly steering with Sheffield Precision",
    ),
    mapRisk(
      "R-03",
      "US expansion burn vs margin",
      "Priya Shah",
      "M",
      "H",
      "Monthly US P&L review; hiring gated on pipeline",
    ),
    mapRisk("R-07", "Cash collection — AR >60 days", "Priya Shah", "M", "M", "Collections sprint"),
  ];

  const completed: AbhiBoardAction[] = [
    {
      id: "NS-A-Q1-02",
      title: "Publish margin recovery dashboard for board portal",
      owner: "Priya Shah",
      due: "2026-04-30",
      status: "Completed",
    },
  ];

  const outstanding: AbhiBoardAction[] = [
    {
      id: "NS-A-Q2-01",
      title: "Execute Siemens Industrial backup supplier MOU",
      owner: "James Okonkwo",
      due: "2026-07-31",
      status: "Underway",
    },
    {
      id: "NS-A-Q3-01",
      title: "Circulate Q3 board pack draft two weeks prior",
      owner: "Priya Shah",
      due: "2026-09-04",
      status: "Underway",
    },
  ];

  const strategicTopics = [
    {
      issue: "Margin recovery to 58% gross margin",
      evidence: `YTD revenue ${formatGbp(revenueYtd, true)}; gross margin compressed on Atlas delivery.`,
      recommendation: "Maintain opex freeze on non-critical hires through Q3.",
      whyItMatters: "Protects runway and Series A narrative.",
      decisionRequired: "Confirm margin recovery dashboard as standing board item.",
      impact: "Profitability & valuation",
      priority: "HIGH" as const,
    },
    {
      issue: "Atlas go-live with Sheffield Precision",
      evidence: "Phased delivery approved Q1; UAT sign-off in progress.",
      recommendation: "Weekly executive QBR until stabilised.",
      whyItMatters: "Largest ARR customer concentration (~22%).",
      decisionRequired: "Note Atlas gate readiness for September board.",
      impact: "Delivery & reputation",
      priority: "HIGH" as const,
    },
    {
      issue: "US Austin expansion (2 FTE)",
      evidence: "Board approved Q2 within burn guardrails.",
      recommendation: "Monthly US pipeline vs burn review.",
      whyItMatters: "Balances growth vs cash runway.",
      decisionRequired: "Review US pipeline forecast in Q3 pack.",
      impact: "Growth",
      priority: "MEDIUM" as const,
    },
  ];

  return {
    meetingDate,
    packName,
    status: meetingDate >= "2026-09-01" ? "Draft" : "Final",
    orgStatus: runwayMonths < 12 ? "Amber" : "Green",
    coverBrand: {
      orgLine: "Northstar Industrial Technologies",
      deckTitle: "Board Pack",
    },
    attendees: NORTHSTAR_BOARD_DIRECTORS.map((d) => ({
      name: d.name,
      role: d.role,
    })),
    highlightCards: [
      {
        title: "Cash on hand",
        primary: formatGbp(cash, true),
        secondary: `~${runwayMonths} mo runway · ${formatGbp(monthlyBurn, true)}/mo`,
      },
      {
        title: "Revenue YTD",
        primary: formatGbp(revenueYtd, true),
        secondary: "Target £5.2m annual",
      },
      {
        title: "Atlas programme",
        primary: "Phased go-live",
        secondary: "Sheffield Precision Engineering",
      },
      {
        title: "Next board",
        primary: meetingDate >= "2026-09-01" ? "2026-09-18" : "2026-09-18",
        secondary: "Manchester HQ",
      },
    ],
    concernCards: risks
      .filter((r) => r.impact === "H")
      .slice(0, 3)
      .map((r) => ({
        title: r.id,
        detail: r.risk.length > 52 ? `${r.risk.slice(0, 49)}…` : r.risk,
      })),
    highlights: [
      `Cash ${formatGbp(cash, true)} (~${runwayMonths} months runway).`,
      `Revenue YTD ${formatGbp(revenueYtd, true)} — margin recovery programme on track.`,
      "Atlas phased go-live approved; Sheffield monthly QBR in place.",
      "Siemens Industrial backup supplier MOU approved Q2.",
    ],
    concerns: risks.map((r) => r.risk),
    discussionTopics: strategicTopics.map((t) => t.issue),
    boardDecisions: strategicTopics.map((t) => t.decisionRequired),
    agenda: [...NS_AGENDA],
    previousActions: {
      completed: completed.map((a) => ({
        id: a.id,
        title: a.title,
        owner: a.owner,
        due: a.due,
        status: a.status as "Completed",
      })),
      outstanding: outstanding.map((a) => ({
        id: a.id,
        title: a.title,
        owner: a.owner,
        due: a.due,
        status: a.status as "Underway",
      })),
      overdue: [],
    },
    risks,
    kpis: [
      {
        name: "Cash runway (months)",
        actual: runwayMonths,
        budget: 14,
        variance: runwayMonths - 14,
        unit: "count",
        indicator: runwayMonths >= 12 ? "On track" : "Watch",
        trend: cashMom < 0 ? -1 : 1,
        sparkline: cashTrend.slice(-6).map((v) => Math.round(v / monthlyBurn)),
      },
      {
        name: "Revenue YTD",
        actual: revenueYtd,
        budget: 2_600_000,
        variance: revenueYtd - 2_600_000,
        unit: "currency",
        indicator: "On track",
        trend: 1,
        sparkline: revenueSparkline.slice(-6),
      },
      {
        name: "Gross margin %",
        actual: 52,
        budget: 58,
        variance: -6,
        unit: "percent",
        indicator: "Watch",
        trend: 1,
        sparkline: [48, 49, 50, 51, 51, 52],
      },
    ],
    financialOverview: {
      revenueVsBudget: { label: "Revenue YTD", actual: revenueYtd, budget: 2_600_000, variance: revenueYtd - 2_600_000 },
      operatingSurplus: {
        label: "Net profit YTD",
        actual: fin.netProfit,
        budget: 400_000,
        variance: fin.netProfit - 400_000,
      },
      cashPosition: { label: "Cash", actual: cash, budget: 900_000, variance: cash - 900_000 },
      forecastYearEnd: {
        label: "Year-end outlook",
        revenue: 5_200_000,
        surplus: 650_000,
        cash: Math.max(0, cash - monthlyBurn * 2),
      },
    },
    financialInsights: {
      revenue: {
        title: "Revenue",
        position: formatGbp(revenueYtd, true),
        variance: formatGbp(revenueYtd - 2_600_000, true),
        commentary: "Ahead of plan; margin recovery remains board focus.",
      },
      operatingResult: {
        title: "Operating result",
        position: formatGbp(fin.netProfit, true),
        variance: formatGbp(fin.netProfit - 400_000, true),
        commentary: "Opex discipline and Atlas delivery costs monitored monthly.",
      },
      cash: {
        title: "Cash & runway",
        current: formatGbp(cash, true),
        movement:
          cashMom >= 0
            ? `+${formatGbp(cashMom, true)} vs prior month`
            : `${formatGbp(cashMom, true)} vs prior month`,
        assessment: `~${runwayMonths} months at ${formatGbp(monthlyBurn, true)}/mo.`,
      },
      forecast: {
        title: "2026 outlook",
        outlook: `${formatGbp(5_200_000, true)} revenue target`,
        confidence: "Medium — Atlas & US expansion dependent",
        assumptions: "Margin recovery to 58% by Q4.",
      },
    },
    pnl: {
      rows: [
        { line: "Product revenue", actual: Math.round(revenueYtd * 0.82), budget: 2_100_000, variance: 0, priorYear: 1_800_000 },
        { line: "Services revenue", actual: Math.round(revenueYtd * 0.18), budget: 500_000, variance: 0, priorYear: 420_000 },
        {
          line: "Total revenue",
          actual: revenueYtd,
          budget: 2_600_000,
          variance: revenueYtd - 2_600_000,
          priorYear: 2_220_000,
          emphasis: true,
        },
        {
          line: "Total operating costs",
          actual: fin.monthlyExpenses * 6,
          budget: 1_770_000,
          variance: 0,
          priorYear: 1_650_000,
          emphasis: true,
        },
      ],
      commentary: [
        "Margin recovery programme — target 58% gross margin by Q4.",
        "Atlas and US expansion are primary spend drivers.",
      ],
    },
    balanceSheet: {
      assets: cash + 1_200_000,
      liabilities: 680_000,
      netAssets: cash + 520_000,
      cashTrend,
      cashForecast: Math.max(0, cash - monthlyBurn * 3),
      debtors: fin.accountsReceivable,
      creditors: fin.accountsPayable,
      cashMovementMom: cashMom,
      cashDrivers: `AR ${formatGbp(fin.accountsReceivable, true)} · AP ${formatGbp(fin.accountsPayable, true)}.`,
      liquidityAssessment: `Runway ~${runwayMonths} months; collections sprint on AR >60 days.`,
      positiveCashDrivers: [{ label: "Operating inflows", amount: revenueYtd }],
      negativeCashDrivers: [
        { label: "Payroll & opex", amount: -fin.monthlyExpenses * 6 },
        { label: "Atlas delivery costs", amount: -180_000 },
      ],
    },
    commercial: {
      membership: { new: 4, lost: 1, net: 3, total: 28 },
      sponsorship: { budget: 0, actual: 0, forecast: 0 },
      events: { revenue: 120_000, registrations: 8, forecast: 200_000 },
    },
    commercialInsights: {
      membership: {
        title: "Enterprise clients",
        lines: [
          { label: "Active", value: "28" },
          { label: "Sheffield ARR share", value: "~22%" },
          { label: "Pipeline", value: "US + EU" },
        ],
      },
      sponsorship: {
        title: "Growth round",
        lines: [
          { label: "Growth round", value: "£2m approved" },
          { label: "Series A", value: "Deferred Q4" },
        ],
      },
      events: {
        title: "Pipeline",
        lines: [
          { label: "US Austin", value: "2 FTE approved" },
          { label: "EU expansion", value: "Planning" },
        ],
      },
    },
    team: {
      headcount: 142,
      openRoles: 6,
      joiners: [
        { name: "US Sales Lead", role: "Austin · hiring", startDate: "2026-08-01" },
      ],
      leavers: [],
      notes: "Bristol R&D · Manchester HQ · Austin sales pod forming.",
    },
    strategicTopics,
    aob: "Confirm September pack lock; review Atlas GA readiness; AR collections update.",
    pageSummaries: [...NS_AGENDA],
    folderPath: `Board/Northstar/${packName}`,
  };
}
