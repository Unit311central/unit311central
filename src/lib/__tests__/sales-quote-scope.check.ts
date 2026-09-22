import assert from "node:assert/strict";

import {
  buildScopeStyleLineRows,
  resolveSalesQuoteFinancials,
} from "@/lib/accounting/sales-quote-calculations";
import {
  DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  formatSalesQuoteCustomerLocation,
  isScopeStyleQuote,
  normalizeBankDetails,
} from "@/lib/accounting/sales-quote-display";

const hiddenColumns = {
  showQuantity: false,
  showUnit: false,
  showRate: false,
  showDiscount: false,
  showTax: false,
};

assert.equal(isScopeStyleQuote("detailed", hiddenColumns), true);

const scopeTotals = resolveSalesQuoteFinancials({
  pricingStyle: "scope_total",
  lineColumnVisibility: hiddenColumns,
  commercialTotal: 40_000,
  lineItems: [
    { description: "Core Platform Principle", detailText: "Scope detail", quantity: 0, unitPrice: 0 },
    { description: "Digital Part Passport", quantity: 0, unitPrice: 0 },
  ],
});

assert.equal(scopeTotals.totalAmount, 40_000);
assert.equal(scopeTotals.lines[0]?.amount, 0);
assert.equal(scopeTotals.lines[0]?.detailText, "Scope detail");

const detailed = resolveSalesQuoteFinancials({
  lineColumnVisibility: DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  lineItems: [{ description: "Day rate", quantity: 2, unitPrice: 500, taxRate: 20 }],
});
assert.equal(detailed.totalAmount, 1200);

const bank = normalizeBankDetails({
  accountName: "Nakama Technology Holdings Ltd",
  iban: "HK123",
});
assert.ok(bank?.iban);

const scopeLines = buildScopeStyleLineRows([{ description: "A", detailText: "B" }]);
assert.equal(scopeLines[0]?.unitPrice, 0);

assert.equal(
  formatSalesQuoteCustomerLocation({
    city: "Casablanca",
    region: "Casablanca",
    country: "Morocco",
  }),
  "Casablanca, Morocco",
);
assert.equal(
  formatSalesQuoteCustomerLocation({ city: "Casablanca", region: "Morocco", country: "Morocco" }),
  "Casablanca, Morocco",
);

console.log("ok  sales-quote-scope");
