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

export const STATUS_COLORS: Record<GrantStatus, string> = {
  Draft: "#94a3b8",
  Submitted: "#38bdf8",
  "Under Review": "#fbbf24",
  Approved: "#34d399",
  Rejected: "#f87171",
  Disbursed: "#a78bfa",
};

export function formatGrantAmount(amount: number) {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `€${Math.round(amount / 1_000)}k`;
  return `€${amount}`;
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
