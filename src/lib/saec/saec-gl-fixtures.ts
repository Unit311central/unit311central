/**
 * SAEC General Ledger / expenses API fixtures (ZAR).
 * Used when live GL tables are empty for the SAEC workspace.
 */

import type { JournalEntry, LedgerAccount, TrialBalanceRow } from "@/lib/accounting/types";
import type { FinancialExpense } from "@/lib/expenses-data";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";
import {
  SAEC_ACCOUNTS_PAYABLE_ZAR,
  SAEC_ACCOUNTS_RECEIVABLE_ZAR,
  SAEC_CASH_BALANCE_ZAR,
  SAEC_MONTHLY_OUTGOINGS_SERIES,
  SAEC_MONTHLY_REVENUE_SERIES,
  SAEC_REVENUE_YTD_ZAR,
} from "@/lib/saec/saec-financials";

const CURRENCY = SAEC_REPORTING_CURRENCY;
const NOW = "2026-08-16T10:00:00.000Z";

export function getSaecJournalEntries(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const point of SAEC_MONTHLY_REVENUE_SERIES) {
    const month = point.month;
    const revenue = point.amount;
    const opex =
      SAEC_MONTHLY_OUTGOINGS_SERIES.find((row) => row.month === month)?.amount ?? 5_100_000;
    const payroll = Math.round(opex * 0.42);
    entries.push({
      id: `saec-je-rev-${month}`,
      reference: `REV-${month}`,
      description: `${month} installation & maintenance revenue (ZAR)`,
      clientId: null,
      sourceType: "invoice_issue",
      sourceId: `saec-rev-${month}`,
      status: "posted",
      journalDate: `${month}-01`,
      postedAt: `${month}-01T09:00:00.000Z`,
      createdAt: `${month}-01T09:00:00.000Z`,
      lines: [],
      debitTotal: revenue,
      creditTotal: revenue,
    });
    entries.push({
      id: `saec-je-opex-${month}`,
      reference: `OPEX-${month}`,
      description: `${month} field operations & fleet opex accrual`,
      clientId: null,
      sourceType: "expense",
      sourceId: `saec-opex-${month}`,
      status: "posted",
      journalDate: `${month}-28`,
      postedAt: `${month}-28T09:00:00.000Z`,
      createdAt: `${month}-28T09:00:00.000Z`,
      lines: [],
      debitTotal: opex,
      creditTotal: opex,
    });
    entries.push({
      id: `saec-je-pay-${month}`,
      reference: `PAY-${month}`,
      description: `${month} payroll accrual — national engineering teams`,
      clientId: null,
      sourceType: "payroll",
      sourceId: `saec-pay-${month}`,
      status: "posted",
      journalDate: `${month}-28`,
      postedAt: `${month}-28T09:00:00.000Z`,
      createdAt: `${month}-28T09:00:00.000Z`,
      lines: [],
      debitTotal: payroll,
      creditTotal: payroll,
    });
  }
  return entries;
}

export function getSaecLedgerAccounts(): LedgerAccount[] {
  const opexTotal = SAEC_MONTHLY_OUTGOINGS_SERIES.reduce((sum, row) => sum + row.amount, 0);
  const accounts: Array<{
    code: string;
    name: string;
    type: LedgerAccount["type"];
    balance: number;
  }> = [
    { code: "1000", name: "Operating cash ZAR", type: "asset", balance: SAEC_CASH_BALANCE_ZAR },
    { code: "1030", name: "Accounts receivable", type: "asset", balance: SAEC_ACCOUNTS_RECEIVABLE_ZAR },
    { code: "2000", name: "Accounts payable", type: "liability", balance: SAEC_ACCOUNTS_PAYABLE_ZAR },
    { code: "3000", name: "Share capital", type: "equity", balance: 18_000_000 },
    { code: "3010", name: "Retained earnings", type: "equity", balance: 42_600_000 },
    { code: "4000", name: "Installation revenue", type: "income", balance: Math.round(SAEC_REVENUE_YTD_ZAR * 0.62) },
    { code: "4010", name: "Maintenance revenue", type: "income", balance: Math.round(SAEC_REVENUE_YTD_ZAR * 0.38) },
    { code: "5020", name: "Payroll", type: "expense", balance: Math.round(opexTotal * 0.42) },
    { code: "5010", name: "Software & cloud", type: "expense", balance: Math.round(opexTotal * 0.08) },
    { code: "5030", name: "Fleet & logistics", type: "expense", balance: Math.round(opexTotal * 0.18) },
    { code: "5040", name: "Parts & components", type: "expense", balance: Math.round(opexTotal * 0.22) },
    { code: "5050", name: "Travel & site visits", type: "expense", balance: Math.round(opexTotal * 0.06) },
    { code: "5060", name: "Facilities", type: "expense", balance: Math.round(opexTotal * 0.04) },
  ];
  return accounts.map((row, index) => ({
    id: `saec-gl-${row.code}`,
    code: row.code,
    name: row.name,
    type: row.type,
    balance: row.balance,
    currency: CURRENCY,
    isActive: true,
    transactionCount: 4 + (index % 6),
  }));
}

export function getSaecTrialBalance(): TrialBalanceRow[] {
  return getSaecLedgerAccounts().map((account) => ({
    accountId: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    debit:
      account.type === "expense" || account.type === "asset" ? account.balance : 0,
    credit:
      account.type === "income" || account.type === "liability" || account.type === "equity"
        ? account.balance
        : 0,
    runningBalance: account.balance,
  }));
}

export function getSaecExpenses(): FinancialExpense[] {
  const rows: Array<Omit<FinancialExpense, "id" | "createdAt" | "updatedAt">> = [
    {
      submitterUserId: "saec-admin",
      submitterName: "Dewald Lassen",
      purposeDescription: "Gauteng service fleet fuel — August",
      description: "Gauteng service fleet fuel — August",
      amount: 185_000,
      currency: "ZAR",
      dateSubmitted: "2026-08-12",
      paid: false,
      supplier: "Engen Fleet Card",
      categoryAccountCode: "5030",
      expenseDate: "2026-08-12",
      paymentMethod: "EFT",
      reference: "OMT-EXP-2408-01",
      attachmentPath: null,
      recordStatus: "finalized",
      reimbursable: false,
      journalEntryId: "saec-je-exp-fuel",
      paymentJournalEntryId: null,
      workflowStatus: "approved",
      claimantEmployeeId: null,
      expenseCategoryId: null,
      billingCodeId: null,
      expenseRunId: null,
      expenseNumber: "EXP-2408-01",
      submittedAt: "2026-08-12T08:00:00.000Z",
      approvedAt: "2026-08-13T10:00:00.000Z",
      paidAt: null,
      expectedPaymentDate: "2026-08-28",
      expenseType: "standard",
      mileageFrom: null,
      mileageTo: null,
      mileageDistance: null,
      mileageDistanceUnit: null,
      mileageRate: null,
      mileageCalculatedAmount: null,
      wiseBalanceId: null,
    },
    {
      submitterUserId: "saec-admin",
      submitterName: "Linda van Wyk",
      purposeDescription: "Centurion Mall site accommodation",
      description: "Centurion Mall install team accommodation",
      amount: 42_500,
      currency: "ZAR",
      dateSubmitted: "2026-08-08",
      paid: true,
      supplier: "Protea Hotels",
      categoryAccountCode: "5050",
      expenseDate: "2026-08-08",
      paymentMethod: "Card",
      reference: "OMT-EXP-2408-02",
      attachmentPath: null,
      recordStatus: "finalized",
      reimbursable: false,
      journalEntryId: "saec-je-exp-travel",
      paymentJournalEntryId: "saec-je-pay-travel",
      workflowStatus: "paid",
      claimantEmployeeId: null,
      expenseCategoryId: null,
      billingCodeId: null,
      expenseRunId: null,
      expenseNumber: "EXP-2408-02",
      submittedAt: "2026-08-08T07:30:00.000Z",
      approvedAt: "2026-08-08T14:00:00.000Z",
      paidAt: "2026-08-10T09:00:00.000Z",
      expectedPaymentDate: "2026-08-10",
      expenseType: "standard",
      mileageFrom: null,
      mileageTo: null,
      mileageDistance: null,
      mileageDistanceUnit: null,
      mileageRate: null,
      mileageCalculatedAmount: null,
      wiseBalanceId: null,
    },
    {
      submitterUserId: "saec-admin",
      submitterName: "Tshepo Modise",
      purposeDescription: "Door operator spare parts — Brooklyn Mall",
      description: "Door operator spare parts — Brooklyn Mall",
      amount: 128_400,
      currency: "ZAR",
      dateSubmitted: "2026-08-05",
      paid: false,
      supplier: "Elevate Components SA",
      categoryAccountCode: "5040",
      expenseDate: "2026-08-05",
      paymentMethod: "EFT",
      reference: "OMT-EXP-2408-03",
      attachmentPath: null,
      recordStatus: "finalized",
      reimbursable: false,
      journalEntryId: null,
      paymentJournalEntryId: null,
      workflowStatus: "submitted",
      claimantEmployeeId: null,
      expenseCategoryId: null,
      billingCodeId: null,
      expenseRunId: null,
      expenseNumber: "EXP-2408-03",
      submittedAt: "2026-08-05T11:00:00.000Z",
      approvedAt: null,
      paidAt: null,
      expectedPaymentDate: "2026-08-25",
      expenseType: "standard",
      mileageFrom: null,
      mileageTo: null,
      mileageDistance: null,
      mileageDistanceUnit: null,
      mileageRate: null,
      mileageCalculatedAmount: null,
      wiseBalanceId: null,
    },
    {
      submitterUserId: "saec-admin",
      submitterName: "Riaan Pretorius",
      purposeDescription: "Microsoft 365 engineering licences",
      description: "Microsoft 365 engineering licences — Q3",
      amount: 96_800,
      currency: "ZAR",
      dateSubmitted: "2026-07-28",
      paid: true,
      supplier: "Microsoft",
      categoryAccountCode: "5010",
      expenseDate: "2026-07-28",
      paymentMethod: "Card",
      reference: "OMT-EXP-2407-04",
      attachmentPath: null,
      recordStatus: "finalized",
      reimbursable: false,
      journalEntryId: "saec-je-exp-m365",
      paymentJournalEntryId: "saec-je-pay-m365",
      workflowStatus: "paid",
      claimantEmployeeId: null,
      expenseCategoryId: null,
      billingCodeId: null,
      expenseRunId: null,
      expenseNumber: "EXP-2407-04",
      submittedAt: "2026-07-28T09:00:00.000Z",
      approvedAt: "2026-07-29T10:00:00.000Z",
      paidAt: "2026-08-01T09:00:00.000Z",
      expectedPaymentDate: "2026-08-01",
      expenseType: "standard",
      mileageFrom: null,
      mileageTo: null,
      mileageDistance: null,
      mileageDistanceUnit: null,
      mileageRate: null,
      mileageCalculatedAmount: null,
      wiseBalanceId: null,
    },
    {
      submitterUserId: "saec-admin",
      submitterName: "Annelize Fourie",
      purposeDescription: "Cape Town site mileage — V&A programme",
      description: "Cape Town site mileage — V&A Waterfront programme",
      amount: 18_600,
      currency: "ZAR",
      dateSubmitted: "2026-07-22",
      paid: true,
      supplier: null,
      categoryAccountCode: "5050",
      expenseDate: "2026-07-22",
      paymentMethod: "EFT",
      reference: "OMT-EXP-2407-05",
      attachmentPath: null,
      recordStatus: "finalized",
      reimbursable: true,
      journalEntryId: "saec-je-exp-mileage",
      paymentJournalEntryId: "saec-je-pay-mileage",
      workflowStatus: "paid",
      claimantEmployeeId: "hr-24c00153",
      expenseCategoryId: null,
      billingCodeId: null,
      expenseRunId: null,
      expenseNumber: "EXP-2407-05",
      submittedAt: "2026-07-22T16:00:00.000Z",
      approvedAt: "2026-07-23T09:00:00.000Z",
      paidAt: "2026-07-25T09:00:00.000Z",
      expectedPaymentDate: "2026-07-25",
      expenseType: "mileage",
      mileageFrom: "Johannesburg HQ",
      mileageTo: "Cape Town V&A",
      mileageDistance: 1400,
      mileageDistanceUnit: "kilometres",
      mileageRate: 3.2,
      mileageCalculatedAmount: 18_600,
      wiseBalanceId: null,
    },
  ];

  return rows.map((row, index) => ({
    ...row,
    id: `saec-exp-${index + 1}`,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}
