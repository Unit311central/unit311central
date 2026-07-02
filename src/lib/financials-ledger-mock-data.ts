export type LedgerKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type LedgerAgingBucket = {
  bucket: string;
  amount: number;
  fill: string;
};

export type LedgerAccountRow = {
  id: string;
  name: string;
  reference: string;
  outstanding: number;
  dueDate: string;
  daysOverdue: number;
  status: "current" | "due_soon" | "overdue";
};

export type LedgerMonthlyPoint = {
  month: string;
  outstanding: number;
  settled: number;
};

export const DEBTORS_KPIS: LedgerKpi[] = [
  {
    id: "total-outstanding",
    label: "Total outstanding",
    value: "€64,200",
    hint: "Open receivables across all clients",
  },
  {
    id: "overdue",
    label: "Overdue",
    value: "€18,400",
    hint: "Past agreed payment terms",
  },
  {
    id: "due-soon",
    label: "Due within 14 days",
    value: "€22,800",
    hint: "Expected cash inflow",
  },
  {
    id: "accounts",
    label: "Open accounts",
    value: "7",
    hint: "Clients with unpaid invoices",
  },
];

export const CREDITORS_KPIS: LedgerKpi[] = [
  {
    id: "total-outstanding",
    label: "Total outstanding",
    value: "€41,650",
    hint: "Open payables to suppliers",
  },
  {
    id: "overdue",
    label: "Overdue",
    value: "€9,200",
    hint: "Requires immediate settlement",
  },
  {
    id: "due-soon",
    label: "Due within 14 days",
    value: "€16,450",
    hint: "Scheduled outflows",
  },
  {
    id: "accounts",
    label: "Open accounts",
    value: "11",
    hint: "Suppliers awaiting payment",
  },
];

export const DEBTORS_AGING_DATA: LedgerAgingBucket[] = [
  { bucket: "0–30 days", amount: 28.5, fill: "#38bdf8" },
  { bucket: "31–60 days", amount: 17.2, fill: "#34d399" },
  { bucket: "61–90 days", amount: 10.1, fill: "#fbbf24" },
  { bucket: "90+ days", amount: 8.4, fill: "#f87171" },
];

export const CREDITORS_AGING_DATA: LedgerAgingBucket[] = [
  { bucket: "0–30 days", amount: 19.8, fill: "#a78bfa" },
  { bucket: "31–60 days", amount: 12.4, fill: "#38bdf8" },
  { bucket: "61–90 days", amount: 6.2, fill: "#fbbf24" },
  { bucket: "90+ days", amount: 3.25, fill: "#f87171" },
];

export const DEBTORS_ACCOUNTS: LedgerAccountRow[] = [
  {
    id: "deb-1",
    name: "Venturi Aeronautical",
    reference: "INV-2026-0412",
    outstanding: 22400,
    dueDate: "2026-06-28",
    daysOverdue: 0,
    status: "due_soon",
  },
  {
    id: "deb-2",
    name: "Catalonia Energy Partners",
    reference: "INV-2026-0388",
    outstanding: 14800,
    dueDate: "2026-06-10",
    daysOverdue: 7,
    status: "overdue",
  },
  {
    id: "deb-3",
    name: "Douro Maritime Logistics",
    reference: "INV-2026-0355",
    outstanding: 9600,
    dueDate: "2026-07-05",
    daysOverdue: 0,
    status: "current",
  },
  {
    id: "deb-4",
    name: "Westport Logistics Hub",
    reference: "INV-2026-0321",
    outstanding: 11200,
    dueDate: "2026-05-22",
    daysOverdue: 26,
    status: "overdue",
  },
  {
    id: "deb-5",
    name: "Oxford Heritage Survey Ltd",
    reference: "INV-2026-0299",
    outstanding: 6200,
    dueDate: "2026-07-12",
    daysOverdue: 0,
    status: "current",
  },
];

export const CREDITORS_ACCOUNTS: LedgerAccountRow[] = [
  {
    id: "cred-1",
    name: "DJI Enterprise Europe",
    reference: "PO-88421",
    outstanding: 12450,
    dueDate: "2026-06-25",
    daysOverdue: 0,
    status: "due_soon",
  },
  {
    id: "cred-2",
    name: "Iberia Insurance Brokers",
    reference: "POL-2026-Q2",
    outstanding: 6800,
    dueDate: "2026-06-08",
    daysOverdue: 9,
    status: "overdue",
  },
  {
    id: "cred-3",
    name: "Barcelona Office Leasing SL",
    reference: "RENT-JUN-26",
    outstanding: 9200,
    dueDate: "2026-07-01",
    daysOverdue: 0,
    status: "current",
  },
  {
    id: "cred-4",
    name: "Telefónica Business",
    reference: "TEL-442901",
    outstanding: 2400,
    dueDate: "2026-06-30",
    daysOverdue: 0,
    status: "due_soon",
  },
  {
    id: "cred-5",
    name: "Fleet Fuel Catalonia",
    reference: "FUEL-W23",
    outstanding: 3850,
    dueDate: "2026-05-30",
    daysOverdue: 18,
    status: "overdue",
  },
  {
    id: "cred-6",
    name: "WebODM Cloud Services",
    reference: "SUB-2026-H1",
    outstanding: 1950,
    dueDate: "2026-07-15",
    daysOverdue: 0,
    status: "current",
  },
];

export const DEBTORS_MONTHLY_TREND: LedgerMonthlyPoint[] = [
  { month: "Jan", outstanding: 52, settled: 38 },
  { month: "Feb", outstanding: 48, settled: 44 },
  { month: "Mar", outstanding: 55, settled: 41 },
  { month: "Apr", outstanding: 61, settled: 47 },
  { month: "May", outstanding: 58, settled: 52 },
  { month: "Jun", outstanding: 64, settled: 49 },
];

export const CREDITORS_MONTHLY_TREND: LedgerMonthlyPoint[] = [
  { month: "Jan", outstanding: 36, settled: 32 },
  { month: "Feb", outstanding: 34, settled: 35 },
  { month: "Mar", outstanding: 39, settled: 33 },
  { month: "Apr", outstanding: 42, settled: 38 },
  { month: "May", outstanding: 40, settled: 41 },
  { month: "Jun", outstanding: 42, settled: 37 },
];

export function formatLedgerCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLedgerDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function ledgerStatusLabel(status: LedgerAccountRow["status"]) {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    default:
      return "Current";
  }
}

export function ledgerStatusClass(status: LedgerAccountRow["status"]) {
  switch (status) {
    case "overdue":
      return "border-red-400/40 bg-red-500/15 text-red-200";
    case "due_soon":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    default:
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  }
}
