/**
 * Engineering product taxonomy.
 * Run: npm run prove:engineering-taxonomy
 */
import assert from "node:assert/strict";

import {
  ENGINEERING_CORE_FEATURES,
  ENGINEERING_MODULE_ID,
  engineeringCoreFeatureCount,
  engineeringCoreSubFeatureCount,
} from "@/lib/engineering/engineering-taxonomy";
import { buildCentralEngineeringNavSection } from "@/lib/platform-workspaces/central-product-nav";

assert.equal(ENGINEERING_MODULE_ID, "engineering");
assert.equal(engineeringCoreFeatureCount(), 6);
assert.equal(engineeringCoreSubFeatureCount(), 7);

const nav = buildCentralEngineeringNavSection();
assert.deepEqual(
  nav.items.map((item) => item.label),
  ENGINEERING_CORE_FEATURES.map((feature) => feature.label),
);
const sops = ENGINEERING_CORE_FEATURES.find((feature) => feature.label === "SOPs");
assert.equal(sops?.subFeatures?.length, 7);

console.log("prove:engineering-taxonomy: OK");
