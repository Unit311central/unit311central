/** Run: npm run prove:human-resources-taxonomy */
import assert from "node:assert/strict";
import {
  HUMAN_RESOURCES_CORE_FEATURES,
  HUMAN_RESOURCES_MODULE_ID,
  humanResourcesCoreFeatureCount,
} from "@/lib/human-resources/human-resources-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(humanResourcesCoreFeatureCount(), 8);
const section = internalSurveyNavSections.find((s) => s.label === "Human Resources");
assert.deepEqual(
  section?.items.map((item) => item.label),
  HUMAN_RESOURCES_CORE_FEATURES.map((f) => f.label),
);
assert.equal(HUMAN_RESOURCES_MODULE_ID, "human-resources");
console.log("prove:human-resources-taxonomy: OK");
