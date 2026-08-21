/** UI mock data for Sales Management — no backend integration. */

export type SalesRepStatus = "on-track" | "behind" | "ahead" | "at-risk";

export type SalesRepType = "internal" | "external";

export type SalesTabId =
  | "dashboard"
  | "sales-team"
  | "targets"
  | "pipeline"
  | "revenue"
  | "commissions"
  | "kpis"
  | "forecast"
  | "reports";

export const SALES_MANAGEMENT_TABS: ReadonlyArray<{ id: SalesTabId; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "sales-team", label: "Sales Team" },
  { id: "targets", label: "Targets" },
  { id: "pipeline", label: "Pipeline" },
  { id: "revenue", label: "Revenue" },
  { id: "commissions", label: "Commissions" },
  { id: "kpis", label: "KPIs" },
  { id: "forecast", label: "Forecast" },
  { id: "reports", label: "Reports" },
];

export const SALES_PERIOD_LABEL = "FY 2026 · H1 (Jan – Jun)";

export const SALES_SUMMARY = {
  revenueTarget: 500_000,
  revenueAchieved: 372_000,
  targetAchievementPct: 74.4,
  forecast: 465_000,
  pipeline: 820_000,
  commissionAccrued: 14_250,
  commissionPaid: 9_100,
  commissionPending: 5_150,
  potentialCommission: 18_600,
  weightedPipeline: 492_000,
  opportunityCount: 34,
  expectedClose: 118_000,
  currentRevenue: 372_000,
  gapToTarget: 35_000,
  winRatePct: 32,
  avgDealValue: 28_400,
  salesCycleDays: 47,
  pipelineCoverage: 1.64,
  newBusinessPct: 58,
  recurringRevenuePct: 42,
  forecastAccuracyPct: 91,
};

export const REVENUE_VS_TARGET_MONTHLY = [
  { month: "Jan", target: 72_000, actual: 58_000, forecast: 58_000 },
  { month: "Feb", target: 78_000, actual: 61_000, forecast: 61_000 },
  { month: "Mar", target: 82_000, actual: 68_000, forecast: 68_000 },
  { month: "Apr", target: 85_000, actual: 72_000, forecast: 72_000 },
  { month: "May", target: 88_000, actual: 79_000, forecast: 79_000 },
  { month: "Jun", target: 95_000, actual: 34_000, forecast: 87_000 },
];

export type SalesRepRow = {
  id: string;
  name: string;
  role: string;
  type: SalesRepType;
  target: number;
  actual: number;
  achievementPct: number;
  pipeline: number;
  forecast: number;
  commission: number;
  status: SalesRepStatus;
  territory: string;
  commissionPlan: string;
};

export const SALES_REPS: SalesRepRow[] = [
  {
    id: "hos",
    name: "Elena Vasquez",
    role: "Head of Sales",
    type: "internal",
    target: 0,
    actual: 0,
    achievementPct: 0,
    pipeline: 100_000,
    forecast: 0,
    commission: 0,
    status: "on-track",
    territory: "Global oversight",
    commissionPlan: "Team bonus (not rep quota)",
  },
  {
    id: "sarah",
    name: "Sarah Mitchell",
    role: "Senior Sales Rep",
    type: "internal",
    target: 250_000,
    actual: 210_000,
    achievementPct: 84,
    pipeline: 410_000,
    forecast: 235_000,
    commission: 8_400,
    status: "on-track",
    territory: "UK & Ireland",
    commissionPlan: "Base 3% · 1.2× accelerator >90%",
  },
  {
    id: "john",
    name: "John Okafor",
    role: "Sales Rep",
    type: "internal",
    target: 250_000,
    actual: 162_000,
    achievementPct: 65,
    pipeline: 310_000,
    forecast: 230_000,
    commission: 5_850,
    status: "behind",
    territory: "DACH & Nordics",
    commissionPlan: "Base 3% · 1.2× accelerator >90%",
  },
  {
    id: "agent-1",
    name: "Meridian Partners",
    role: "External Agent",
    type: "external",
    target: 120_000,
    actual: 0,
    achievementPct: 0,
    pipeline: 185_000,
    forecast: 72_000,
    commission: 0,
    status: "at-risk",
    territory: "Southern Europe",
    commissionPlan: "10% referral · paid on invoice",
  },
];

export const PIPELINE_STAGES = [
  { stage: "Lead", count: 12, value: 145_000, weighted: 29_000 },
  { stage: "Qualified", count: 9, value: 198_000, weighted: 79_200 },
  { stage: "Proposal", count: 7, value: 224_000, weighted: 112_000 },
  { stage: "Negotiation", count: 4, value: 168_000, weighted: 134_400 },
  { stage: "Won", count: 2, value: 85_000, weighted: 85_000 },
];

export const PIPELINE_OPPORTUNITIES = [
  {
    id: "opp-1",
    name: "Helios Analytics — Enterprise",
    rep: "Sarah Mitchell",
    stage: "Negotiation",
    value: 68_000,
    probability: 75,
    expectedClose: "Jun 28",
  },
  {
    id: "opp-2",
    name: "Northgate Systems — Platform",
    rep: "John Okafor",
    stage: "Proposal",
    value: 42_000,
    probability: 45,
    expectedClose: "Jul 12",
  },
  {
    id: "opp-3",
    name: "Apex Logistics — Renewal + upsell",
    rep: "Sarah Mitchell",
    stage: "Qualified",
    value: 36_000,
    probability: 40,
    expectedClose: "Jul 05",
  },
  {
    id: "opp-4",
    name: "Cobalt Health — New logo",
    rep: "Meridian Partners",
    stage: "Lead",
    value: 55_000,
    probability: 20,
    expectedClose: "Aug 18",
  },
];

export const COMMISSION_ROWS = [
  {
    rep: "Sarah Mitchell",
    revenue: 210_000,
    rate: "3.0%",
    commission: 6_300,
    accelerator: "€2,100",
    total: 8_400,
  },
  {
    rep: "John Okafor",
    revenue: 162_000,
    rate: "3.0%",
    commission: 4_860,
    accelerator: "€990",
    total: 5_850,
  },
  {
    rep: "Meridian Partners",
    revenue: 0,
    rate: "10.0%",
    commission: 0,
    accelerator: "—",
    total: 0,
  },
];

export const TARGET_PERIODS = [
  {
    period: "Annual 2026",
    teamTarget: 1_000_000,
    allocated: 1_000_000,
    achieved: 372_000,
    reps: 3,
  },
  {
    period: "H1 2026",
    teamTarget: 500_000,
    allocated: 500_000,
    achieved: 372_000,
    reps: 3,
  },
  {
    period: "Q2 2026",
    teamTarget: 260_000,
    allocated: 260_000,
    achieved: 185_000,
    reps: 3,
  },
];

export const MONTHLY_TARGETS = [
  { month: "Jan", team: 72_000, sarah: 36_000, john: 36_000 },
  { month: "Feb", team: 78_000, sarah: 39_000, john: 39_000 },
  { month: "Mar", team: 82_000, sarah: 41_000, john: 41_000 },
  { month: "Apr", team: 85_000, sarah: 42_500, john: 42_500 },
  { month: "May", team: 88_000, sarah: 44_000, john: 44_000 },
  { month: "Jun", team: 95_000, sarah: 47_500, john: 47_500 },
];

export const KPI_CARDS = [
  { label: "Revenue", value: "€372k", trend: "+12% vs prior period", tone: "positive" as const },
  { label: "Target achievement", value: "74.4%", trend: "€128k to H1 target", tone: "neutral" as const },
  { label: "Win rate", value: "32%", trend: "+4 pts vs Q1", tone: "positive" as const },
  { label: "Average deal value", value: "€28.4k", trend: "Stable", tone: "neutral" as const },
  { label: "Sales cycle", value: "47 days", trend: "−6 days vs Q1", tone: "positive" as const },
  { label: "Pipeline coverage", value: "1.64×", trend: "Healthy vs H1 target", tone: "positive" as const },
  { label: "New business", value: "58%", trend: "Of closed-won YTD", tone: "neutral" as const },
  { label: "Recurring revenue", value: "42%", trend: "Of closed-won YTD", tone: "neutral" as const },
  { label: "Forecast accuracy", value: "91%", trend: "Rolling 3-month", tone: "positive" as const },
];

export const FORECAST_SCENARIOS = [
  { label: "Conservative", value: 438_000, probability: 25 },
  { label: "Expected", value: 465_000, probability: 50 },
  { label: "Optimistic", value: 512_000, probability: 25 },
];

export const SALES_REPORTS = [
  {
    id: "rpt-monthly",
    title: "Monthly Sales Performance",
    description: "Revenue, pipeline movement, and rep attainment for the current month.",
    frequency: "Monthly",
    lastGenerated: "1 Jun 2026",
  },
  {
    id: "rpt-rep",
    title: "Sales Rep Performance",
    description: "Individual quota attainment, pipeline, and commission position.",
    frequency: "Weekly",
    lastGenerated: "16 Jun 2026",
  },
  {
    id: "rpt-rev-target",
    title: "Revenue vs Target",
    description: "Period actuals against team and individual targets with variance.",
    frequency: "Monthly",
    lastGenerated: "1 Jun 2026",
  },
  {
    id: "rpt-pipeline",
    title: "Pipeline Report",
    description: "Stage distribution, weighted value, and expected close dates.",
    frequency: "Weekly",
    lastGenerated: "17 Jun 2026",
  },
  {
    id: "rpt-commission",
    title: "Commission Report",
    description: "Accrued, pending, and paid commission by rep and plan.",
    frequency: "Monthly",
    lastGenerated: "31 May 2026",
  },
  {
    id: "rpt-forecast",
    title: "Forecast Report",
    description: "Forecast scenarios, gap to target, and confidence bands.",
    frequency: "Bi-weekly",
    lastGenerated: "14 Jun 2026",
  },
];

export const EA_PROMPT_EXAMPLES = [
  "How are we doing against target?",
  "Which rep is behind target?",
  "Show me John's performance.",
  "How much commission have we accrued?",
  "Are we going to hit target?",
];

export function formatEur(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `€${Math.round(value / 1_000)}k`;
  }
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function statusLabel(status: SalesRepStatus): string {
  switch (status) {
    case "on-track":
      return "On track";
    case "behind":
      return "Behind target";
    case "ahead":
      return "Ahead of target";
    case "at-risk":
      return "At risk";
  }
}

export function statusClass(status: SalesRepStatus): string {
  switch (status) {
    case "on-track":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "behind":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    case "ahead":
      return "border-sky-400/30 bg-sky-500/10 text-sky-200";
    case "at-risk":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
  }
}
