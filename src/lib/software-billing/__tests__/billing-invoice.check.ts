/**
 * Provider invoice lifecycle + generic amount-kind checks.
 * Run: node --import tsx src/lib/software-billing/__tests__/billing-invoice.check.ts
 */
import assert from "node:assert/strict";

import {
  buildProviderInvoiceKey,
  getInvoiceAmountKind,
  hasConfirmedFinalInvoiceAmount,
  hasValidProviderInvoiceIdentity,
  isExpenseEligibleInvoice,
  isPaidInvoice,
  isUpcomingInvoice,
  sumPaidInvoiceAmounts,
  sumUpcomingInvoiceAmounts,
  type ProviderBillingInvoice,
} from "@/lib/software-billing/billing-invoice-model";
import {
  buildProviderAccountingFromInvoices,
  buildTotalSoftwareAccountingFromInvoices,
} from "@/lib/software-billing/invoice-dashboard-helpers";
import { validateManualInvoice } from "@/lib/software-billing/manual-invoice-import";

const workspaceId = "ws-test";
const baseInvoice = (overrides: Partial<ProviderBillingInvoice>): ProviderBillingInvoice => ({
  id: "inv-1",
  workspaceId,
  providerSlug: "vercel",
  softwareAssetId: "asset-vercel",
  providerInvoiceKey: "vercel:team1:billing-period:2026-07-22",
  providerTransactionId: null,
  invoiceNumber: null,
  invoiceStatus: "paid",
  invoiceDate: "2026-08-22",
  billingPeriodStart: "2026-07-22T00:00:00.000Z",
  billingPeriodEnd: "2026-08-22T00:00:00.000Z",
  paymentDate: "2026-08-22",
  scheduledPaymentDate: null,
  amount: 42.5,
  currency: "USD",
  taxAmount: null,
  description: "Vercel Pro",
  category: "Software",
  paymentMethod: "personally_paid",
  sourceDocumentRef: null,
  sourceDocumentStatus: "unavailable",
  financialExpenseId: null,
  rawSummary: {
    vendorName: "Vercel",
    invoiceAmountKind: "final",
    accountingLayers: { confirmedPaidAmount: 42.5 },
  },
  source: "manual_import",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

assert.equal(
  buildProviderInvoiceKey("vercel", ["team_abc", "billing-period", "2026-07-22"]),
  "vercel:team_abc:billing-period:2026-07-22",
);

const paid = baseInvoice({ invoiceStatus: "paid", amount: 10 });
const upcoming = baseInvoice({
  id: "inv-2",
  providerInvoiceKey: "vercel:team1:billing-period:2026-08-22",
  invoiceStatus: "upcoming",
  amount: 46.79,
  paymentDate: null,
  rawSummary: {
    invoiceAmountKind: "final",
    accountingLayers: { upcomingInvoiceAmount: 46.79 },
  },
  source: "vercel_invoice_adapter",
});
const rawUsageOnly = baseInvoice({
  id: "inv-3",
  amount: 106.85,
  rawSummary: { invoiceAmountKind: "raw_usage_reference" },
});

assert.ok(isPaidInvoice(paid));
assert.ok(isUpcomingInvoice(upcoming));
assert.equal(getInvoiceAmountKind(upcoming), "final");
assert.equal(getInvoiceAmountKind(rawUsageOnly), "raw_usage_reference");
assert.ok(hasConfirmedFinalInvoiceAmount(upcoming));
assert.ok(!hasConfirmedFinalInvoiceAmount(rawUsageOnly));
assert.ok(hasValidProviderInvoiceIdentity(paid));
assert.ok(isExpenseEligibleInvoice(paid));
assert.ok(!isExpenseEligibleInvoice(upcoming));
assert.ok(!isExpenseEligibleInvoice(rawUsageOnly));

assert.equal(sumPaidInvoiceAmounts([paid, upcoming, rawUsageOnly]), 10);
assert.equal(sumUpcomingInvoiceAmounts([paid, upcoming, rawUsageOnly]), 46.79);

const providerAccounting = buildProviderAccountingFromInvoices({
  providerSlug: "vercel",
  currency: "USD",
  invoices: [paid, upcoming],
  referenceMonth: "2026-08",
});
assert.equal(providerAccounting.spendToDate.totalActual, 10);
assert.equal(providerAccounting.upcoming.expectedTotal, 46.79);

assert.equal(
  validateManualInvoice({
    providerSlug: "vercel",
    idempotencyPart: "inv-123",
    invoiceStatus: "paid",
    amount: 0,
    description: "test",
  }),
  "paid invoices require a confirmed amount greater than zero.",
);

console.log("billing-invoice.check.ts: all assertions passed");
