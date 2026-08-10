import {
  ABHI_CASH_BALANCE_GBP,
  ABHI_REVENUE_YTD_GBP,
  getAbhiMonthlyCashSeries,
  getAbhiMonthlyRevenueSeries,
} from "@/lib/abhi-financials";
import { ABHI_MEMBER_SIGNUP_GROWTH } from "@/lib/abhi-surface";
import {
  getLatestHeldAbhiBoardMeeting,
  type AbhiMeetingAction,
} from "@/lib/abhi/board-meetings-store";

export type AbhiOrgStatus = "Green" | "Amber" | "Red";
export type AbhiPackStatus = "Draft" | "Final";
export type AbhiRiskTrend = "↑" | "→" | "↓";
export type AbhiRiskTrendLabel = "Increasing" | "Stable" | "Reducing";
export type AbhiActionStatus = "Completed" | "Underway" | "Overdue" | "Blocked";
export type AbhiKpiTrend = -1 | 0 | 1;

export type AbhiBoardAttendee = {
  name: string;
  role: string;
};

export type AbhiHighlightCard = {
  title: string;
  primary: string;
  secondary?: string;
};

export type AbhiConcernCard = {
  title: string;
  detail: string;
};

export type AbhiBoardAction = {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: AbhiActionStatus;
};

export type AbhiBoardRisk = {
  id: string;
  risk: string;
  owner: string;
  impact: "H" | "M" | "L";
  likelihood: "H" | "M" | "L";
  rating: number | "H" | "M" | "L";
  trend: AbhiRiskTrend;
  mitigation: string;
  status: string;
  dateRaised?: string;
  reviewDate?: string;
  flags: {
    new?: boolean;
    increased?: boolean;
    overdueMitigation?: boolean;
  };
};

export type AbhiKpiUnit = "currency" | "count" | "percent";
export type AbhiKpiIndicator = "On track" | "Watch" | "Off track";

export type AbhiBoardKpi = {
  name: string;
  actual: number | string;
  budget: number | string;
  variance: number | string;
  unit: AbhiKpiUnit;
  indicator: AbhiKpiIndicator;
  trend: AbhiKpiTrend;
  sparkline: number[];
};

export type AbhiFinancialMetric = {
  label: string;
  actual: number;
  budget?: number;
  variance?: number;
};

export type AbhiPnlRow = {
  line: string;
  actual: number;
  budget: number;
  variance: number;
  priorYear: number;
  emphasis?: boolean;
};

export type AbhiStrategicPriority = "HIGH" | "MEDIUM" | "LOW";

export type AbhiStrategicTopic = {
  issue: string;
  evidence: string;
  recommendation: string;
  /** One-line rationale — why the board should care. */
  whyItMatters: string;
  decisionRequired: string;
  impact: string;
  priority: AbhiStrategicPriority;
};

export type AbhiCashDriver = {
  label: string;
  amount: number;
};

export type AbhiFinancialInsightCard = {
  title: string;
  position: string;
  variance: string;
  commentary: string;
};

export type AbhiCashInsightCard = {
  title: string;
  current: string;
  movement: string;
  assessment: string;
};

export type AbhiForecastInsightCard = {
  title: string;
  outlook: string;
  confidence: string;
  assumptions: string;
};

export type AbhiCommercialInsight = {
  title: string;
  lines: { label: string; value: string }[];
};

export type AbhiBoardPackData = {
  meetingDate: string;
  packName: string;
  status: AbhiPackStatus;
  orgStatus: AbhiOrgStatus;
  attendees: AbhiBoardAttendee[];
  /** Structured cards for Executive Summary visual layout. */
  highlightCards: AbhiHighlightCard[];
  concernCards: AbhiConcernCard[];
  /** Narrative fallbacks / archive wording (derived from cards where useful). */
  highlights: string[];
  concerns: string[];
  discussionTopics: string[];
  boardDecisions: string[];
  agenda: string[];
  previousActions: {
    completed: AbhiBoardAction[];
    outstanding: AbhiBoardAction[];
    overdue: AbhiBoardAction[];
  };
  risks: AbhiBoardRisk[];
  kpis: AbhiBoardKpi[];
  financialOverview: {
    revenueVsBudget: AbhiFinancialMetric;
    operatingSurplus: AbhiFinancialMetric;
    cashPosition: AbhiFinancialMetric;
    forecastYearEnd: {
      label: string;
      revenue: number;
      surplus: number;
      cash: number;
    };
  };
  /** Executive narrative for Financial Overview slide. */
  financialInsights: {
    revenue: AbhiFinancialInsightCard;
    operatingResult: AbhiFinancialInsightCard;
    cash: AbhiCashInsightCard;
    forecast: AbhiForecastInsightCard;
  };
  pnl: {
    rows: AbhiPnlRow[];
    commentary: string[];
  };
  balanceSheet: {
    assets: number;
    liabilities: number;
    netAssets: number;
    cashTrend: number[];
    cashForecast: number;
    debtors: number;
    creditors: number;
    cashMovementMom: number;
    cashDrivers: string;
    liquidityAssessment: string;
    positiveCashDrivers: AbhiCashDriver[];
    negativeCashDrivers: AbhiCashDriver[];
  };
  commercial: {
    membership: { new: number; lost: number; net: number; total: number };
    sponsorship: { budget: number; actual: number; forecast: number };
    events: { revenue: number; registrations: number; forecast: number };
  };
  /** Executive narrative for Commercial Performance slide. */
  commercialInsights: {
    membership: AbhiCommercialInsight;
    sponsorship: AbhiCommercialInsight;
    events: AbhiCommercialInsight;
  };
  team: {
    headcount: number;
    openRoles: number;
    joiners: { name: string; role: string; startDate: string }[];
    leavers: { name: string; role: string; endDate: string }[];
    notes: string;
  };
  strategicTopics: AbhiStrategicTopic[];
  aob: string;
  pageSummaries: string[];
  folderPath: string;
};

const ABHI_AGENDA = [
  "Executive Summary",
  "Previous Actions",
  "Risk Register",
  "KPI Dashboard",
  "Financial Overview",
  "Profit & Loss",
  "Balance Sheet & Cash",
  "Commercial Performance",
  "Team & Organisation",
  "Strategic Discussion & AOB",
] as const;

/**
 * Prefer an explicit ISO date; otherwise default to tomorrow (demo-friendly).
 * Temporary: governance “ask for date” gate is disabled so EA can generate immediately.
 */
function resolveMeetingDate(meetingDateIso?: string): string {
  if (meetingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateIso)) {
    return meetingDateIso;
  }
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildPackName(meetingDate: string) {
  return `Board Pack - ${meetingDate}`;
}

function mapMeetingActionToBoardAction(action: AbhiMeetingAction): AbhiBoardAction {
  const status: AbhiActionStatus =
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

/** Prefer Board Meetings outcomes when available; fall back to fixture actions. */
function resolvePreviousActionsFromMeetings(fallback: AbhiBoardPackData["previousActions"]) {
  try {
    const latest = getLatestHeldAbhiBoardMeeting();
    if (!latest || latest.actions.length === 0) return fallback;
    const mapped = latest.actions.map(mapMeetingActionToBoardAction);
    return {
      completed: mapped.filter((a) => a.status === "Completed"),
      outstanding: mapped.filter((a) => a.status === "Underway" || a.status === "Blocked"),
      overdue: mapped.filter((a) => a.status === "Overdue"),
    };
  } catch {
    return fallback;
  }
}

function buildFolderPath(packName: string) {
  return `Corporate Information/Board Deck/${packName}`;
}

/** Canonical ABHI board pack fixture — figures align with {@link ABHI_REVENUE_YTD_GBP} and cash series. */
export function buildAbhiBoardPackData(meetingDateIso?: string): AbhiBoardPackData {
  const meetingDate = resolveMeetingDate(meetingDateIso);
  const packName = buildPackName(meetingDate);

  const revenueYtd = ABHI_REVENUE_YTD_GBP;
  const revenueBudget = 2_150_000;
  const revenueVariance = revenueYtd - revenueBudget;

  const membershipIncome = 1_050_000;
  const sponsorshipIncome = 560_000;
  const eventsIncome = 390_000;

  const staffCosts = 1_058_400;
  const marketingCosts = 162_800;
  const eventsDelivery = 235_000;
  const programmeCosts = 142_000;
  const adminCosts = 181_800;
  const totalCosts = staffCosts + marketingCosts + eventsDelivery + programmeCosts + adminCosts;

  const operatingSurplus = revenueYtd - totalCosts;
  const surplusBudget = 420_000;

  const cashPosition = ABHI_CASH_BALANCE_GBP;
  const cashTrend = getAbhiMonthlyCashSeries().map((point) => point.amount);
  const revenueSparkline = getAbhiMonthlyRevenueSeries().map((point) => point.amount);

  const membershipTotal =
    ABHI_MEMBER_SIGNUP_GROWTH[ABHI_MEMBER_SIGNUP_GROWTH.length - 1]?.members ?? 375;
  const membershipNew = 12;
  const membershipLost = 5;
  const membershipNet = membershipNew - membershipLost;

  const sponsorshipBudget = 680_000;
  const sponsorshipForecast = 640_000;

  const eventsRegistrations = 1_240;
  const eventsForecast = 520_000;

  const assets = 5_180_000;
  const liabilities = assets - cashPosition;
  const netAssets = cashPosition;

  const pnlRows: AbhiPnlRow[] = [
    {
      line: "Membership income",
      actual: membershipIncome,
      budget: 1_035_000,
      variance: membershipIncome - 1_035_000,
      priorYear: 980_000,
    },
    {
      line: "Sponsorship income",
      actual: sponsorshipIncome,
      budget: sponsorshipBudget,
      variance: sponsorshipIncome - sponsorshipBudget,
      priorYear: 610_000,
    },
    {
      line: "Events & conferences",
      actual: eventsIncome,
      budget: 435_000,
      variance: eventsIncome - 435_000,
      priorYear: 350_000,
    },
    {
      line: "Total revenue",
      actual: revenueYtd,
      budget: revenueBudget,
      variance: revenueVariance,
      priorYear: 1_940_000,
      emphasis: true,
    },
    {
      line: "Staff costs",
      actual: staffCosts,
      budget: 980_000,
      variance: staffCosts - 980_000,
      priorYear: 945_000,
    },
    {
      line: "Marketing & communications",
      actual: marketingCosts,
      budget: 185_000,
      variance: marketingCosts - 185_000,
      priorYear: 170_000,
    },
    {
      line: "Events delivery",
      actual: eventsDelivery,
      budget: 220_000,
      variance: eventsDelivery - 220_000,
      priorYear: 210_000,
    },
    {
      line: "Programme & policy",
      actual: programmeCosts,
      budget: 145_000,
      variance: programmeCosts - 145_000,
      priorYear: 138_000,
    },
    {
      line: "Administration & overheads",
      actual: adminCosts,
      budget: 200_000,
      variance: adminCosts - 200_000,
      priorYear: 175_000,
    },
    {
      line: "Total operating costs",
      actual: totalCosts,
      budget: 1_730_000,
      variance: totalCosts - 1_730_000,
      priorYear: 1_638_000,
      emphasis: true,
    },
    {
      line: "Operating surplus",
      actual: operatingSurplus,
      budget: surplusBudget,
      variance: operatingSurplus - surplusBudget,
      priorYear: 302_000,
      emphasis: true,
    },
  ];

  const data: AbhiBoardPackData = {
    meetingDate,
    packName,
    status: "Draft",
    orgStatus: "Amber",
    attendees: [
      { name: "Peter Ellingworth", role: "Chief Executive Officer" },
      { name: "Jane Lewis", role: "Deputy CEO & Chief Financial Officer" },
      { name: "Andrew Davies", role: "Director, Digital Health" },
      { name: "Judith Mellis", role: "Director, UK Market Affairs" },
      { name: "Paul Benton", role: "Director, International" },
      { name: "Michelle Michelucci", role: "Director, International Events" },
      { name: "Phil Brown", role: "Director, Regulatory Affairs" },
    ],
    highlightCards: [
      {
        title: "Membership Growth",
        primary: `${membershipTotal} active members`,
        secondary: "+7 net growth",
      },
      { title: "Revenue Performance", primary: "£2.0m YTD", secondary: "7% below budget" },
      { title: "Cash Position", primary: "£4.24m", secondary: "+£143k MoM" },
      { title: "WHX Dubai", primary: "28 of 32 commitments secured" },
      { title: "NHS Briefing", primary: "140 attendees", secondary: "89% satisfaction" },
    ],
    concernCards: [
      { title: "Sponsorship Revenue", detail: "£120k below budget" },
      { title: "MHRA Consultation", detail: "Response pack incomplete" },
      { title: "WHX Deposit", detail: "£85k due 22 Aug" },
      { title: "Overdue Invoices", detail: "£18k outstanding" },
      { title: "Events Overspend", detail: "£15k over budget" },
    ],
    highlights: [
      `Membership reached ${membershipTotal} active companies (+7 net this quarter) with OrthoTech UK and Lumina Diagnostics completing onboarding.`,
      "YTD revenue of £2.0M is tracking 7% below budget, primarily due to two tier-one sponsorship renewals slipping to Q4.",
      "Cash at bank stands at £4.24M following August membership collections — up £143k month-on-month.",
      "WHX Dubai 2027 UK pavilion design approved; 28 member slots committed against a 32-company target.",
      "NHS England MedTech Funding Mandate briefing delivered to 140 members with 89% satisfaction in post-event survey.",
    ],
    concerns: [
      "Sponsorship income is £120k below YTD budget with MedCore Partners and Helix Diagnostics renewals still unsigned.",
      "MHRA consultation on Software as a Medical Device (SaMD) reclassification closes 15 Sep — member response pack not yet finalised.",
      "WHX stand build contractor deposit (£85k) due 22 Aug; pavilion timeline remains on the critical path.",
      "Three membership invoices totalling £18k are more than 60 days overdue — two from new SME joiners in Q2.",
      "Events delivery costs ran £15k over budget after MedTech Innovation Expo AV upgrades and overflow room hire.",
    ],
    discussionTopics: [
      "Approve Q4 sponsorship recovery plan including tiered WHX pavilion packages for lapsed sponsors.",
      "Confirm ABHI position on MHRA SaMD consultation before member webinar on 12 Aug.",
      "Review NHS adoption pathway working group mandate and resourcing for autumn policy round.",
      "Agree delegation of authority for WHX Dubai pavilion deposits and supplier contracts above £50k.",
      "Endorse membership retention playbook for SMEs at risk of lapsing before 31 Dec renewal window.",
    ],
    boardDecisions: [
      "Approve Q4 sponsorship recovery plan.",
      "Approve WHX delegation authority above £50k.",
      "Approve NHS adoption working group funding.",
    ],
    agenda: [...ABHI_AGENDA],
    previousActions: resolvePreviousActionsFromMeetings({
      completed: [
        {
          id: "BA-241",
          title:
            "Publish Q2 membership growth dashboard to the board portal, including new/lost/net movement and SME cohort analysis",
          owner: "Jane Lewis",
          due: "2026-07-18",
          status: "Completed",
        },
        {
          id: "BA-238",
          title: "Sign WHX Dubai venue contract with DWTC and confirm pavilion footprint for 32 member slots",
          owner: "Michelle Michelucci",
          due: "2026-07-25",
          status: "Completed",
        },
        {
          id: "BA-235",
          title: "Circulate NHS MedTech Funding Mandate briefing slides and survey results to all members",
          owner: "Luella Trickett",
          due: "2026-07-30",
          status: "Completed",
        },
      ],
      outstanding: [
        {
          id: "BA-247",
          title:
            "Finalise MHRA SaMD consultation member response pack, incorporating SME impact assessment and recommended ABHI position",
          owner: "Phil Brown",
          due: "2026-08-15",
          status: "Underway",
        },
        {
          id: "BA-249",
          title:
            "Secure MedCore Partners tier-one sponsorship renewal and confirm WHX co-brand package terms before Q4 close",
          owner: "Jonathan Evans",
          due: "2026-08-30",
          status: "Underway",
        },
        {
          id: "BA-252",
          title:
            "Complete WHX pavilion stand elevations and supplier programme for board sign-off ahead of deposit deadline",
          owner: "Michelle Michelucci",
          due: "2026-09-05",
          status: "Blocked",
        },
      ],
      overdue: [
        {
          id: "BA-244",
          title:
            "Chase three SME membership invoices totalling £18k that are more than 60 days overdue and escalate to Finance Committee if unpaid",
          owner: "Jane Lewis",
          due: "2026-08-01",
          status: "Overdue",
        },
        {
          id: "BA-246",
          title:
            "Submit updated NHS supplier registration evidence pack to NHS England, including insurance certificates and policy statements",
          owner: "Judith Mellis",
          due: "2026-07-28",
          status: "Overdue",
        },
      ],
    }),
    risks: [
      {
        id: "R-01",
        risk: "Tier-one sponsorship renewals slip beyond Q3, widening YTD revenue gap",
        owner: "Jonathan Evans",
        impact: "H",
        likelihood: "M",
        rating: 15,
        trend: "↑",
        mitigation: "Executive outreach to MedCore and Helix; WHX co-brand packages offered by 20 Aug.",
        status: "Active",
        dateRaised: "2026-05-12",
        reviewDate: "2026-08-15",
        flags: { increased: true },
      },
      {
        id: "R-02",
        risk: "WHX Dubai pavilion build delay due to contractor capacity",
        owner: "Michelle Michelucci",
        impact: "H",
        likelihood: "M",
        rating: 12,
        trend: "→",
        mitigation: "Secondary fit-out supplier on standby; weekly DWTC programme calls.",
        status: "Mitigating",
        dateRaised: "2026-06-02",
        reviewDate: "2026-08-08",
        flags: { overdueMitigation: true },
      },
      {
        id: "R-03",
        risk: "MHRA SaMD reclassification creates compliance burden for member SMEs",
        owner: "Phil Brown",
        impact: "M",
        likelihood: "H",
        rating: 12,
        trend: "↑",
        mitigation: "Member toolkit and webinar series; regulatory helpline hours extended in Sep.",
        status: "New",
        dateRaised: "2026-07-21",
        reviewDate: "2026-08-20",
        flags: { new: true },
      },
      {
        id: "R-04",
        risk: "NHS adoption pathway changes reduce member market access assumptions",
        owner: "Judith Mellis",
        impact: "H",
        likelihood: "L",
        rating: 9,
        trend: "→",
        mitigation: "Working group scenario planning; quarterly NHS stakeholder map refresh.",
        status: "Monitoring",
        dateRaised: "2026-03-18",
        reviewDate: "2026-09-01",
        flags: {},
      },
      {
        id: "R-05",
        risk: "Key person dependency in International Events team during WHX peak",
        owner: "Jane Lewis",
        impact: "M",
        likelihood: "M",
        rating: 9,
        trend: "↓",
        mitigation: "Events Coordinator hire closing 24 Aug; cross-training plan for UK pavilion ops.",
        status: "Mitigating",
        dateRaised: "2026-04-09",
        reviewDate: "2026-08-24",
        flags: {},
      },
      {
        id: "R-06",
        risk: "Membership churn among early-stage SMEs ahead of Dec renewal window",
        owner: "Peter Ellingworth",
        impact: "M",
        likelihood: "M",
        rating: 6,
        trend: "→",
        mitigation: "Retention playbook with staged fee options; CEO call programme for at-risk accounts.",
        status: "Monitoring",
        dateRaised: "2026-06-30",
        reviewDate: "2026-09-15",
        flags: {},
      },
    ],
    kpis: [
      {
        name: "Active member companies",
        actual: membershipTotal,
        budget: 345,
        variance: membershipTotal - 345,
        unit: "count",
        indicator: "On track",
        trend: 1,
        sparkline: [338, 341, 343, 345, 355, 365, 372, membershipTotal],
      },
      {
        name: "YTD revenue",
        actual: revenueYtd,
        budget: revenueBudget,
        variance: revenueVariance,
        unit: "currency",
        indicator: "Off track",
        trend: -1,
        sparkline: revenueSparkline,
      },
      {
        name: "Cash at bank",
        actual: cashPosition,
        budget: 4_100_000,
        variance: cashPosition - 4_100_000,
        unit: "currency",
        indicator: "On track",
        trend: 1,
        sparkline: cashTrend,
      },
      {
        name: "Sponsorship YTD",
        actual: sponsorshipIncome,
        budget: sponsorshipBudget,
        variance: sponsorshipIncome - sponsorshipBudget,
        unit: "currency",
        indicator: "Off track",
        trend: -1,
        sparkline: [420_000, 470_000, 505_000, 520_000, 535_000, 548_000, 555_000, 560_000],
      },
      {
        name: "Event revenue YTD",
        actual: eventsIncome,
        budget: 435_000,
        variance: eventsIncome - 435_000,
        unit: "currency",
        indicator: "Watch",
        trend: 0,
        sparkline: [45_000, 95_000, 150_000, 210_000, 265_000, 310_000, 355_000, 390_000],
      },
      {
        name: "Net member growth YTD",
        actual: 18,
        budget: 15,
        variance: 3,
        unit: "count",
        indicator: "On track",
        trend: 1,
        sparkline: [2, 5, 8, 10, 12, 14, 16, 18],
      },
      {
        name: "WHX pavilion commitments",
        actual: 28,
        budget: 32,
        variance: -4,
        unit: "count",
        indicator: "Watch",
        trend: -1,
        sparkline: [8, 12, 16, 19, 22, 24, 26, 28],
      },
      {
        name: "Staff retention",
        actual: 96,
        budget: 95,
        variance: 1,
        unit: "percent",
        indicator: "On track",
        trend: 1,
        sparkline: [94, 94, 95, 95, 95, 96, 96, 96],
      },
    ],
    financialOverview: {
      revenueVsBudget: {
        label: "Revenue performance",
        actual: revenueYtd,
        budget: revenueBudget,
        variance: revenueVariance,
      },
      operatingSurplus: {
        label: "Operating result",
        actual: operatingSurplus,
        budget: surplusBudget,
        variance: operatingSurplus - surplusBudget,
      },
      cashPosition: {
        label: "Cash position",
        actual: cashPosition,
      },
      forecastYearEnd: {
        label: "Year-end forecast",
        revenue: 4_500_000,
        surplus: 480_000,
        cash: 4_400_000,
      },
    },
    financialInsights: {
      revenue: {
        title: "Revenue",
        position: formatAbhiBoardGbp(revenueYtd, true) + " YTD",
        variance: "7% Below Budget",
        commentary:
          "Shortfall driven by two tier-one sponsorship renewals slipping into Q4. Membership income remains ahead of plan.",
      },
      operatingResult: {
        title: "Operating Result",
        position: formatAbhiBoardGbp(operatingSurplus, true),
        variance: formatAbhiBoardBudgetVarianceNarrative(operatingSurplus - surplusBudget),
        commentary:
          "Result held by cost control in marketing; offset by higher staff costs for Digital Health hire and WHX programme cover.",
      },
      cash: {
        title: "Cash",
        current: formatAbhiBoardGbp(cashPosition, true),
        movement: "Net cash increase this month  +£143k",
        assessment: "Liquidity remains strong. No short-term funding pressure.",
      },
      forecast: {
        title: "Forecast",
        outlook:
          "Year-end revenue £4.5m · Operating result £480k · Cash £4.4m",
        confidence: "Medium — contingent on Q4 sponsorship recovery",
        assumptions:
          "Based on current trading assumptions. MedCore and Helix renewals close by 30 Sep; WHX deposit schedule unchanged; no further SME invoice write-offs.",
      },
    },
    pnl: {
      rows: pnlRows,
      commentary: [
        "Sponsorship revenue is £120k below budget following delayed renewals from MedCore Partners and Helix Diagnostics.",
        "Staff costs are 8% above budget reflecting Digital Health policy hire and WHX programme temporary cover.",
        "Marketing spend is 12% below budget after deferring two paid LinkedIn campaigns to Q4 member acquisition push.",
      ],
    },
    balanceSheet: {
      assets,
      liabilities,
      netAssets,
      cashTrend,
      cashForecast: 4_400_000,
      debtors: 485_000,
      creditors: 312_000,
      cashMovementMom: 143_000,
      cashDrivers:
        "Net cash rose £143k. Membership collections and sponsorship receipts outweighed payroll, WHX programme costs and supplier payments.",
      liquidityAssessment:
        "Cash cover remains comfortable for the next 6 months. Expected year-end cash £4.4m assumes Q4 sponsorship recovery.",
      positiveCashDrivers: [
        { label: "Membership collections", amount: 180_000 },
        { label: "Sponsorship receipts", amount: 65_000 },
        { label: "Event income", amount: 42_000 },
      ],
      negativeCashDrivers: [
        { label: "Payroll", amount: 88_000 },
        { label: "WHX programme costs", amount: 37_000 },
        { label: "Supplier payments", amount: 19_000 },
      ],
    },
    commercial: {
      membership: {
        new: membershipNew,
        lost: membershipLost,
        net: membershipNet,
        total: membershipTotal,
      },
      sponsorship: {
        budget: sponsorshipBudget,
        actual: sponsorshipIncome,
        forecast: sponsorshipForecast,
      },
      events: {
        revenue: eventsIncome,
        registrations: eventsRegistrations,
        forecast: eventsForecast,
      },
    },
    commercialInsights: {
      membership: {
        title: "Membership",
        lines: [
          { label: "Current position", value: `${membershipTotal} active members` },
          { label: "Net growth", value: "+7 this quarter · +18 YTD" },
          {
            label: "Key issue",
            value: "11 SME accounts flagged at risk ahead of Dec renewals (£33k value)",
          },
          {
            label: "Outlook",
            value: "Retention playbook and CEO call programme to protect year-end base",
          },
        ],
      },
      sponsorship: {
        title: "Sponsorship",
        lines: [
          { label: "Current position", value: "£560k YTD vs £680k budget" },
          { label: "Gap to target", value: "£120k · two tier-one renewals unsigned" },
          {
            label: "Recovery plan",
            value: "Executive renewal sprint with WHX co-brand packages by 30 Sep",
          },
          { label: "Forecast", value: "£640k full-year if MedCore and Helix close on plan" },
        ],
      },
      events: {
        title: "Events",
        lines: [
          { label: "Current performance", value: "£390k revenue · 1,240 registrations" },
          { label: "WHX progress", value: "28 of 32 pavilion commitments secured" },
          { label: "Revenue outlook", value: "£520k forecast · dependent on Q4 programme" },
          {
            label: "Delivery confidence",
            value: "Amber — stand deposit (£85k) due 22 Aug remains on critical path",
          },
        ],
      },
    },
    team: {
      headcount: 24,
      openRoles: 3,
      joiners: [
        { name: "Rebecca Parkin", role: "Digital Health Analyst", startDate: "2026-07-07" },
        { name: "Owain Prescott", role: "Market Access Officer", startDate: "2026-06-16" },
      ],
      leavers: [
        { name: "Sarah Okonkwo", role: "Events Assistant", endDate: "2026-07-31" },
      ],
      notes:
        "Three open roles: Membership Engagement Manager, Policy & Public Affairs Advisor, Events & Conferences Coordinator. WHX peak staffing plan approved; contractor support booked Sep–Nov.",
    },
    strategicTopics: [
      {
        issue: "Sponsorship pipeline recovery before WHX Dubai launch",
        evidence:
          "YTD sponsorship £560k vs £680k budget (−18%). Two tier-one accounts unsigned; pavilion packages 87% sold but sponsor income lagging.",
        recommendation:
          "Approve executive-led renewal sprint and WHX co-brand tier for lapsed sponsors, closing by 30 Sep.",
        whyItMatters: "Sponsorship shortfall is the primary driver of the YTD revenue gap.",
        decisionRequired: "Approve Q4 sponsorship recovery plan.",
        impact: "Year-end revenue shortfall widens beyond £150k.",
        priority: "HIGH",
      },
      {
        issue: "MHRA SaMD consultation — member position and resourcing",
        evidence:
          "Consultation closes 15 Sep; 42 member queries logged. Draft response 60% complete; regulatory helpline demand up 35% since July.",
        recommendation:
          "Endorse final ABHI position by 25 Aug and fund two additional regulatory clinic sessions in September.",
        whyItMatters: "Members need a clear ABHI position before the consultation closes.",
        decisionRequired: "Confirm ABHI SaMD position and clinic funding.",
        impact: "SME members lack guidance before consultation closes.",
        priority: "HIGH",
      },
      {
        issue: "NHS MedTech Funding Mandate — converting briefing momentum",
        evidence:
          "140 attendees at July briefing; 62 members requested follow-on adoption workshops. Working group capacity currently two days per week.",
        recommendation:
          "Expand working group mandate and approve £45k programme budget for autumn NHS adoption workshop series.",
        whyItMatters: "Demand for adoption support exceeds current working group capacity.",
        decisionRequired: "Approve NHS adoption working group funding (£45k).",
        impact: "Briefing momentum lost; weaker autumn adoption pathway.",
        priority: "MEDIUM",
      },
      {
        issue: "Membership retention for SME segment ahead of Dec renewals",
        evidence:
          "18 net YTD growth but 5 losses this quarter; 11 SME accounts flagged at-risk in CRM with £33k renewal value.",
        recommendation:
          "Approve staged fee options and CEO call programme for at-risk SMEs before 30 Sep renewal outreach window.",
        whyItMatters: "£33k of SME renewals are at risk before the December window.",
        decisionRequired: "Endorse SME retention playbook.",
        impact: "At-risk SME renewals may reverse net growth.",
        priority: "MEDIUM",
      },
    ],
    aob: "Board away-day date confirmation (Nov 2026) · GDPR annual audit timetable · Approval of revised delegate travel policy.",
    pageSummaries: [
      "Cover — ABHI Board Meeting Pack, meeting date, attendees.",
      "Executive Summary — Agenda, highlight cards, concern cards, and board decisions required.",
      "Previous Meeting Actions — Full action register sorted by status with colour-coded chips.",
      "Risk Register — Board risk register table, rating colours, trend, and flag highlights.",
      "KPI Dashboard — Eight executive KPIs with variance and sparklines.",
      "Financial Overview — Revenue, surplus, cash, and year-end forecast.",
      "Profit & Loss — Board P&L with variance commentary.",
      "Balance Sheet & Cash — Cash position, net cash movement, and cash drivers.",
      "Commercial Performance — Membership, sponsorship, and WHX commitments.",
      "Team & Organisation — Headcount, vacancies, joiners and leavers.",
      "Strategic Discussion & AOB — Issue, why it matters, decision required, impact.",
    ],
    folderPath: buildFolderPath(packName),
  };

  return data;
}

export function formatAbhiBoardGbp(value: number, compact = false): string {
  if (compact) {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000) {
      const millions = abs / 1_000_000;
      const formatted = millions.toFixed(millions >= 10 ? 0 : 1);
      return `${sign}£${formatted}M`;
    }
    if (abs >= 1_000) {
      return `${sign}£${Math.round(abs / 1_000)}k`;
    }
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Absolute compact currency for board narrative (never shows a negative £ sign). */
export function formatAbhiBoardGbpAbs(value: number, compact = true): string {
  return formatAbhiBoardGbp(Math.abs(value), compact);
}

/** Board-facing budget language for non-finance directors. */
export function formatAbhiBoardBudgetStatus(
  variance: number,
  options?: { percentAbs?: number },
): "Below Budget" | "Ahead Of Budget" | "On Budget" | string {
  if (Math.abs(variance) < 1) return "On Budget";
  const status = variance < 0 ? "Below Budget" : "Ahead Of Budget";
  if (options?.percentAbs != null) {
    return `${Math.round(options.percentAbs)}% ${status}`;
  }
  return status;
}

/** e.g. "£200k below budget" — avoids "£-200k vs budget". */
export function formatAbhiBoardBudgetVarianceNarrative(variance: number): string {
  if (Math.abs(variance) < 1) return "On Budget";
  const amount = formatAbhiBoardGbpAbs(variance, true);
  if (variance < 0) return `${amount} below budget`;
  return `${amount} ahead of budget`;
}

export function formatAbhiBoardDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function abhiKpiTrendArrow(trend: AbhiKpiTrend): string {
  if (trend > 0) return "↑";
  if (trend < 0) return "↓";
  return "→";
}

export function formatAbhiBoardKpiValue(
  value: number | string,
  unit: AbhiKpiUnit,
): string {
  if (typeof value !== "number") return String(value);
  if (unit === "currency") return formatAbhiBoardGbp(value, true);
  if (unit === "percent") return `${value}%`;
  return value.toLocaleString("en-GB");
}

export function formatAbhiBoardKpiVariance(
  value: number | string,
  unit: AbhiKpiUnit,
): string {
  if (typeof value !== "number") return String(value);
  const prefix = value > 0 ? "+" : "";
  if (unit === "currency") return `${prefix}${formatAbhiBoardGbp(value, true)}`;
  if (unit === "percent") return `${prefix}${value}pp`;
  return `${prefix}${value.toLocaleString("en-GB")}`;
}

export function abhiRiskTrendLabel(trend: AbhiRiskTrend): AbhiRiskTrendLabel {
  if (trend === "↑") return "Increasing";
  if (trend === "↓") return "Reducing";
  return "Stable";
}

export function abhiRiskScore(risk: AbhiBoardRisk): number {
  if (typeof risk.rating === "number") return risk.rating;
  if (risk.rating === "H") return 20;
  if (risk.rating === "M") return 10;
  return 4;
}

export function abhiRiskRatingBand(risk: AbhiBoardRisk): "High" | "Medium" | "Low" {
  const score = abhiRiskScore(risk);
  if (score >= 15) return "High";
  if (score >= 9) return "Medium";
  return "Low";
}

const ACTION_STATUS_ORDER: Record<AbhiActionStatus, number> = {
  Overdue: 0,
  Blocked: 1,
  Underway: 2,
  Completed: 3,
};

/** Flatten previous-action buckets and sort Overdue → Blocked → Underway → Completed. */
export function abhiSortedBoardActions(data: AbhiBoardPackData): AbhiBoardAction[] {
  return [
    ...data.previousActions.overdue,
    ...data.previousActions.outstanding,
    ...data.previousActions.completed,
  ].sort((a, b) => {
    const byStatus = ACTION_STATUS_ORDER[a.status] - ACTION_STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return a.due.localeCompare(b.due);
  });
}

export function abhiActionStatusColor(status: AbhiActionStatus): "green" | "amber" | "red" {
  if (status === "Completed") return "green";
  if (status === "Underway") return "amber";
  return "red";
}
