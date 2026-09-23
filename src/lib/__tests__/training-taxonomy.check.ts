/**
 * Training product taxonomy — central catalogue only.
 * Run: npm run prove:training-taxonomy
 */
import assert from "node:assert/strict";

import {
  TRAINING_CORE_FEATURES,
  TRAINING_EXCLUDED_VIEW_IDS,
  TRAINING_MODULE_ID,
  trainingCoreFeatureCount,
  trainingCoreSubFeatureCount,
} from "@/lib/training/training-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(TRAINING_MODULE_ID, "training");
assert.equal(trainingCoreFeatureCount(), 3);
assert.equal(trainingCoreSubFeatureCount(), 6);

const trainingNav = internalSurveyNavSections.find((section) => section.label === "Training");
assert.ok(trainingNav);
assert.deepEqual(
  trainingNav!.items.map((item) => item.label),
  TRAINING_CORE_FEATURES.map((feature) => feature.label),
);

const json = JSON.stringify(TRAINING_CORE_FEATURES);
for (const viewId of TRAINING_EXCLUDED_VIEW_IDS) {
  assert.ok(!json.includes(viewId), `canonical training must exclude ${viewId}`);
}

console.log("prove:training-taxonomy: OK");
