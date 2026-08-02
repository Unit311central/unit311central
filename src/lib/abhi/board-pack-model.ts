import {
  ABHI_CASH_BALANCE_GBP,
  ABHI_REVENUE_YTD_GBP,
  getAbhiMonthlyCashSeries,
  getAbhiMonthlyRevenueSeries,
} from "@/lib/abhi-financials";

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
  flags: {
    new?: boolean;
    increased?: boolean;
    overdueMitigation?: boolean;
  };
};

export type AbhiBoardKpi = {
  name: string;
  actual: number | string;
  budget: number | string;
  variance: number | string;
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

export type AbhiStrategicTopic = {
  issue: string;
  evidence: string;
  recommendation: string;
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
  };
  commercial: {
    membership: { new: number; lost: number; net: number; total: number };
    sponsorship: { budget: number; actual: number; forecast: number };
    events: { revenue: number; registrations: number; forecast: number };
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

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function resolveMeetingDate(meetingDateIso?: string): string {
  if (meetingDateIso && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateIso)) {
    return meetingDateIso;
  }
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return toIsoDate(next);
}

function buildPackName(meetingDate: string) {
  return `Board Pack - ${meetingDate}`;
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

  const membershipTotal = 350;
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
      { title: "Membership Growth", primary: "350 active members", secondary: "+7 net growth" },
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
      "Membership reached 350 active companies (+7 net this quarter) with OrthoTech UK and Lumina Diagnostics completing onboarding.",
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
    previousActions: {
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
    },
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
        flags: {},
      },
    ],
    kpis: [
      {
        name: "Active member companies",
        actual: membershipTotal,
        budget: 345,
        variance: membershipTotal - 345,
        trend: 1,
        sparkline: [338, 341, 343, 345, 347, 349, 350, 350],
      },
      {
        name: "YTD revenue (£)",
        actual: revenueYtd,
        budget: revenueBudget,
        variance: revenueVariance,
        trend: -1,
        sparkline: revenueSparkline,
      },
      {
        name: "Cash at bank (£)",
        actual: cashPosition,
        budget: 4_100_000,
        variance: cashPosition - 4_100_000,
        trend: 1,
        sparkline: cashTrend,
      },
      {
        name: "Sponsorship YTD (£)",
        actual: sponsorshipIncome,
        budget: sponsorshipBudget,
        variance: sponsorshipIncome - sponsorshipBudget,
        trend: -1,
        sparkline: [420_000, 470_000, 505_000, 520_000, 535_000, 548_000, 555_000, 560_000],
      },
      {
        name: "Event revenue YTD (£)",
        actual: eventsIncome,
        budget: 435_000,
        variance: eventsIncome - 435_000,
        trend: 0,
        sparkline: [45_000, 95_000, 150_000, 210_000, 265_000, 310_000, 355_000, 390_000],
      },
      {
        name: "Net member growth YTD",
        actual: 18,
        budget: 15,
        variance: 3,
        trend: 1,
        sparkline: [2, 5, 8, 10, 12, 14, 16, 18],
      },
      {
        name: "WHX pavilion commitments",
        actual: 28,
        budget: 32,
        variance: -4,
        trend: -1,
        sparkline: [8, 12, 16, 19, 22, 24, 26, 28],
      },
      {
        name: "Staff retention (%)",
        actual: 96,
        budget: 95,
        variance: 1,
        trend: 1,
        sparkline: [94, 94, 95, 95, 95, 96, 96, 96],
      },
    ],
    financialOverview: {
      revenueVsBudget: {
        label: "YTD Revenue vs Budget",
        actual: revenueYtd,
        budget: revenueBudget,
        variance: revenueVariance,
      },
      operatingSurplus: {
        label: "Operating Surplus",
        actual: operatingSurplus,
        budget: surplusBudget,
        variance: operatingSurplus - surplusBudget,
      },
      cashPosition: {
        label: "Cash at Bank",
        actual: cashPosition,
      },
      forecastYearEnd: {
        label: "FY2026 Forecast",
        revenue: 4_500_000,
        surplus: 480_000,
        cash: 4_400_000,
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
          "Board to approve executive-led renewal sprint and WHX co-brand tier for lapsed sponsors closing by 30 Sep.",
      },
      {
        issue: "MHRA SaMD consultation — member position and resourcing",
        evidence:
          "Consultation closes 15 Sep; 42 member queries logged. Draft response 60% complete; regulatory helpline demand up 35% since July.",
        recommendation:
          "Endorse final ABHI position by 25 Aug and fund two additional regulatory clinic sessions in September.",
      },
      {
        issue: "NHS MedTech Funding Mandate — converting briefing momentum",
        evidence:
          "140 attendees at July briefing; 62 members requested follow-on adoption workshops. Working group capacity currently two days per week.",
        recommendation:
          "Expand working group mandate and approve £45k programme budget for autumn NHS adoption workshop series.",
      },
      {
        issue: "Membership retention for SME segment ahead of Dec renewals",
        evidence:
          "18 net YTD growth but 5 losses this quarter; 11 SME accounts flagged at-risk in CRM with £33k renewal value.",
        recommendation:
          "Approve staged fee options and CEO call programme for at-risk SMEs before 30 Sep renewal outreach window.",
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
      "Balance Sheet & Cash — Assets, liabilities, cash trend and forecast.",
      "Commercial Performance — Membership, sponsorship, and events.",
      "Team & Organisation — Headcount, vacancies, joiners and leavers.",
      "Strategic Discussion & AOB — Board topics with evidence and recommendations.",
    ],
    folderPath: buildFolderPath(packName),
  };

  return data;
}

export function formatAbhiBoardGbp(value: number, compact = false): string {
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
      const millions = value / 1_000_000;
      const formatted = millions.toFixed(Math.abs(millions) >= 10 ? 0 : 1);
      return `£${formatted}M`;
    }
    if (abs >= 1_000) {
      return `£${Math.round(value / 1_000)}k`;
    }
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
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
