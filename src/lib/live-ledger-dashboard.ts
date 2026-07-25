/**
 * Live Debtors / Creditors ledger views from workspace invoices & expenses.
 */

import type {
  LedgerAccountRow,
  LedgerAgingBucket,
  LedgerKpi,
  LedgerMonthlyPoint,
} from "@/lib/financials-ledger-mock-data";

type InvoiceLike = {
  id: string;
  clientId?: string | null;
  clientName?: string | null;
  invoiceNumber?: string | null;
  amount: number;
  currency?: string | null;
  status: string;
  dueDate?: string | null;
  issueDate?: string | null;
};

type ExpenseLike = {
  id: string;
  supplier?: string | null;
  submitterName?: string | null;
  amount: number;
  currency?: string | null;
  paid: boolean;
  expenseDate?: string | null;
  dateSubmitted?: string | null;
};

function money(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysBetween(from: string, to = new Date()) {
  const a = new Date(from).getTime();
  const b = to.getTime();
  return Math.floor((b - a) / 86400000);
}

export function buildDebtorsLedger(invoices: InvoiceLike[]) {
  const open = invoices.filter((inv) =>
    ["issued", "overdue", "draft"].includes(String(inv.status).toLowerCase()),
  );
  const overdue = open.filter((inv) => {
    if (!inv.dueDate) return String(inv.status).toLowerCase() === "overdue";
    return daysBetween(inv.dueDate) > 0;
  });
  const dueSoon = open.filter((inv) => {
    if (!inv.dueDate) return false;
    const d = daysBetween(inv.dueDate);
    return d <= 0 && d >= -14;
  });
  const total = open.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const overdueTotal = overdue.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const dueSoonTotal = dueSoon.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const currency = open[0]?.currency || "GBP";

  const kpis: LedgerKpi[] = [
    {
      id: "total-outstanding",
      label: "Total outstanding",
      value: money(total, currency),
      hint: "Open receivables across all clients",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: money(overdueTotal, currency),
      hint: "Past agreed payment terms",
    },
    {
      id: "due-soon",
      label: "Due within 14 days",
      value: money(dueSoonTotal, currency),
      hint: "Expected cash inflow",
    },
    {
      id: "accounts",
      label: "Open accounts",
      value: String(new Set(open.map((inv) => inv.clientId || inv.invoiceNumber)).size),
      hint: "Clients with unpaid invoices",
    },
  ];

  const aging: LedgerAgingBucket[] = [
    { bucket: "Current", amount: 0, fill: "#38bdf8" },
    { bucket: "1-30", amount: 0, fill: "#818cf8" },
    { bucket: "31-60", amount: 0, fill: "#fbbf24" },
    { bucket: "61+", amount: 0, fill: "#f87171" },
  ];
  for (const inv of open) {
    const days = inv.dueDate ? Math.max(0, daysBetween(inv.dueDate)) : 0;
    const amountK = Number(inv.amount || 0) / 1000;
    if (days <= 0) aging[0].amount += amountK;
    else if (days <= 30) aging[1].amount += amountK;
    else if (days <= 60) aging[2].amount += amountK;
    else aging[3].amount += amountK;
  }
  for (const bucket of aging) bucket.amount = Number(bucket.amount.toFixed(1));

  const accounts: LedgerAccountRow[] = open.slice(0, 25).map((inv) => {
    const days = inv.dueDate ? daysBetween(inv.dueDate) : 0;
    return {
      id: inv.id,
      name: inv.clientName || inv.clientId || "Client",
      reference: inv.invoiceNumber || inv.id.slice(0, 8),
      outstanding: Number(inv.amount || 0),
      dueDate: inv.dueDate || inv.issueDate || "",
      daysOverdue: Math.max(0, days),
      status: days > 0 ? "overdue" : days >= -14 ? "due_soon" : "current",
    };
  });

  const monthlyMap = new Map<string, LedgerMonthlyPoint>();
  for (const inv of invoices) {
    const key = (inv.issueDate || "").slice(0, 7) || "unknown";
    const point = monthlyMap.get(key) || { month: key, outstanding: 0, settled: 0 };
    if (["paid"].includes(String(inv.status).toLowerCase())) {
      point.settled += Number(inv.amount || 0) / 1000;
    } else if (["issued", "overdue"].includes(String(inv.status).toLowerCase())) {
      point.outstanding += Number(inv.amount || 0) / 1000;
    }
    monthlyMap.set(key, point);
  }
  const monthly = [...monthlyMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map((p) => ({
      ...p,
      outstanding: Number(p.outstanding.toFixed(1)),
      settled: Number(p.settled.toFixed(1)),
    }));

  const tiles = kpis.map((kpi) => ({
    id: kpi.id,
    label: kpi.label,
    value: kpi.value,
    hint: kpi.hint,
  }));

  return { kpis, aging, accounts, monthly, tiles };
}

export function buildCreditorsLedger(expenses: ExpenseLike[]) {
  const open = expenses.filter((exp) => !exp.paid);
  const total = open.reduce((s, exp) => s + Number(exp.amount || 0), 0);
  const currency = open[0]?.currency || "GBP";
  const dated = open.map((exp) => {
    const date = exp.expenseDate || exp.dateSubmitted || "";
    const days = date ? daysBetween(date) : 0;
    return { exp, days };
  });
  const overdue = dated.filter((row) => row.days > 30);
  const dueSoon = dated.filter((row) => row.days > 0 && row.days <= 14);
  const overdueTotal = overdue.reduce((s, row) => s + Number(row.exp.amount || 0), 0);
  const dueSoonTotal = dueSoon.reduce((s, row) => s + Number(row.exp.amount || 0), 0);

  const kpis: LedgerKpi[] = [
    {
      id: "total-outstanding",
      label: "Total outstanding",
      value: money(total, currency),
      hint: "Open payables to suppliers",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: money(overdueTotal, currency),
      hint: "Requires immediate settlement",
    },
    {
      id: "due-soon",
      label: "Due within 14 days",
      value: money(dueSoonTotal, currency),
      hint: "Scheduled outflows",
    },
    {
      id: "accounts",
      label: "Open accounts",
      value: String(new Set(open.map((exp) => exp.supplier || exp.submitterName || exp.id)).size),
      hint: "Suppliers awaiting payment",
    },
  ];

  const aging: LedgerAgingBucket[] = [
    { bucket: "Current", amount: 0, fill: "#38bdf8" },
    { bucket: "1-30", amount: 0, fill: "#818cf8" },
    { bucket: "31-60", amount: 0, fill: "#fbbf24" },
    { bucket: "61+", amount: 0, fill: "#f87171" },
  ];
  for (const row of dated) {
    const amountK = Number(row.exp.amount || 0) / 1000;
    if (row.days <= 0) aging[0].amount += amountK;
    else if (row.days <= 30) aging[1].amount += amountK;
    else if (row.days <= 60) aging[2].amount += amountK;
    else aging[3].amount += amountK;
  }
  for (const bucket of aging) bucket.amount = Number(bucket.amount.toFixed(1));

  const accounts: LedgerAccountRow[] = dated.slice(0, 25).map(({ exp, days }) => ({
    id: exp.id,
    name: exp.supplier || exp.submitterName || "Supplier",
    reference: exp.id.slice(0, 8),
    outstanding: Number(exp.amount || 0),
    dueDate: exp.expenseDate || exp.dateSubmitted || "",
    daysOverdue: Math.max(0, days),
    status: days > 30 ? "overdue" : days > 0 ? "due_soon" : "current",
  }));

  const monthlyMap = new Map<string, LedgerMonthlyPoint>();
  for (const exp of expenses) {
    const key = (exp.expenseDate || exp.dateSubmitted || "").slice(0, 7) || "unknown";
    const point = monthlyMap.get(key) || { month: key, outstanding: 0, settled: 0 };
    if (exp.paid) point.settled += Number(exp.amount || 0) / 1000;
    else point.outstanding += Number(exp.amount || 0) / 1000;
    monthlyMap.set(key, point);
  }
  const monthly = [...monthlyMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map((p) => ({
      ...p,
      outstanding: Number(p.outstanding.toFixed(1)),
      settled: Number(p.settled.toFixed(1)),
    }));

  const tiles = kpis.map((kpi) => ({
    id: kpi.id,
    label: kpi.label,
    value: kpi.value,
    hint: kpi.hint,
  }));

  return { kpis, aging, accounts, monthly, tiles };
}
