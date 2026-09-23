import assert from "node:assert/strict";

import { formatSalesQuoteDisplayDate } from "@/lib/accounting/sales-quote-pdf-format";
import {
  formatSellerPdfCompanyLines,
  formatSellerPdfFooterLine,
} from "@/lib/accounting/sales-quote-pdf-seller-lines";

assert.equal(formatSalesQuoteDisplayDate("2026-09-21"), "21 September 2026");

const nakamaBlock = formatSellerPdfCompanyLines({
  brandName: "Unit311 Central",
  legalCompanyName: "Nakama Technology Holdings Ltd",
  tradingName: "Unit311 Central",
  companyNumber: "78747890",
  vatTaxNumber: null,
  companyName: "Unit311 Central",
  contactName: null,
  email: "paul@unit311central.com",
  phone: null,
  address: "No. 5, 17/F Strand 50\nBonham Strand, Sheung Wan\nHong Kong",
  city: null,
  region: null,
  country: "Hong Kong",
  website: "https://unit311central.com",
});

assert.deepEqual(nakamaBlock, [
  "Unit311 Central",
  "Nakama Technology Holdings Ltd",
  "No. 5, 17/F Strand 50",
  "Bonham Strand, Sheung Wan",
  "Hong Kong",
  "Company No: 78747890",
  "paul@unit311central.com",
  "unit311central.com",
]);

const footer = formatSellerPdfFooterLine({
  brandName: "Unit311 Central",
  legalCompanyName: null,
  tradingName: null,
  companyNumber: null,
  vatTaxNumber: null,
  companyName: "Unit311 Central",
  contactName: null,
  email: "paul@unit311central.com",
  phone: null,
  address: null,
  city: null,
  region: null,
  country: null,
  website: "https://unit311central.com",
});
assert.equal(footer, "Unit311 Central | paul@unit311central.com | unit311central.com");

console.log("ok  sales-quote-pdf-seller-lines");
