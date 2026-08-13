import assert from "node:assert/strict";

import {
  createBlankBulkExpenseRow,
  duplicateBulkExpenseRow,
  normalizeBulkExpenseRow,
  syncBillingCodeFromCategory,
  validateBulkExpenseRows,
} from "@/lib/expenses-bulk-entry";
import { isCountableExpense, isExpenseDraft } from "@/lib/expenses-data";

const baseRow = {
  rowIndex: 0,
  ...createBlankBulkExpenseRow(),
  purpose: "Vercel hosting",
  vendor: "Vercel",
  amount: "46.79",
  currency: "USD" as const,
  invoiceNumber: "INV-001",
  datePaid: "2026-07-22",
};

assert.equal(validateBulkExpenseRows([baseRow], "finalized").length, 0);

const copied = duplicateBulkExpenseRow(baseRow, 1);
assert.equal(copied.vendor, "Vercel");
assert.equal(copied.purpose, "Vercel hosting");
assert.equal(copied.invoiceNumber, "INV-001");
assert.equal(copied.amount, "46.79");
assert.equal(copied.expenseId, undefined);

const synced = syncBillingCodeFromCategory({ ...baseRow, category: "Software" });
assert.equal(synced.billingCategoryCode, "5010");

const finalized = normalizeBulkExpenseRow(baseRow, "finalized");
assert.equal(finalized.paid, true);
assert.equal(finalized.paymentMethod, "personally_paid");
assert.equal(finalized.reimbursable, true);
assert.equal(finalized.recordStatus, "finalized");
assert.equal(finalized.reference, "INV-001");

const draft = normalizeBulkExpenseRow(
  { ...baseRow, purpose: "", vendor: "Vercel", amount: "" },
  "draft",
);
assert.equal(draft.recordStatus, "draft");
assert.equal(draft.paid, false);
assert.equal(draft.reimbursable, false);

const draftErrors = validateBulkExpenseRows(
  [{ rowIndex: 0, ...createBlankBulkExpenseRow(), vendor: "Partial" }],
  "draft",
);
assert.equal(draftErrors.length, 0);

const finalizedErrors = validateBulkExpenseRows(
  [{ rowIndex: 0, ...createBlankBulkExpenseRow(), vendor: "Vercel" }],
  "finalized",
);
assert.ok(finalizedErrors.length > 0);

const draftExpense = {
  id: "draft-1",
  submitterUserId: "u-1",
  submitterName: "Test",
  purposeDescription: "",
  amount: 0,
  currency: "USD" as const,
  dateSubmitted: "2026-08-01",
  paid: false,
  supplier: null,
  categoryAccountCode: "5090",
  expenseDate: "2026-08-01",
  paymentMethod: null,
  wiseBalanceId: null,
  attachmentPath: null,
  reference: null,
  recordStatus: "draft" as const,
  reimbursable: false,
  journalEntryId: null,
  paymentJournalEntryId: null,
  createdAt: "",
  updatedAt: "",
};

assert.equal(isExpenseDraft(draftExpense), true);
assert.equal(isCountableExpense(draftExpense), false);

const finalizedExpense = { ...draftExpense, recordStatus: "finalized" as const, paid: true };
assert.equal(isCountableExpense(finalizedExpense), true);

console.log("expenses-bulk-entry.check.ts — all assertions passed");
