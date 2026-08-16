/**
 * Northstar Demo — AR/AP supplier fixtures aligned with Financials KPI tiles (£420k AR, £186k AP).
 */

import type { LedgerInvoice } from "@/lib/accounting/types";
import {
  NORTHSTAR_AP_DUE_NOW,
  NORTHSTAR_AP_DUE_WITHIN_MONTH,
  NORTHSTAR_AP_OUTSTANDING,
  NORTHSTAR_HMRC_ACCOUNTS_DUE,
  NORTHSTAR_VAT_DUE_DATE,
  NORTHSTAR_VAT_ESTIMATED_UPCOMING,
  NORTHSTAR_VAT_LAST_PAID,
  NORTHSTAR_VAT_LAST_PAID_DATE,
} from "@/lib/demo/northstar-financial-model";

const WS = "demo-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

export type NorthstarPayableCategory = "payroll" | "opex" | "expense";

export type NorthstarPayableRow = {
  id: string;
  supplier: string;
  description: string;
  amount: number;
  currency: "GBP";
  dueDate: string;
  paid: boolean;
  category: NorthstarPayableCategory;
  reference: string | null;
  journalEntryId: string | null;
  paymentJournalEntryId: string | null;
};

const CLIENT_NAMES = [
  "Sheffield Precision Engineering",
  "Peak District Breweries",
  "Bristol Composites Ltd",
  "Manchester Packaging Group",
  "Leeds Forge & Tooling",
  "Nottingham Food Systems",
  "Cardiff Port Logistics",
  "Glasgow Precision Motors",
  "Liverpool Dock Automation",
  "Newcastle Energy Components",
  "Birmingham Alloy Works",
  "Trafford Park Robotics",
];

let cachedInvoices: LedgerInvoice[] | null = null;
let cachedPayables: NorthstarPayableRow[] | null = null;

function buildNorthstarInvoices(): LedgerInvoice[] {
  const invoices: LedgerInvoice[] = [];
  const openAmounts = [
    38_500, 36_200, 35_800, 35_500, 35_000, 34_800, 34_500, 34_200, 33_500, 33_000, 32_500, 31_500,
  ];
  const openTotal = openAmounts.reduce((sum, value) => sum + value, 0);
  if (openTotal !== 420_000) {
    openAmounts[openAmounts.length - 1]! += 420_000 - openTotal;
  }

  openAmounts.forEach((amount, index) => {
    const clientName = CLIENT_NAMES[index % CLIENT_NAMES.length]!;
    const clientId = `nst-cli-${String(index + 1).padStart(3, "0")}`;
    const overdue = index < 2;
    invoices.push({
      id: `nst-inv-open-${index + 1}`,
      invoiceNumber: `NST-2026-${String(840 - index).padStart(4, "0")}`,
      clientId,
      clientName,
      organisationId: null,
      workspaceId: WS,
      issueDate: overdue ? "2026-07-01" : "2026-08-01",
      dueDate: overdue ? "2026-07-31" : "2026-08-31",
      currency: "GBP",
      amount,
      status: overdue ? "overdue" : "issued",
      paymentReference: "",
      pdfPath: null,
      journalEntryId: `nst-je-rev-2026-08`,
      paymentJournalEntryId: null,
      paymentMethod: null,
      wiseMatched: false,
      wiseMatchedAt: null,
      wiseTransactionId: null,
      paidAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  for (let month = 1; month <= 7; month += 1) {
    const monthKey = String(month).padStart(2, "0");
    for (let i = 0; i < 4; i += 1) {
      const idx = (month + i) % CLIENT_NAMES.length;
      invoices.push({
        id: `nst-inv-paid-${monthKey}-${i}`,
        invoiceNumber: `NST-2026-${String(700 + month * 10 + i).padStart(4, "0")}`,
        clientId: `nst-cli-${String(idx + 1).padStart(3, "0")}`,
        clientName: CLIENT_NAMES[idx]!,
        organisationId: null,
        workspaceId: WS,
        issueDate: `2026-${monthKey}-01`,
        dueDate: `2026-${monthKey}-28`,
        currency: "GBP",
        amount: 4_200 + month * 180 + i * 90,
        status: "paid",
        paymentReference: `WISE-${88000 + month * 10 + i}`,
        pdfPath: null,
        journalEntryId: `nst-je-rev-2026-${monthKey}`,
        paymentJournalEntryId: `nst-je-pay-${monthKey}-${i}`,
        paymentMethod: "Wise",
        wiseMatched: true,
        wiseMatchedAt: `2026-${monthKey}-26T11:00:00.000Z`,
        wiseTransactionId: `wise-tx-${88000 + month * 10 + i}`,
        paidAt: `2026-${monthKey}-26T11:00:00.000Z`,
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
  }

  return invoices.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

function buildNorthstarPayables(): NorthstarPayableRow[] {
  const rows: NorthstarPayableRow[] = [
    {
      id: "nst-ap-payroll-aug",
      supplier: "HMRC PAYE / Payroll",
      description: "August payroll accrual — 25 employees",
      amount: 118_000,
      currency: "GBP",
      dueDate: "2026-08-28",
      paid: false,
      category: "payroll",
      reference: "PAY-AUG-2026",
      journalEntryId: "nst-je-pay-2026-08",
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-payroll-partial",
      supplier: "Pension & benefits",
      description: "NEST pension + private medical",
      amount: 14_200,
      currency: "GBP",
      dueDate: "2026-08-20",
      paid: false,
      category: "payroll",
      reference: "BEN-AUG-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-aws",
      supplier: "Amazon Web Services",
      description: "Cloud infrastructure — August invoice",
      amount: 42_000,
      currency: "GBP",
      dueDate: "2026-08-25",
      paid: false,
      category: "opex",
      reference: "AWS-AUG-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-wework",
      supplier: "WeWork Manchester",
      description: "Manchester HQ rent — August",
      amount: 21_600,
      currency: "GBP",
      dueDate: "2026-08-18",
      paid: false,
      category: "opex",
      reference: "RENT-AUG-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-google",
      supplier: "Google Ads",
      description: "Demand generation — August",
      amount: 12_400,
      currency: "GBP",
      dueDate: "2026-09-05",
      paid: false,
      category: "opex",
      reference: "ADS-AUG-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-deloitte",
      supplier: "Deloitte LLP",
      description: "Audit & advisory — Q2 fees",
      amount: 16_000,
      currency: "GBP",
      dueDate: "2026-09-12",
      paid: false,
      category: "opex",
      reference: "AUD-Q2-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-atlassian",
      supplier: "Atlassian / Slack",
      description: "Team productivity stack — annual true-up",
      amount: 9_800,
      currency: "GBP",
      dueDate: "2026-09-08",
      paid: false,
      category: "opex",
      reference: "SAAS-AUG-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-voltex",
      supplier: "Voltex Automation UK",
      description: "Edge controller components — PO 4412",
      amount: 12_400,
      currency: "GBP",
      dueDate: "2026-09-15",
      paid: false,
      category: "expense",
      reference: "PO-VX-4412",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-travel",
      supplier: "Trainline / Premier Inn",
      description: "Sheffield site visits — consolidated T&E",
      amount: 4_860,
      currency: "GBP",
      dueDate: "2026-09-10",
      paid: false,
      category: "expense",
      reference: "TRV-SHF-0810",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
    {
      id: "nst-ap-rs",
      supplier: "RS Components",
      description: "Lab hardware consumables",
      amount: 3_740,
      currency: "GBP",
      dueDate: "2026-09-14",
      paid: false,
      category: "expense",
      reference: "RS-AUG-2026",
      journalEntryId: null,
      paymentJournalEntryId: null,
    },
  ];

  const total = rows.filter((row) => !row.paid).reduce((sum, row) => sum + row.amount, 0);
  const scale = NORTHSTAR_AP_OUTSTANDING / total;
  return rows.map((row) => ({
    ...row,
    amount: Math.round(row.amount * scale),
  }));
}

export function getNorthstarInvoices(): LedgerInvoice[] {
  if (!cachedInvoices) cachedInvoices = buildNorthstarInvoices();
  return cachedInvoices;
}

export function getNorthstarPayables(): NorthstarPayableRow[] {
  if (!cachedPayables) cachedPayables = buildNorthstarPayables();
  return cachedPayables;
}

export function summarizeNorthstarReceivables(invoices: LedgerInvoice[]) {
  const today = "2026-08-16";
  const unpaid = invoices.filter((inv) => inv.status === "issued" || inv.status === "overdue");
  const outstanding = unpaid.reduce((sum, inv) => sum + inv.amount, 0);
  const overdue = unpaid
    .filter((inv) => inv.dueDate < today)
    .reduce((sum, inv) => sum + inv.amount, 0);
  const dueSoon = unpaid
    .filter((inv) => inv.dueDate >= today && inv.dueDate <= "2026-08-31")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const current = outstanding - overdue - dueSoon;
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;
  return {
    outstanding,
    overdue,
    overdueCount: unpaid.filter((inv) => inv.dueDate < today).length,
    dueSoon,
    collectionRate: invoices.length ? Math.round((paidCount / invoices.length) * 100) : 0,
    outstandingInvoices: unpaid.length,
    ageing: [
      { bucket: "Current", amount: Math.max(0, current) },
      { bucket: "1–30 days", amount: dueSoon },
      { bucket: "31–60 days", amount: overdue },
      { bucket: "61+ days", amount: 0 },
    ],
    recentUnpaid: unpaid.slice(0, 8),
    activeClients: 85,
    avgMonthlyPerClient: Math.round(400_000 / 85),
  };
}

export function summarizeNorthstarPayables(payables: NorthstarPayableRow[]) {
  const today = "2026-08-16";
  const monthEnd = "2026-08-31";
  const unpaid = payables.filter((row) => !row.paid);
  const outstanding = unpaid.reduce((sum, row) => sum + row.amount, 0);
  const dueNow = unpaid
    .filter((row) => row.dueDate <= monthEnd)
    .reduce((sum, row) => sum + row.amount, 0);
  const upcoming = unpaid
    .filter((row) => row.dueDate > monthEnd)
    .reduce((sum, row) => sum + row.amount, 0);

  const scaleNow = dueNow > 0 ? NORTHSTAR_AP_DUE_NOW / dueNow : 1;
  const scaleUp = upcoming > 0 ? NORTHSTAR_AP_DUE_WITHIN_MONTH / upcoming : 1;

  return {
    outstanding: NORTHSTAR_AP_OUTSTANDING,
    dueThisMonth: NORTHSTAR_AP_DUE_NOW,
    overdue: unpaid.filter((row) => row.dueDate < today).reduce((sum, row) => sum + row.amount, 0),
    upcoming: NORTHSTAR_AP_DUE_WITHIN_MONTH,
    recent: unpaid.slice(0, 8).map((row) => ({
      id: row.id,
      supplier: row.supplier,
      description: row.description,
      amount: row.dueDate <= monthEnd ? Math.round(row.amount * scaleNow) : Math.round(row.amount * scaleUp),
      currency: row.currency,
      dueDate: row.dueDate,
      paid: row.paid,
      category: row.category,
    })),
    byCategory: {
      payroll: unpaid.filter((r) => r.category === "payroll").reduce((s, r) => s + r.amount, 0),
      opex: unpaid.filter((r) => r.category === "opex").reduce((s, r) => s + r.amount, 0),
      expense: unpaid.filter((r) => r.category === "expense").reduce((s, r) => s + r.amount, 0),
    },
  };
}

export const NORTHSTAR_COMPLIANCE_FIXTURE = {
  vat: {
    lastPaidAmount: NORTHSTAR_VAT_LAST_PAID,
    lastPaidDate: NORTHSTAR_VAT_LAST_PAID_DATE,
    estimatedUpcoming: NORTHSTAR_VAT_ESTIMATED_UPCOMING,
    dueDate: NORTHSTAR_VAT_DUE_DATE,
  },
  hmrc: {
    annualAccountsDue: NORTHSTAR_HMRC_ACCOUNTS_DUE,
    label: "Annual accounts to Companies House / HMRC",
  },
};
