import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildExpenseWorkflowDashboardCatalog,
  countExpensesByWorkflow,
  sumOwedToEmployee,
} from "@/lib/expense-workflow-summary";
import {
  expenseWorkflowLabel,
  isEmployeeExpenseClaim,
  isSupplierAccountsPayableExpense,
  isTomEmployeeExpenseReference,
} from "@/lib/expenses-data";
import { calculateExpectedPaymentDate } from "@/lib/expense-management/payment-schedule";
import { resolveExpenseAccess } from "@/lib/expense-management/permissions";
import { migrationsMissingSatisfactionProbes } from "@/lib/migration-satisfaction-probes";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

test("migration 162 is registered with satisfaction probe", () => {
  const migration = "supabase/migrations/162_expense_management_foundation.sql";
  assert.ok((UNIT311_PENDING_MIGRATIONS as readonly string[]).includes(migration));
  assert.equal(migrationsMissingSatisfactionProbes(UNIT311_PENDING_MIGRATIONS).includes(migration), false);
});

test("expense workflow labels cover lifecycle states", () => {
  assert.equal(expenseWorkflowLabel("draft"), "Draft");
  assert.equal(expenseWorkflowLabel("submitted"), "Submitted");
  assert.equal(expenseWorkflowLabel("approved"), "Approved");
  assert.equal(expenseWorkflowLabel("scheduled"), "Scheduled for payment");
  assert.equal(expenseWorkflowLabel("paid"), "Paid");
});

test("workflow summary counts and owed totals", () => {
  const expenses = [
    {
      id: "1",
      workflowStatus: "approved" as const,
      amount: 100,
      currency: "GBP" as const,
      reimbursable: true,
      paid: false,
      reference: null,
      supplier: null,
      purposeDescription: "",
      description: "Travel",
      submitterUserId: "u1",
      submitterName: "Alice",
      dateSubmitted: "2026-08-01",
      expenseDate: "2026-08-01",
      recordStatus: "finalized" as const,
      categoryAccountCode: "5090",
      paymentMethod: null,
      wiseBalanceId: null,
      attachmentPath: null,
      journalEntryId: null,
      paymentJournalEntryId: null,
      claimantEmployeeId: null,
      expenseCategoryId: null,
      billingCodeId: null,
      expenseRunId: null,
      expenseNumber: "EXP-00001",
      submittedAt: "2026-08-01",
      approvedAt: null,
      paidAt: null,
      expectedPaymentDate: "2026-08-31",
      expenseType: "standard" as const,
      mileageFrom: null,
      mileageTo: null,
      mileageDistance: null,
      mileageDistanceUnit: null,
      mileageRate: null,
      mileageCalculatedAmount: null,
      createdAt: "2026-08-01",
      updatedAt: "2026-08-01",
    },
  ];

  assert.equal(countExpensesByWorkflow(expenses, "approved"), 1);
  assert.equal(sumOwedToEmployee(expenses, "GBP"), 100);
  const tiles = buildExpenseWorkflowDashboardCatalog(expenses, "GBP");
  assert.ok(tiles.some((tile) => tile.id === "owed-to-you"));
});

test("expected payment date uses schedule payment day", () => {
  const date = calculateExpectedPaymentDate({
    workspaceId: "w1",
    frequency: "monthly",
    cutoffDay: 25,
    approvalDeadlineDay: 27,
    paymentDay: 31,
  });
  assert.match(date, /-\d{2}$/);
});

test("finance users can approve and configure expenses", () => {
  const access = resolveExpenseAccess({
    session: { sub: "user-1", displayName: "Finance" },
    allowedViews: ["expenses", "financials"],
  });
  assert.equal(access.canApprove, true);
  assert.equal(access.canConfigure, true);
  assert.equal(access.canViewAll, true);
});

test("workspace reporting currency resolves InterfaceWorx to GBP", () => {
  const { resolveSlugReportingCurrency } = require("@/lib/financial-reporting-currency") as typeof import("@/lib/financial-reporting-currency");
  assert.equal(resolveSlugReportingCurrency("interfaceworx"), "GBP");
  assert.equal(resolveSlugReportingCurrency("demo"), "GBP");
});

test("employee expense claims are excluded from supplier AP", () => {
  const tomClaim = {
    reference: "IW-TOM-2026-01",
    reimbursable: true,
    claimantEmployeeId: "hr-27ca32da",
    expenseCategoryId: "cat-1",
    paymentMethod: "personally_paid",
    purposeDescription: "Zoho Email",
  };
  const supplierBill = {
    reference: "AP-99201",
    reimbursable: false,
    claimantEmployeeId: null,
    expenseCategoryId: null,
    paymentMethod: null,
    purposeDescription: "Acme Parts invoice",
  };
  const apSeed = {
    reference: "OA-AP-001",
    reimbursable: false,
    claimantEmployeeId: null,
    expenseCategoryId: null,
    paymentMethod: null,
    purposeDescription: "OA AP seed",
  };

  assert.equal(isTomEmployeeExpenseReference("IW-TOM-2026-12"), true);
  assert.equal(isTomEmployeeExpenseReference("AP-99201"), false);
  assert.equal(isEmployeeExpenseClaim(tomClaim), true);
  assert.equal(isEmployeeExpenseClaim(supplierBill), false);
  assert.equal(isSupplierAccountsPayableExpense(tomClaim), false);
  assert.equal(isSupplierAccountsPayableExpense(supplierBill), true);
  assert.equal(isSupplierAccountsPayableExpense(apSeed), true);
});
