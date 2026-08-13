/**
 * Software & SaaS dashboard model / Vercel adapter checks.
 * Run: node --import tsx src/lib/software-billing/__tests__/software-saas-dashboard.check.ts
 */
import assert from "node:assert/strict";

import { adaptVercelToProviderBillingRow } from "@/lib/software-billing/adapters/vercel-to-dashboard";
import { buildSoftwareSaasDashboard } from "@/lib/software-billing/build-software-saas-dashboard";
import {
  SOFTWARE_SAAS_PROVIDER_CATALOG,
  SOFTWARE_SAAS_PROVIDER_SLUGS,
  buildSpendToDateFromActualCharges,
  type SoftwareSaasActualChargeRecord,
} from "@/lib/software-billing/dashboard-model";
import {
  createSoftwareSaasExpenseDraft,
  defaultReimbursementStatusForPaidBy,
  isUnclaimedReimbursementStatus,
} from "@/lib/software-billing/expense-reimbursement-model";
import type { SoftwareBillingSummary } from "@/lib/software-billing/types";

const sampleSummary: SoftwareBillingSummary = {
  currency: "USD",
  lastSuccessfulSyncAt: "2026-08-01T12:00:00.000Z",
  syncStatus: "ok",
  syncError: null,
  overall: {
    totalSoftwareCostMonthly: 120,
    lastMonthSpend: 45.5,
    upcoming: 110,
    deltaAmount: 10,
    deltaPercent: 28,
    deltaDirection: "up",
  },
  vercel: {
    lastMonth: 45.5,
    upcomingProjected: 110,
    currentSpend: 80,
    isProjected: true,
    planName: "Pro",
    planIteration: "2024",
    baseSubscriptionMonthly: 20,
    seatCount: 1,
    billingPeriodStart: "2026-08-01T00:00:00.000Z",
    billingPeriodEnd: "2026-09-01T00:00:00.000Z",
    creditsAppliedCurrent: 5,
    usageEffectiveCurrent: 60,
    analyticsSpendLimitDollars: 200,
  },
  history: [
    {
      periodStart: "2026-07-01T00:00:00.000Z",
      periodEnd: "2026-08-01T00:00:00.000Z",
      billedAmount: 45.5,
      usageEffectiveAmount: 25.5,
      creditsAppliedAmount: 10,
      deltaAmount: null,
      deltaPercent: null,
    },
  ],
  vercelAssetId: "asset-vercel",
};

const vercelRow = adaptVercelToProviderBillingRow({ summary: sampleSummary });
assert.equal(vercelRow.slug, "vercel");
assert.equal(vercelRow.connectionStatus, "connected");
assert.equal(vercelRow.lastMonth.kind, "actual");
assert.equal(vercelRow.lastMonth.total, 45.5);
assert.equal(vercelRow.lastMonth.subscription, 20);
assert.equal(vercelRow.lastMonth.additionalUsageOrCredits, 25.5);
assert.equal(vercelRow.upcoming.kind, "projected");
assert.equal(vercelRow.upcoming.isEstimate, true);
assert.equal(vercelRow.upcoming.expectedTotal, 110);
assert.equal(vercelRow.allowanceUsage.kind, "monetary_remaining");
assert.equal(vercelRow.spendToDate.historicalImportIncomplete, true);
assert.equal(vercelRow.spendToDate.coverage, "awaiting_historical_import");
assert.ok(vercelRow.spendToDate.statusLabel.toLowerCase().includes("invoice"));
assert.ok(!vercelRow.spendToDate.statusLabel.toLowerCase().includes("account creation"));

const historicalCharges: SoftwareSaasActualChargeRecord[] = [
  {
    id: "inv-1",
    provider: "vercel",
    source: "historical_invoice",
    invoiceDate: "2026-03-01",
    billingPeriod: { start: "2026-02-01", end: "2026-03-01" },
    description: "Vercel March invoice",
    amount: 40,
    currency: "USD",
    taxAmount: null,
    invoiceReceiptReference: "INV-MAR",
    providerTransactionId: "v_1",
    sourceDocumentRef: null,
  },
  {
    id: "inv-2",
    provider: "vercel",
    source: "historical_invoice",
    invoiceDate: "2026-04-01",
    billingPeriod: { start: "2026-03-01", end: "2026-04-01" },
    description: "Vercel April invoice",
    amount: 55,
    currency: "USD",
    taxAmount: null,
    invoiceReceiptReference: "INV-APR",
    providerTransactionId: "v_2",
    sourceDocumentRef: null,
  },
  {
    id: "cur-1",
    provider: "vercel",
    source: "current_period_actual",
    invoiceDate: "2026-08-10",
    billingPeriod: { start: "2026-08-01", end: "2026-09-01" },
    description: "Current period actual charges",
    amount: 80,
    currency: "USD",
    taxAmount: null,
    invoiceReceiptReference: null,
    providerTransactionId: null,
    sourceDocumentRef: null,
  },
];

const completeSpend = buildSpendToDateFromActualCharges({
  currency: "USD",
  charges: historicalCharges,
  historicalImportComplete: true,
});
assert.equal(completeSpend.totalActual, 175);
assert.equal(completeSpend.coverage, "complete");
assert.equal(completeSpend.historicalImportIncomplete, false);
assert.equal(completeSpend.trackedFrom, "2026-03-01");
assert.equal(completeSpend.historicalInvoicesActualIncluded, 95);
assert.equal(completeSpend.currentPeriodActualIncluded, 80);

const vercelComplete = adaptVercelToProviderBillingRow({
  summary: sampleSummary,
  actualCharges: historicalCharges,
  historicalImportComplete: true,
});
assert.equal(vercelComplete.spendToDate.coverage, "complete");
assert.equal(vercelComplete.spendToDate.historicalImportIncomplete, false);
assert.equal(vercelComplete.spendToDate.totalActual, 175);

const dashboard = buildSoftwareSaasDashboard({ summary: sampleSummary });
assert.equal(dashboard.providers.length, SOFTWARE_SAAS_PROVIDER_SLUGS.length);
assert.equal(dashboard.providers.length, SOFTWARE_SAAS_PROVIDER_CATALOG.length);
assert.equal(dashboard.summary.lastMonth.kind, "actual");
assert.equal(dashboard.summary.lastMonth.total, 45.5);
assert.equal(dashboard.summary.upcoming.kind, "projected");
assert.equal(dashboard.summary.upcoming.isEstimate, true);
assert.equal(dashboard.summary.upcoming.expectedTotal, 110);
assert.ok(dashboard.summary.spendToDate.historicalImportIncomplete);
assert.equal(
  dashboard.providers.filter((row) => row.connectionStatus === "planned").length,
  SOFTWARE_SAAS_PROVIDER_SLUGS.length - 1,
);

const dashboardComplete = buildSoftwareSaasDashboard({
  summary: sampleSummary,
  actualChargesByProvider: { vercel: historicalCharges },
  historicalImportCompleteByProvider: { vercel: true },
});
assert.equal(dashboardComplete.summary.spendToDate.coverage, "complete");
assert.equal(dashboardComplete.summary.spendToDate.historicalImportIncomplete, false);
assert.equal(dashboardComplete.summary.spendToDate.totalActual, 175);

const emptyDashboard = buildSoftwareSaasDashboard({ summary: null });
assert.equal(emptyDashboard.summary.lastMonth.total, 0);
assert.equal(
  emptyDashboard.providers.every(
    (row) => row.slug !== "vercel" || row.connectionStatus === "planned",
  ),
  true,
);

const personalExpense = createSoftwareSaasExpenseDraft({
  provider: "vercel",
  invoiceDate: "2026-07-15",
  amount: 45.5,
  currency: "USD",
  description: "Vercel Pro — July 2026",
  businessPurpose: "Unit311 Central hosting",
  providerTransactionId: "inv_test_1",
  invoiceReceiptReference: "INV-TEST",
  sourceDocumentRef: "docs/inv_test_1.pdf",
});
assert.equal(personalExpense.paidBy, "personally_paid");
assert.equal(personalExpense.paymentStatus, "paid");
assert.equal(personalExpense.reimbursementStatus, "PERSONAL_PAID");
assert.equal(isUnclaimedReimbursementStatus(personalExpense.reimbursementStatus), true);

const companyExpense = createSoftwareSaasExpenseDraft({
  provider: "openai",
  invoiceDate: "2026-07-01",
  amount: 100,
  currency: "USD",
  paidBy: "company_paid",
  paymentStatus: "paid",
});
assert.equal(companyExpense.paidBy, "company_paid");
assert.equal(companyExpense.reimbursementStatus, "NOT_APPLICABLE");
assert.equal(defaultReimbursementStatusForPaidBy("corporate_card"), "NOT_APPLICABLE");
assert.equal(defaultReimbursementStatusForPaidBy("other"), "NOT_APPLICABLE");

console.log("software-saas-dashboard.check.ts: OK");
