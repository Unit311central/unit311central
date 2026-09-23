/** Run: npm run prove:technology-management-taxonomy */
import assert from "node:assert/strict";
import {
  TECHNOLOGY_MANAGEMENT_CORE_FEATURES,
  TECHNOLOGY_MANAGEMENT_MODULE_ID,
  technologyManagementCoreFeatureCount,
} from "@/lib/technology-management/technology-management-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(technologyManagementCoreFeatureCount(), 6);
const section = internalSurveyNavSections.find((s) => s.label === "Technology Management");
assert.deepEqual(
  section?.items.map((item) => item.label),
  TECHNOLOGY_MANAGEMENT_CORE_FEATURES.map((f) => f.label),
);
assert.equal(TECHNOLOGY_MANAGEMENT_MODULE_ID, "technology-management");
console.log("prove:technology-management-taxonomy: OK");
