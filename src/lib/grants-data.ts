export type GrantStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Disbursed";

export type GrantApplication = {
  id: string;
  programme: string;
  funder: string;
  title: string;
  amountEur: number;
  status: GrantStatus;
  owner: string;
  submittedAt: string | null;
  deadline: string;
  region: string;
  coFundingPct: number;
};

export const GRANTS_KPIS = [
  {
    id: "pipeline",
    label: "Grant pipeline",
    value: "€2.48M",
    change: "+€420k",
    trend: "up" as const,
    hint: "Active applications in flight",
  },
  {
    id: "approved-ytd",
    label: "Approved YTD",
    value: "€640k",
    change: "+2 awards",
    trend: "up" as const,
    hint: "Confirmed funding this year",
  },
  {
    id: "under-review",
    label: "Under review",
    value: "5",
    change: "2 due this week",
    trend: "neutral" as const,
    hint: "Awaiting assessor feedback",
  },
  {
    id: "success-rate",
    label: "Success rate",
    value: "68%",
    change: "+6 pts",
    trend: "up" as const,
    hint: "Rolling 12-month win rate",
  },
];

export const GRANTS_BY_STATUS = [
  { status: "Draft", count: 3, value: 280000 },
  { status: "Submitted", count: 4, value: 520000 },
  { status: "Under Review", count: 5, value: 890000 },
  { status: "Approved", count: 3, value: 640000 },
  { status: "Disbursed", count: 2, value: 310000 },
  { status: "Rejected", count: 2, value: 180000 },
];

export const GRANTS_BY_PROGRAMME = [
  { programme: "Horizon Europe", amount: 920000 },
  { programme: "CDTI Innovation", amount: 540000 },
  { programme: "Acció Catalunya", amount: 380000 },
  { programme: "Innovate UK", amount: 290000 },
  { programme: "ERDF Regional", amount: 210000 },
];

export const GRANTS_MONTHLY_SUBMISSIONS = [
  { month: "Jan", submitted: 2, approved: 1 },
  { month: "Feb", submitted: 1, approved: 0 },
  { month: "Mar", submitted: 3, approved: 1 },
  { month: "Apr", submitted: 2, approved: 2 },
  { month: "May", submitted: 4, approved: 1 },
  { month: "Jun", submitted: 3, approved: 2 },
];

export const GRANT_APPLICATIONS: GrantApplication[] = [
  {
    id: "grant-1",
    programme: "Horizon Europe",
    funder: "European Commission",
    title: "Green logistics corridor digitisation",
    amountEur: 420000,
    status: "Under Review",
    owner: "Tom",
    submittedAt: "2026-04-12",
    deadline: "2026-06-30",
    region: "EU",
    coFundingPct: 30,
  },
  {
    id: "grant-2",
    programme: "CDTI Innovation",
    funder: "CDTI",
    title: "UAS operations platform R&D",
    amountEur: 280000,
    status: "Approved",
    owner: "Sarah",
    submittedAt: "2026-02-18",
    deadline: "2026-05-15",
    region: "Spain",
    coFundingPct: 25,
  },
  {
    id: "grant-3",
    programme: "Acció Catalunya",
    funder: "Generalitat de Catalunya",
    title: "SME digital transformation pilot",
    amountEur: 95000,
    status: "Submitted",
    owner: "John",
    submittedAt: "2026-05-28",
    deadline: "2026-07-10",
    region: "Catalonia",
    coFundingPct: 20,
  },
  {
    id: "grant-4",
    programme: "Innovate UK",
    funder: "UKRI",
    title: "Port automation feasibility study",
    amountEur: 175000,
    status: "Draft",
    owner: "Tom",
    submittedAt: null,
    deadline: "2026-08-01",
    region: "UK",
    coFundingPct: 35,
  },
  {
    id: "grant-5",
    programme: "ERDF Regional",
    funder: "ERDF",
    title: "Workforce upskilling programme",
    amountEur: 120000,
    status: "Disbursed",
    owner: "Sarah",
    submittedAt: "2025-11-04",
    deadline: "2026-01-20",
    region: "EU",
    coFundingPct: 15,
  },
  {
    id: "grant-6",
    programme: "Horizon Europe",
    funder: "European Commission",
    title: "Circular construction materials audit",
    amountEur: 310000,
    status: "Under Review",
    owner: "John",
    submittedAt: "2026-03-22",
    deadline: "2026-06-18",
    region: "EU",
    coFundingPct: 30,
  },
];

const DEMO_GRANT_APPLICATIONS: GrantApplication[] = [
  {
    id: "grant-mag-1",
    programme: "Innovate UK",
    funder: "UKRI",
    title: "Enterprise cloud modernisation accelerator",
    amountEur: 320000,
    status: "Under Review",
    owner: "Riley Jenkins",
    submittedAt: "2026-04-12",
    deadline: "2026-06-30",
    region: "UK",
    coFundingPct: 30,
  },
  {
    id: "grant-mag-2",
    programme: "Horizon Europe",
    funder: "European Commission",
    title: "Digital operating model for mid-market manufacturers",
    amountEur: 410000,
    status: "Approved",
    owner: "Oliver Hayes",
    submittedAt: "2026-02-18",
    deadline: "2026-05-15",
    region: "EU",
    coFundingPct: 25,
  },
  {
    id: "grant-mag-3",
    programme: "ERDF Regional",
    funder: "ERDF",
    title: "Workforce digital upskilling programme",
    amountEur: 145000,
    status: "Submitted",
    owner: "Reese Sullivan",
    submittedAt: "2026-05-28",
    deadline: "2026-07-10",
    region: "UK",
    coFundingPct: 20,
  },
  {
    id: "grant-mag-4",
    programme: "Innovate UK",
    funder: "UKRI",
    title: "Board reporting automation feasibility",
    amountEur: 98000,
    status: "Draft",
    owner: "Benjamin Bailey",
    submittedAt: null,
    deadline: "2026-08-01",
    region: "UK",
    coFundingPct: 35,
  },
  {
    id: "grant-mag-5",
    programme: "Horizon Europe",
    funder: "European Commission",
    title: "Secure multi-cloud governance toolkit",
    amountEur: 275000,
    status: "Disbursed",
    owner: "Riley Jenkins",
    submittedAt: "2025-11-04",
    deadline: "2026-01-20",
    region: "EU",
    coFundingPct: 15,
  },
  {
    id: "grant-mag-6",
    programme: "ERDF Regional",
    funder: "ERDF",
    title: "SME digital transformation pilot — London",
    amountEur: 180000,
    status: "Under Review",
    owner: "Oliver Hayes",
    submittedAt: "2026-03-22",
    deadline: "2026-06-18",
    region: "UK",
    coFundingPct: 30,
  },
];

const DEMO_GRANTS_BY_PROGRAMME = [
  { programme: "Horizon Europe", amount: 685000 },
  { programme: "Innovate UK", amount: 418000 },
  { programme: "ERDF Regional", amount: 325000 },
];

function isDemoGrantsSurface() {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    return isBrowserDemoSurface();
  } catch {
    return false;
  }
}

function isOnwardAirGrantsSurface() {
  if (typeof window === "undefined") return false;
  try {
    const { isOnwardAirBusinessCentralFixtures } =
      require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
    return isOnwardAirBusinessCentralFixtures();
  } catch {
    return false;
  }
}

export function getGrantApplications(): GrantApplication[] {
  if (isOnwardAirGrantsSurface()) {
    const { getOaGrantApplications } =
      require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
    return getOaGrantApplications();
  }
  if (isDemoGrantsSurface()) {
    const { getNorthstarGrantApplications } =
      require("@/lib/demo/module-fixtures") as typeof import("@/lib/demo/module-fixtures");
    return getNorthstarGrantApplications();
  }
  return isDemoGrantsSurface() ? DEMO_GRANT_APPLICATIONS : GRANT_APPLICATIONS;
}

export function getGrantsByProgramme() {
  if (isOnwardAirGrantsSurface()) {
    const { OA_GRANTS_BY_PROGRAMME } =
      require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
    return OA_GRANTS_BY_PROGRAMME;
  }
  return isDemoGrantsSurface() ? DEMO_GRANTS_BY_PROGRAMME : GRANTS_BY_PROGRAMME;
}

export function getGrantsKpis() {
  if (isOnwardAirGrantsSurface()) {
    const { getOaGrantsKpis } =
      require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
    return getOaGrantsKpis();
  }
  if (isDemoGrantsSurface()) {
    const { NORTHSTAR_GRANTS_KPIS } =
      require("@/lib/demo/module-fixtures") as typeof import("@/lib/demo/module-fixtures");
    return NORTHSTAR_GRANTS_KPIS;
  }
  return GRANTS_KPIS;
}

export function getGrantsByStatus() {
  if (isOnwardAirGrantsSurface()) {
    const { OA_GRANTS_BY_STATUS } =
      require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
    return OA_GRANTS_BY_STATUS;
  }
  return GRANTS_BY_STATUS;
}

export function getGrantsMonthlySubmissions() {
  if (isOnwardAirGrantsSurface()) {
    const { OA_GRANTS_MONTHLY_SUBMISSIONS } =
      require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
    return OA_GRANTS_MONTHLY_SUBMISSIONS;
  }
  return GRANTS_MONTHLY_SUBMISSIONS;
}

export const STATUS_COLORS: Record<GrantStatus, string> = {
  Draft: "#94a3b8",
  Submitted: "#38bdf8",
  "Under Review": "#fbbf24",
  Approved: "#34d399",
  Rejected: "#f87171",
  Disbursed: "#a78bfa",
};

export function formatGrantAmount(amount: number) {
  const oa = isOnwardAirGrantsSurface();
  const demo = isDemoGrantsSurface();
  const symbol = oa ? "$" : demo ? "£" : "€";
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${symbol}${Math.round(amount / 1_000)}k`;
  return `${symbol}${amount}`;
}

export function grantStatusClass(status: GrantStatus) {
  switch (status) {
    case "Approved":
    case "Disbursed":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "Under Review":
    case "Submitted":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "Rejected":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
    default:
      return "border-white/15 bg-white/[0.04] text-white/65";
  }
}
