export type FinancialKpi = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  hint: string;
};

export const FINANCIAL_KPIS: FinancialKpi[] = [
  {
    id: "active-projects",
    label: "Active projects",
    value: "3",
    change: "+1 vs last month",
    trend: "up",
    hint: "Live field mobilisations",
  },
  {
    id: "pipeline-value",
    label: "Pipeline value",
    value: "€1.24M",
    change: "+€180k",
    trend: "up",
    hint: "Signed + forecast upcoming work",
  },
  {
    id: "monthly-revenue",
    label: "Monthly revenue",
    value: "€186k",
    change: "+12.4%",
    trend: "up",
    hint: "Recognised revenue — June 2026",
  },
  {
    id: "gross-margin",
    label: "Gross margin",
    value: "42.3%",
    change: "+1.8 pts",
    trend: "up",
    hint: "After direct ops & equipment costs",
  },
  {
    id: "ytd-profit",
    label: "YTD net profit",
    value: "€148k",
    change: "+€22k",
    trend: "up",
    hint: "Profit after overheads",
  },
  {
    id: "outstanding",
    label: "Outstanding invoices",
    value: "€64k",
    change: "3 clients",
    trend: "neutral",
    hint: "Awaiting payment",
  },
];

export const MONTHLY_REVENUE_DATA = [
  { month: "Jan", revenue: 98, target: 90 },
  { month: "Feb", revenue: 112, target: 100 },
  { month: "Mar", revenue: 124, target: 110 },
  { month: "Apr", revenue: 138, target: 125 },
  { month: "May", revenue: 162, target: 140 },
  { month: "Jun", revenue: 186, target: 155 },
] as const;

export const PROFIT_LOSS_DATA = [
  { month: "Jan", revenue: 98, costs: 62, profit: 36 },
  { month: "Feb", revenue: 112, costs: 68, profit: 44 },
  { month: "Mar", revenue: 124, costs: 74, profit: 50 },
  { month: "Apr", revenue: 138, costs: 81, profit: 57 },
  { month: "May", revenue: 162, costs: 94, profit: 68 },
  { month: "Jun", revenue: 186, costs: 107, profit: 79 },
] as const;

export const PIPELINE_BY_REGION_DATA = [
  { region: "Catalonia", value: 420 },
  { region: "Porto", value: 285 },
  { region: "Oxford", value: 310 },
  { region: "Iberia", value: 145 },
  { region: "Australia", value: 80 },
] as const;

export const REVENUE_BY_SERVICE_DATA = [
  { name: "Surveying", value: 38, color: "#38bdf8" },
  { name: "Inspection", value: 28, color: "#34d399" },
  { name: "Thermal", value: 18, color: "#fbbf24" },
  { name: "Media", value: 9, color: "#a78bfa" },
  { name: "Other", value: 7, color: "#94a3b8" },
] as const;

export function formatFinancialThousands(value: number) {
  return `€${value}k`;
}
