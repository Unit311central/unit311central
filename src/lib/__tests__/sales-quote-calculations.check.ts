import assert from "node:assert/strict";

import { computeSalesQuoteTotals } from "@/lib/accounting/sales-quote-calculations";

const totals = computeSalesQuoteTotals(
  [
    { description: "Consulting", quantity: 5, unitPrice: 1500, discountAmount: 0, taxRate: 20 },
    { description: "Travel", quantity: 1, unitPrice: 400, discountAmount: 50, taxRate: 0 },
  ],
  100,
);

assert.equal(totals.lines[0]?.amount, 9000);
assert.equal(totals.subtotal, 7750);
assert.equal(totals.taxAmount, 1500);
assert.equal(totals.totalAmount, 9250);

console.log("ok  sales-quote-calculations");
