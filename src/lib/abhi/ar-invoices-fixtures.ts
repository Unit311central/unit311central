/**
 * ABHI Accounts Receivable fixtures — membership invoices aligned with board pack.
 * Three overdue SME invoices totalling £18k; recent paid renewals for collection KPIs.
 */

import type { LedgerInvoice } from "@/lib/accounting/types";
import { ABHI_MEMBERSHIP_FEE_GBP } from "@/lib/abhi-billing";
import { ABHI_ACCOUNTS_RECEIVABLE_GBP } from "@/lib/abhi-financials";

const OVERDUE_INVOICE_AMOUNT_GBP = ABHI_ACCOUNTS_RECEIVABLE_GBP / 3;

const PAID_MEMBERS: { clientId: string; clientName: string; issueDate: string; paidAt: string }[] =
  [
    {
      clientId: "abhi-cli-medcore",
      clientName: "MedCore Partners",
      issueDate: "2026-07-01",
      paidAt: "2026-07-18T10:00:00.000Z",
    },
    {
      clientId: "abhi-cli-helix",
      clientName: "Helix Diagnostics",
      issueDate: "2026-07-05",
      paidAt: "2026-07-22T14:30:00.000Z",
    },
    {
      clientId: "abhi-cli-northstar",
      clientName: "Northstar Telehealth",
      issueDate: "2026-07-10",
      paidAt: "2026-08-02T09:15:00.000Z",
    },
    {
      clientId: "abhi-cli-mercia",
      clientName: "Mercia Robotics Health",
      issueDate: "2026-07-12",
      paidAt: "2026-08-05T11:00:00.000Z",
    },
    {
      clientId: "abhi-cli-blackthorn",
      clientName: "Blackthorn Biosciences",
      issueDate: "2026-07-15",
      paidAt: "2026-08-06T16:45:00.000Z",
    },
    {
      clientId: "abhi-cli-avon",
      clientName: "Avon Vale MedTech",
      issueDate: "2026-06-20",
      paidAt: "2026-07-08T08:30:00.000Z",
    },
    {
      clientId: "abhi-cli-stryker",
      clientName: "Stryker UK Ltd",
      issueDate: "2026-06-25",
      paidAt: "2026-07-12T13:20:00.000Z",
    },
    {
      clientId: "abhi-cli-suntech",
      clientName: "SunTech Medical",
      issueDate: "2026-06-28",
      paidAt: "2026-07-14T10:05:00.000Z",
    },
    {
      clientId: "abhi-cli-surgical",
      clientName: "Surgical Holdings",
      issueDate: "2026-05-18",
      paidAt: "2026-06-04T15:00:00.000Z",
    },
    {
      clientId: "abhi-cli-surtex",
      clientName: "Surtex Instruments Ltd",
      issueDate: "2026-05-22",
      paidAt: "2026-06-09T09:40:00.000Z",
    },
    {
      clientId: "abhi-cli-swann",
      clientName: "Swann-Morton Ltd",
      issueDate: "2026-05-30",
      paidAt: "2026-06-15T12:10:00.000Z",
    },
    {
      clientId: "abhi-cli-tandem",
      clientName: "Tandem Diabetes UK Limited",
      issueDate: "2026-06-02",
      paidAt: "2026-06-18T11:25:00.000Z",
    },
  ];

const OVERDUE_SME_INVOICES: {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
}[] = [
  {
    id: "abhi-ar-overdue-1",
    invoiceNumber: "ABHI-AR-201",
    clientId: "abhi-cli-lumina",
    clientName: "Lumina Diagnostics Ltd",
    issueDate: "2026-04-12",
    dueDate: "2026-05-28",
  },
  {
    id: "abhi-ar-overdue-2",
    invoiceNumber: "ABHI-AR-202",
    clientId: "abhi-cli-orthotech",
    clientName: "OrthoTech UK Ltd",
    issueDate: "2026-04-28",
    dueDate: "2026-06-12",
  },
  {
    id: "abhi-ar-overdue-3",
    invoiceNumber: "ABHI-AR-203",
    clientId: "abhi-cli-solent",
    clientName: "Solent Diagnostics",
    issueDate: "2026-05-15",
    dueDate: "2026-06-30",
  },
];

function fixtureTimestamp(isoDate: string) {
  return `${isoDate}T09:00:00.000Z`;
}

/** Canonical ABHI AR list — replaces platform GL invoice noise on the ABHI workspace. */
export function listAbhiFixtureInvoices(): LedgerInvoice[] {
  const now = new Date().toISOString();
  const paid: LedgerInvoice[] = PAID_MEMBERS.map((row, index) => ({
    id: `abhi-ar-paid-${index + 1}`,
    invoiceNumber: `ABHI-AR-${String(120 + index).padStart(3, "0")}`,
    clientId: row.clientId,
    clientName: row.clientName,
    organisationId: null,
    workspaceId: null,
    issueDate: row.issueDate,
    dueDate: row.issueDate,
    currency: "GBP",
    amount: ABHI_MEMBERSHIP_FEE_GBP,
    status: "paid",
    paymentReference: `INV-${120 + index}`,
    pdfPath: null,
    journalEntryId: `abhi-je-ar-paid-${index + 1}`,
    paymentJournalEntryId: `abhi-je-ar-paid-pay-${index + 1}`,
    paymentMethod: "bank_transfer",
    wiseMatched: false,
    wiseMatchedAt: null,
    wiseTransactionId: null,
    paidAt: row.paidAt,
    createdAt: fixtureTimestamp(row.issueDate),
    updatedAt: row.paidAt,
  }));

  const overdue: LedgerInvoice[] = OVERDUE_SME_INVOICES.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    clientId: row.clientId,
    clientName: row.clientName,
    organisationId: null,
    workspaceId: null,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    currency: "GBP",
    amount: OVERDUE_INVOICE_AMOUNT_GBP,
    status: "overdue",
    paymentReference: row.invoiceNumber.replace("ABHI-AR-", "INV-"),
    pdfPath: null,
    journalEntryId: `abhi-je-${row.id}`,
    paymentJournalEntryId: null,
    paymentMethod: null,
    wiseMatched: false,
    wiseMatchedAt: null,
    wiseTransactionId: null,
    paidAt: null,
    createdAt: fixtureTimestamp(row.issueDate),
    updatedAt: now,
  }));

  return [...overdue, ...paid].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}
