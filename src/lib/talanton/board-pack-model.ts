/**
 * Talanton Impact Board Pack — funds, portfolio, impact, and governance data.
 * Reuses AbhiBoardPackData shape for shared PDF/PPTX builders.
 */

import type {
  AbhiBoardAction,
  AbhiBoardPackData,
  AbhiBoardRisk,
  AbhiOrgStatus,
} from "@/lib/abhi/board-pack-model";
import { TI_BOARD_MEMBERS, TI_BOARD_MEETINGS } from "@/lib/talanton/board-portal-data";
import {
  buildPortfolioExecutiveBriefing,
} from "@/lib/talanton/portfolio-intelligence";
import { buildPortfolioImpactBriefing } from "@/lib/talanton/impact-intelligence";
import {
  FUNDS_PLATFORM_OVERVIEW,
  formatFundUsd,
  listTalantonFunds,
} from "@/lib/talanton/funds-data";
import {
  getNextTalantonBoardMeeting,
  listTalantonBoardActions,
  listTalantonLiveRisks,
} from "@/lib/talanton/executive-intelligence";
import { TALANTON_CASH_BALANCE_USD } from "@/lib/talanton-financials";
import { TALANTON_HR_TEAM_EMPLOYEES } from "@/lib/talanton/hr-team-data";

export function isTalantonBoardPackData(data: AbhiBoardPackData): boolean {
  return /talanton\s+impact/i.test(data.packName);
}

export function formatTalantonBoardUsd(value: number, compact = false): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (compact) {
    if (abs >= 1_000_000) {
      const m = abs / 1_000_000;
      return `${sign}$${m >= 10 ? Math.round(m) : m.toFixed(1)}M`;
    }
    if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const TI_AGENDA = [
  "Executive Summary",
  "Previous Actions",
  "Risk Register",
  "Portfolio & Fund KPIs",
  "Financial Overview",
  "Funds & Capital Deployment",
  "Impact Stewardship",
  "Team & Organisation",
  "Strategic Discussion & AOB",
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function resolveMeetingDate(meetingDateIso?: string): string {
  if (meetingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateIso)) return meetingDateIso;
  return getNextTalantonBoardMeeting()?.meetingDate ?? TI_BOARD_MEETINGS[0]?.meetingDate ?? toIso(new Date());
}

function mapActions(): { completed: AbhiBoardAction[]; outstanding: AbhiBoardAction[]; overdue: AbhiBoardAction[] } {
  const all = listTalantonBoardActions();
  const completed = TI_BOARD_MEETINGS.flatMap((m) =>
    m.actions
      .filter((a) => a.status === "Completed")
      .map((a) => ({
        id: a.id,
        title: a.title,
        owner: a.owner,
        due: a.dueDate,
        status: "Completed" as const,
      })),
  );
  return {
    completed,
    overdue: all.filter((a) => a.status === "Overdue"),
    outstanding: all.filter((a) => a.status !== "Overdue" && a.status !== "Completed"),
  };
}

function mapRisks(): AbhiBoardRisk[] {
  return listTalantonLiveRisks().map((r) => ({
    id: r.id,
    risk: r.description,
    owner: r.owner,
    impact: r.impact,
    likelihood: r.likelihood,
    rating: r.rating,
    trend: "→" as const,
    mitigation: r.mitigation,
    status: r.status,
    dateRaised: r.dateAdded,
    reviewDate: r.reviewDate,
    flags: {},
  }));
}

export function buildTalantonBoardPackData(meetingDateIso?: string): AbhiBoardPackData {
  const meetingDate = resolveMeetingDate(meetingDateIso);
  const packName = `Talanton Impact Board Pack — ${meetingDate.slice(0, 7)}`;
  const portfolio = buildPortfolioExecutiveBriefing(meetingDate);
  const impact = buildPortfolioImpactBriefing();
  const funds = FUNDS_PLATFORM_OVERVIEW;
  const fundList = listTalantonFunds();
  const actions = mapActions();
  const risks = mapRisks();
  const cash = TALANTON_CASH_BALANCE_USD;
  const deploymentPct = Math.round((funds.capitalDeployedUsd / funds.capitalCommittedUsd) * 100);

  const orgStatus: AbhiOrgStatus =
    portfolio.health.posture === "Elevated"
      ? "Red"
      : portfolio.health.posture === "Watch"
        ? "Amber"
        : "Green";

  const strategicTopics = [
    {
      issue: "Portfolio reporting backlog",
      evidence: `${portfolio.health.reportsOutstanding} quarterly reports outstanding; ${portfolio.health.companiesRequiringAttention} companies on leadership watch.`,
      recommendation: "Clear overdue company packs before LP communications.",
      whyItMatters: "LP confidence and board oversight depend on timely portfolio reporting.",
      decisionRequired: "Endorse 30-day reporting remediation plan.",
      impact: "Governance & LP relations",
      priority: "HIGH" as const,
    },
    {
      issue: "Capital deployment pace",
      evidence: `${formatFundUsd(funds.capitalDeployedUsd)} deployed (${deploymentPct}%) with ${formatFundUsd(funds.availableCapitalUsd)} available across ${fundList.length} funds.`,
      recommendation: "Confirm IC priorities for East Africa pipeline and follow-on reserves.",
      whyItMatters: "Stewardship mandate requires disciplined deployment with impact discipline.",
      decisionRequired: "Affirm H2 deployment priorities.",
      impact: "Fund performance",
      priority: "HIGH" as const,
    },
    {
      issue: "Impact health trajectory",
      evidence: `Impact health ${impact.health.score}/100 (${impact.health.band}); ${impact.summary.jobsCreated.toLocaleString()} jobs created across portfolio.`,
      recommendation: "Standardise jobs & beneficiary definitions before next investor update.",
      whyItMatters: "Mission proof points anchor Talanton's differentiated narrative.",
      decisionRequired: "Approve harmonised impact reporting definitions.",
      impact: "Mission credibility",
      priority: "MEDIUM" as const,
    },
  ];

  return {
    meetingDate,
    packName,
    status: "Final",
    orgStatus,
    attendees: TI_BOARD_MEMBERS.slice(0, 7).map((m) => ({ name: m.name, role: m.role })),
    highlightCards: [
      {
        title: "Capital committed",
        primary: formatFundUsd(funds.capitalCommittedUsd),
        secondary: `${fundList.length} stewardship funds`,
      },
      {
        title: "Capital deployed",
        primary: formatFundUsd(funds.capitalDeployedUsd),
        secondary: `${deploymentPct}% of committed capital`,
      },
      {
        title: "Portfolio companies",
        primary: String(funds.portfolioCompanies),
        secondary: `${funds.countriesRepresented} countries`,
      },
      {
        title: "Impact health",
        primary: `${impact.health.score}/100`,
        secondary: impact.health.band,
      },
      {
        title: "Management cash",
        primary: formatTalantonBoardUsd(cash, true),
        secondary: "USD operating balance",
      },
    ],
    concernCards: risks
      .filter((r) => r.impact === "H")
      .slice(0, 3)
      .map((r) => ({
        title: r.id,
        detail: r.risk.length > 52 ? `${r.risk.slice(0, 49).trimEnd()}…` : r.risk,
      })),
    highlights: [
      `${formatFundUsd(funds.capitalDeployedUsd)} deployed across ${funds.portfolioCompanies} portfolio companies; ${formatFundUsd(funds.availableCapitalUsd)} available for stewardship.`,
      `Impact health ${impact.health.score}/100 — ${impact.summary.jobsCreated.toLocaleString()} jobs created, ${impact.summary.peopleServed.toLocaleString()} people served.`,
      `Portfolio health ${portfolio.health.portfolioHealthScore}/100 (${portfolio.health.posture}); ${portfolio.health.companiesRequiringAttention} companies require attention.`,
      `Management company cash ${formatTalantonBoardUsd(cash, true)}; ${TALANTON_HR_TEAM_EMPLOYEES.length} team members.`,
    ],
    concerns: risks.slice(0, 5).map((r) => r.risk),
    discussionTopics: strategicTopics.map((t) => t.issue),
    boardDecisions: strategicTopics.map((t) => t.decisionRequired),
    agenda: [...TI_AGENDA],
    previousActions: actions,
    risks,
    kpis: [
      {
        name: "Portfolio health",
        actual: portfolio.health.portfolioHealthScore,
        budget: 80,
        variance: portfolio.health.portfolioHealthScore - 80,
        unit: "count",
        indicator: portfolio.health.portfolioHealthScore >= 80 ? "On track" : "Watch",
        trend: portfolio.health.portfolioHealthScore >= 75 ? 1 : 0,
        sparkline: [72, 74, 76, 77, portfolio.health.portfolioHealthScore],
      },
      {
        name: "Impact health",
        actual: impact.health.score,
        budget: 75,
        variance: impact.health.score - 75,
        unit: "count",
        indicator: impact.health.score >= 75 ? "On track" : "Watch",
        trend: 1,
        sparkline: [68, 70, 72, 74, impact.health.score],
      },
      {
        name: "Capital deployed",
        actual: deploymentPct,
        budget: 70,
        variance: deploymentPct - 70,
        unit: "percent",
        indicator: deploymentPct >= 65 ? "On track" : "Watch",
        trend: 1,
        sparkline: [58, 61, 63, 66, deploymentPct],
      },
      {
        name: "Jobs created",
        actual: impact.summary.jobsCreated,
        budget: impact.summary.jobsCreated - 500,
        variance: 500,
        unit: "count",
        indicator: "On track",
        trend: 1,
        sparkline: [
          impact.summary.jobsCreated - 2000,
          impact.summary.jobsCreated - 1500,
          impact.summary.jobsCreated - 1000,
          impact.summary.jobsCreated - 500,
          impact.summary.jobsCreated,
        ],
      },
    ],
    financialOverview: {
      revenueVsBudget: { label: "Operating revenue YTD", actual: 2_400_000, budget: 2_200_000, variance: 200_000 },
      operatingSurplus: { label: "Operating surplus", actual: 180_000, budget: 120_000, variance: 60_000 },
      cashPosition: { label: "Cash", actual: cash, budget: cash * 0.95, variance: cash * 0.05 },
      forecastYearEnd: { label: "Year-end outlook", revenue: 3_100_000, surplus: 240_000, cash: cash * 1.04 },
    },
    financialInsights: {
      revenue: {
        title: "Operating revenue",
        position: "Ahead of budget",
        variance: `${formatTalantonBoardUsd(200_000, true)} above plan`,
        commentary: "Fund management fees and portfolio support revenue tracking ahead of FY plan.",
      },
      operatingResult: {
        title: "Operating result",
        position: "Surplus",
        variance: `${formatTalantonBoardUsd(60_000, true)} above budget`,
        commentary: "Disciplined operating spend supports reinvestment in portfolio support.",
      },
      cash: {
        title: "Cash position",
        current: formatTalantonBoardUsd(cash, true),
        movement: `+${formatTalantonBoardUsd(cash - 4_180_000, true)} vs prior month`,
        assessment: "Comfortable liquidity for operations and co-investment reserves.",
      },
      forecast: {
        title: "Year-end outlook",
        outlook: "Stable with modest surplus",
        confidence: "Medium-high",
        assumptions: "No material FX shock; portfolio fee income on plan.",
      },
    },
    pnl: {
      rows: [
        {
          line: "Fund management & advisory revenue",
          actual: 2_400_000,
          budget: 2_200_000,
          variance: 200_000,
          priorYear: 2_100_000,
        },
        {
          line: "Operating expenses",
          actual: 2_220_000,
          budget: 2_080_000,
          variance: -140_000,
          priorYear: 2_050_000,
        },
        {
          line: "Operating surplus",
          actual: 180_000,
          budget: 120_000,
          variance: 60_000,
          priorYear: 95_000,
          emphasis: true,
        },
      ],
      commentary: [
        "Revenue ahead of plan on fund management fees.",
        "Operating spend disciplined; surplus supports portfolio support capacity.",
      ],
    },
    balanceSheet: {
      assets: cash + 1_200_000,
      liabilities: 420_000,
      netAssets: cash + 780_000,
      cashTrend: [3_920_000, 4_010_000, 4_080_000, 4_140_000, 4_180_000, cash],
      cashForecast: Math.round(cash * 1.03),
      debtors: 185_000,
      creditors: 235_000,
      cashMovementMom: cash - 4_180_000,
      cashDrivers: "Fund fees received; operating disbursements controlled.",
      liquidityAssessment: "Strong — 12+ months operating runway at current burn.",
      positiveCashDrivers: [{ label: "Fund management fees", amount: 320_000 }],
      negativeCashDrivers: [{ label: "Operating & travel", amount: 180_000 }],
    },
    commercial: {
      membership: {
        new: 2,
        lost: 0,
        net: 2,
        total: funds.portfolioCompanies,
      },
      sponsorship: {
        budget: funds.capitalCommittedUsd,
        actual: funds.capitalDeployedUsd,
        forecast: funds.capitalDeployedUsd + funds.availableCapitalUsd * 0.4,
      },
      events: {
        revenue: impact.health.score,
        registrations: impact.summary.communitiesImpacted,
        forecast: impact.summary.peopleServed,
      },
    },
    commercialInsights: {
      membership: {
        title: "Portfolio footprint",
        lines: [
          { label: "Portfolio companies", value: String(funds.portfolioCompanies) },
          { label: "Countries", value: String(funds.countriesRepresented) },
          { label: "Attention required", value: String(portfolio.health.companiesRequiringAttention) },
        ],
      },
      sponsorship: {
        title: "Capital stewardship",
        lines: [
          { label: "Committed", value: formatFundUsd(funds.capitalCommittedUsd) },
          { label: "Deployed", value: formatFundUsd(funds.capitalDeployedUsd) },
          { label: "Available", value: formatFundUsd(funds.availableCapitalUsd) },
        ],
      },
      events: {
        title: "Impact stewardship",
        lines: [
          { label: "Impact health", value: `${impact.health.score}/100` },
          { label: "Jobs created", value: impact.summary.jobsCreated.toLocaleString() },
          { label: "People served", value: impact.summary.peopleServed.toLocaleString() },
        ],
      },
    },
    team: {
      headcount: TALANTON_HR_TEAM_EMPLOYEES.length,
      openRoles: 2,
      joiners: [{ name: "David Simms", role: "Portfolio Operations", startDate: "2026-04-01" }],
      leavers: [],
      notes: "Lean stewardship team across London and Nairobi hubs.",
    },
    strategicTopics,
    aob: "LP reporting calendar · East Africa site visit summary · Annual impact report timeline.",
    pageSummaries: [
      "Cover — Talanton Impact Board Pack.",
      "Executive Summary — Portfolio, funds, impact, and decisions required.",
      "Previous Actions — Governance action register.",
      "Risk Register — Corporate and portfolio risks.",
      "Portfolio & Fund KPIs — Health, deployment, and impact metrics.",
      "Financial Overview — Management company financials (USD).",
      "Funds & Capital Deployment — Committed, deployed, and available capital.",
      "Impact Stewardship — Jobs, communities, and impact health.",
      "Strategic Discussion & AOB — Board decisions and follow-ups.",
    ],
    folderPath: `Corporate Information / Board Deck / ${packName}`,
  };
}

export function talantonBoardPackPdfFileName(meetingDate: string) {
  return `Talanton-Impact-Board-Pack-${meetingDate}.pdf`;
}

export function talantonBoardPackPptxFileName(meetingDate: string) {
  return `Talanton-Impact-Board-Pack-${meetingDate}.pptx`;
}
