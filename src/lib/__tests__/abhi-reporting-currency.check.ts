import assert from "node:assert/strict";

import { resolveSlugReportingCurrency, resolveBrowserReportingCurrency } from "@/lib/financial-reporting-currency";
import { getAbhiBcDashboardSummary } from "@/lib/abhi/business-central-data";
import { ABHI_REPORTING_CURRENCY } from "@/lib/abhi-surface";

assert.equal(resolveSlugReportingCurrency("abhi"), "GBP");
assert.equal(ABHI_REPORTING_CURRENCY, "GBP");
assert.equal(resolveSlugReportingCurrency("talantonimpact"), "USD");

const summary = getAbhiBcDashboardSummary();
assert.ok(summary.clientsCount > 0, "ABHI BC dashboard must populate client tiles");
assert.ok(summary.pipelineValueUsd > 0, "ABHI BC dashboard must show pipeline value");

if (typeof globalThis.window !== "undefined") {
  assert.equal(resolveBrowserReportingCurrency(), "GBP");
}

console.log("ok  abhi-reporting-currency checks passed\n");
