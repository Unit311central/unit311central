/**
 * Finances (financials) product taxonomy.
 * Run: npm run prove:financials-taxonomy
 */
import assert from "node:assert/strict";

import {
  FINANCIALS_CORE_FEATURES,
  FINANCIALS_MODULE_ID,
  financialsCoreFeatureCount,
  financialsCoreSubFeatureCount,
} from "@/lib/financials/financials-taxonomy";
import { buildFinancesNavSection } from "@/lib/finances-nav";

assert.equal(FINANCIALS_MODULE_ID, "financials");
assert.equal(financialsCoreFeatureCount(), 8);
assert.equal(financialsCoreSubFeatureCount(), 28);

const nav = buildFinancesNavSection();
assert.deepEqual(
  nav.items.map((item) => item.label),
  FINANCIALS_CORE_FEATURES.map((feature) => feature.label),
);

console.log("prove:financials-taxonomy: OK");
