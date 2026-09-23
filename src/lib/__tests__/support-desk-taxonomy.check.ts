/** Run: npm run prove:support-desk-taxonomy */
import assert from "node:assert/strict";
import {
  SUPPORT_DESK_CORE_FEATURES,
  SUPPORT_DESK_MODULE_ID,
  supportDeskCoreFeatureCount,
} from "@/lib/support-desk/support-desk-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(supportDeskCoreFeatureCount(), 4);
const section = internalSurveyNavSections.find((s) => s.label === "Support Desk");
assert.deepEqual(
  section?.items.map((item) => item.label),
  SUPPORT_DESK_CORE_FEATURES.map((f) => f.label),
);
assert.equal(SUPPORT_DESK_MODULE_ID, "support-desk");
console.log("prove:support-desk-taxonomy: OK");
