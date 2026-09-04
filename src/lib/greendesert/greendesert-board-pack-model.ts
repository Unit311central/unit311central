/**
 * Green Desert board pack data — Northstar-style 11-slide deck (AbhiBoardPackData shape).
 */

import type {
  AbhiBoardAction,
  AbhiBoardPackData,
  AbhiBoardRisk,
} from "@/lib/abhi/board-pack-model";
import { GREENDESERT_FUNDRAISING_ROUND_SUMMARY } from "@/lib/greendesert/greendesert-fundraising-data";
import { GREENDESERT_ENGINEERING_RISKS } from "@/lib/greendesert/greendesert-engineering-data";
import { GREENDESERT_HR_TEAM_EMPLOYEES } from "@/lib/greendesert/greendesert-hr-team-data";
import { GREENDESERT_DISPLAY_NAME } from "@/lib/greendesert-surface";

export const GREENDESERT_COMPANY_LEGAL_NAME = "Green Desert Technologies";
export const GREENDESERT_COMPANY_SHORT_NAME = GREENDESERT_DISPLAY_NAME;

export const GREENDESERT_BOARD_DEFAULT_MEETING_DATE = "2026-09-05";

export const GREENDESERT_BOARD_AGENDA = [
  "Executive Summary",
  "Previous Actions",
  "Risk Register",
  "KPI Dashboard",
  "Financial Overview",
  "Operating Performance",
  "Cash & Balance Sheet",
  "Fundraising & Pipeline",
  "Team & Organisation",
  "Strategic Discussion & AOB",
] as const;

function formatUsd(value: number, compact = false): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (compact) {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}m`;
    if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

function resolveMeetingDate(meetingDateIso?: string): string {
  if (meetingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateIso)) return meetingDateIso;
  return GREENDESERT_BOARD_DEFAULT_MEETING_DATE;
}

function buildPackName(meetingDate: string): string {
  const d = new Date(`${meetingDate}T12:00:00`);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${GREENDESERT_COMPANY_SHORT_NAME} Board Pack — Q${q} ${d.getFullYear()}`;
}

function mapEngineeringRisk(
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

function severityToImpact(severity: string): "H" | "M" | "L" {
  if (severity === "critical" || severity === "high") return "H";
  if (severity === "medium") return "M";
  return "L";
}

function likelihoodToLevel(likelihood: string): "H" | "M" | "L" {
  if (likelihood === "high") return "H";
  if (likelihood === "medium") return "M";
  return "L";
}

export function greendesertBoardDeckPdfFileName(meetingDate: string): string {
  return `greendesert-board-deck-${meetingDate}.pdf`;
}

export function greendesertBoardDeckSampleFileNames(meetingDate: string): string[] {
  return [
    greendesertBoardDeckPdfFileName(meetingDate),
    `greendesert-board-deck-${GREENDESERT_BOARD_DEFAULT_MEETING_DATE}.pdf`,
  ];
}

export function greendesertBoardDeckPdfUrl(
  meetingDate: string,
  disposition: "inline" | "attachment" = "inline",
) {
  return `/api/greendesert/board-deck?meetingDate=${encodeURIComponent(meetingDate)}&disposition=${disposition}`;
}

export function greendesertBoardDeckSampleUrl(meetingDate: string): string {
  return `/samples/${greendesertBoardDeckPdfFileName(meetingDate)}`;
}

/** Build Green Desert board pack fixture for PDF generation. */
export function buildGreenDesertBoardPackData(meetingDateIso?: string): AbhiBoardPackData {
  const meetingDate = resolveMeetingDate(meetingDateIso);
  const packName = buildPackName(meetingDate);
  const round = GREENDESERT_FUNDRAISING_ROUND_SUMMARY;

  const risks: AbhiBoardRisk[] = GREENDESERT_ENGINEERING_RISKS.map((row, index) =>
    mapEngineeringRisk(
      `GD-R-${index + 1}`,
      row.title,
      row.owner,
      severityToImpact(row.severity),
      likelihoodToLevel(row.likelihood),
      row.mitigation,
    ),
  );

  const strategicTopics = [
    {
      issue: "Jeddah pilot scale-up",
      evidence: "Photobioreactor commissioning and client telemetry handover in progress.",
      recommendation: "Maintain weekly executive steering until stabilised.",
      whyItMatters: "Foundation for Series A and Jeddah Technologies client narrative.",
      decisionRequired: "Confirm pilot go-live gate for next board cycle.",
      impact: "Operations & delivery",
      priority: "HIGH" as const,
    },
    {
      issue: "Series A close",
      evidence: `${formatUsd(round.committedAmount, true)} committed of ${formatUsd(round.targetAmount, true)} target.`,
      recommendation: "Prioritise lead investor diligence and data room completeness.",
      whyItMatters: "Funds Jeddah scale-up and powder production line.",
      decisionRequired: "Approve final term sheet parameters.",
      impact: "Capital & runway",
      priority: "HIGH" as const,
    },
    {
      issue: "Water efficiency & regulatory readiness",
      evidence: "Closed-loop instrumentation programme on track; export sampling pending.",
      recommendation: "Accelerate SFDA documentation with third-party lab validation.",
      whyItMatters: "Critical for Saudi water-scarce positioning and export path.",
      decisionRequired: "Note regulatory sampling timeline.",
      impact: "Compliance",
      priority: "MEDIUM" as const,
    },
    {
      issue: "Jeddah Technologies client expansion",
      evidence: "Client portal live; documents and support workflows to be expanded.",
      recommendation: "Define phase-2 scope with client steering group.",
      whyItMatters: "Reference customer for GCC commercial pipeline.",
      decisionRequired: "Endorse client success resourcing for Q4.",
      impact: "Commercial",
      priority: "MEDIUM" as const,
    },
  ];

  const emptyActions: AbhiBoardAction[] = [];

  return {
    meetingDate,
    packName,
    status: "Draft",
    orgStatus: "Amber",
    coverBrand: {
      orgLine: GREENDESERT_COMPANY_LEGAL_NAME,
      deckTitle: "Board Pack",
    },
    attendees: [
      ...GREENDESERT_HR_TEAM_EMPLOYEES.map((member) => ({
        name: member.fullName,
        role: member.role,
      })),
      { name: "Independent director", role: "TBD" },
    ],
    highlightCards: [
      {
        title: "Jeddah pilot",
        primary: "In progress",
        secondary: "Photobioreactor commissioning",
      },
      {
        title: "Series A",
        primary: formatUsd(round.committedAmount, true),
        secondary: `${formatUsd(round.targetAmount, true)} target`,
      },
      {
        title: "Production status",
        primary: "Not yet reported",
        secondary: "Powder line commissioning",
      },
      {
        title: "Next board",
        primary: meetingDate,
        secondary: "Jeddah HQ",
      },
    ],
    concernCards: risks
      .filter((row) => row.impact === "H")
      .slice(0, 3)
      .map((row) => ({
        title: row.id,
        detail: row.risk.length > 52 ? `${row.risk.slice(0, 49)}…` : row.risk,
      })),
    highlights: [
      "Jeddah pilot cultivation platform progressing — IoT and telemetry integration underway.",
      `${formatUsd(round.committedAmount, true)} committed toward ${round.activeRound} (${formatUsd(round.targetAmount, true)} target).`,
      "Executive team in place — Jeddah HQ with USD reporting.",
      "Water-efficiency programme aligned to Saudi food security positioning.",
    ],
    concerns: risks.map((row) => row.risk),
    discussionTopics: strategicTopics.map((topic) => topic.issue),
    boardDecisions: strategicTopics.map((topic) => topic.decisionRequired),
    agenda: [...GREENDESERT_BOARD_AGENDA],
    previousActions: {
      completed: emptyActions,
      outstanding: emptyActions,
      overdue: emptyActions,
    },
    risks,
    kpis: [
      {
        name: "Pilot yield index",
        actual: "—",
        budget: "—",
        variance: "—",
        unit: "count",
        indicator: "Watch",
        trend: 0,
        sparkline: [0, 0, 0, 0, 0, 0],
      },
      {
        name: "Water use vs target",
        actual: "—",
        budget: "—",
        variance: "—",
        unit: "percent",
        indicator: "Watch",
        trend: 0,
        sparkline: [0, 0, 0, 0, 0, 0],
      },
      {
        name: "Harvest capacity",
        actual: "—",
        budget: "—",
        variance: "—",
        unit: "count",
        indicator: "Watch",
        trend: 0,
        sparkline: [0, 0, 0, 0, 0, 0],
      },
      {
        name: "Cash runway (months)",
        actual: "—",
        budget: "—",
        variance: "—",
        unit: "count",
        indicator: "Watch",
        trend: 0,
        sparkline: [0, 0, 0, 0, 0, 0],
      },
    ],
    financialOverview: {
      revenueVsBudget: { label: "Revenue YTD", actual: 0, budget: 0, variance: 0 },
      operatingSurplus: { label: "Operating result YTD", actual: 0, budget: 0, variance: 0 },
      cashPosition: { label: "Cash", actual: 0, budget: 0, variance: 0 },
      forecastYearEnd: {
        label: "Year-end outlook",
        revenue: 0,
        surplus: 0,
        cash: 0,
      },
    },
    financialInsights: {
      revenue: {
        title: "Revenue",
        position: "Not yet reported",
        variance: "—",
        commentary: "Pre-revenue pilot phase — financial ledger to be connected.",
      },
      operatingResult: {
        title: "Operating result",
        position: "Not yet reported",
        variance: "—",
        commentary: "Pilot opex tracked in engineering programmes.",
      },
      cash: {
        title: "Cash & runway",
        current: "Not yet reported",
        movement: "—",
        assessment: "Series A proceeds will define runway post-close.",
      },
      forecast: {
        title: "2026 outlook",
        outlook: "Pending finance integration",
        confidence: "Low — data not connected",
        assumptions: "Assumes Series A close in Q4 2026.",
      },
    },
    pnl: {
      rows: [
        { line: "Pilot revenue", actual: 0, budget: 0, variance: 0, priorYear: 0 },
        { line: "Operating costs", actual: 0, budget: 0, variance: 0, priorYear: 0 },
        {
          line: "Net result",
          actual: 0,
          budget: 0,
          variance: 0,
          priorYear: 0,
          emphasis: true,
        },
      ],
      commentary: [
        "Operating performance data will populate from finance and engineering modules.",
        "Pilot phase — revenue recognition pending commercial contracts.",
      ],
    },
    balanceSheet: {
      assets: 0,
      liabilities: 0,
      netAssets: 0,
      cashTrend: [0, 0, 0, 0, 0, 0],
      cashForecast: 0,
      debtors: 0,
      creditors: 0,
      cashMovementMom: 0,
      cashDrivers: "Financial data not yet connected.",
      liquidityAssessment: "Pending Series A close and finance integration.",
      positiveCashDrivers: [],
      negativeCashDrivers: [],
    },
    commercial: {
      membership: { new: 0, lost: 0, net: 0, total: 0 },
      sponsorship: {
        budget: round.targetAmount,
        actual: round.committedAmount,
        forecast: round.targetAmount,
      },
      events: { revenue: 1_200_000, registrations: 1, forecast: 1_200_000 },
    },
    commercialInsights: {
      membership: {
        title: "Series A pipeline",
        lines: [
          { label: "Active round", value: round.activeRound },
          { label: "Target", value: formatUsd(round.targetAmount, true) },
          { label: "Committed", value: formatUsd(round.committedAmount, true) },
        ],
      },
      sponsorship: {
        title: "Lead investors",
        lines: [
          { label: "Vision 2030 Agritech Fund", value: "Term sheet" },
          { label: "GCC Climate Ventures", value: "Due diligence" },
          { label: "RedSea Strategic Partners", value: "Prospect" },
        ],
      },
      events: {
        title: "Strategic grants",
        lines: [
          { label: "KSA agriculture grant", value: formatUsd(1_200_000, true) },
          { label: "Status", value: "Qualified" },
          { label: "Expected close", value: "Nov 2026" },
        ],
      },
    },
    team: {
      headcount: GREENDESERT_HR_TEAM_EMPLOYEES.length,
      openRoles: 0,
      joiners: GREENDESERT_HR_TEAM_EMPLOYEES.map((member) => ({
        name: member.fullName,
        role: `${member.role} · ${member.location}`,
        startDate: member.dateJoined,
      })),
      leavers: [],
      notes: "Executive team — Jeddah HQ. Broader hiring plan pending Series A close.",
    },
    strategicTopics,
    aob: "Confirm board pack lock; review Jeddah pilot gate; Series A diligence update.",
    pageSummaries: [...GREENDESERT_BOARD_AGENDA],
    folderPath: `Board/GreenDesert/${packName}`,
  };
}
