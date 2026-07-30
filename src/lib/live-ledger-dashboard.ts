/**
 * Live Debtors / Creditors ledger views from workspace invoices & expenses.
 */

import { convertToGbp } from "@/lib/treasury/treasury-utils";
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

import { withPreferredCurrencySymbol } from "@/lib/accounting/chart-of-accounts";

const REPORTING_CURRENCY = "GBP";

function money(amount: number, currency = REPORTING_CURRENCY) {
  const code = String(currency || REPORTING_CURRENCY).toUpperCase();
  return withPreferredCurrencySymbol(
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount),
    code,
  );
}

function invoiceGbp(invoice: InvoiceLike) {
  return convertToGbp(Number(invoice.amount) || 0, invoice.currency || REPORTING_CURRENCY);
}

function expenseGbp(expense: ExpenseLike) {
  return convertToGbp(Number(expense.amount) || 0, expense.currency || REPORTING_CURRENCY);
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
  const total = open.reduce((s, inv) => s + invoiceGbp(inv), 0);
  const overdueTotal = overdue.reduce((s, inv) => s + invoiceGbp(inv), 0);
  const dueSoonTotal = dueSoon.reduce((s, inv) => s + invoiceGbp(inv), 0);
  const currency = REPORTING_CURRENCY;

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
    const amountK = invoiceGbp(inv) / 1000;
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
      outstanding: invoiceGbp(inv),
      dueDate: inv.dueDate || inv.issueDate || "",
      daysOverdue: Math.max(0, days),
      status: days > 0 ? "overdue" : days >= -14 ? "due_soon" : "current",
    };
  });

  const monthlyMap = new Map<string, LedgerMonthlyPoint>();
  for (const inv of invoices) {
    const key = (inv.issueDate || "").slice(0, 7) || "unknown";
    const point = monthlyMap.get(key) || { month: key, outstanding: 0, settled: 0 };
    const gbpK = invoiceGbp(inv) / 1000;
    if (["paid"].includes(String(inv.status).toLowerCase())) {
      point.settled += gbpK;
    } else if (["issued", "overdue"].includes(String(inv.status).toLowerCase())) {
      point.outstanding += gbpK;
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
  const total = open.reduce((s, exp) => s + expenseGbp(exp), 0);
  const currency = REPORTING_CURRENCY;
  const dated = open.map((exp) => {
    const date = exp.expenseDate || exp.dateSubmitted || "";
    const days = date ? daysBetween(date) : 0;
    return { exp, days };
  });
  const overdue = dated.filter((row) => row.days > 30);
  const dueSoon = dated.filter((row) => row.days > 0 && row.days <= 14);
  const overdueTotal = overdue.reduce((s, row) => s + expenseGbp(row.exp), 0);
  const dueSoonTotal = dueSoon.reduce((s, row) => s + expenseGbp(row.exp), 0);

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
    const amountK = expenseGbp(row.exp) / 1000;
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
    outstanding: expenseGbp(exp),
    dueDate: exp.expenseDate || exp.dateSubmitted || "",
    daysOverdue: Math.max(0, days),
    status: days > 30 ? "overdue" : days > 0 ? "due_soon" : "current",
  }));

  const monthlyMap = new Map<string, LedgerMonthlyPoint>();
  for (const exp of expenses) {
    const key = (exp.expenseDate || exp.dateSubmitted || "").slice(0, 7) || "unknown";
    const point = monthlyMap.get(key) || { month: key, outstanding: 0, settled: 0 };
    const gbpK = expenseGbp(exp) / 1000;
    if (exp.paid) point.settled += gbpK;
    else point.outstanding += gbpK;
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
