/** Run: npm run prove:tools-taxonomy */
import assert from "node:assert/strict";
import { TOOLS_CORE_FEATURES, TOOLS_MODULE_ID, toolsCoreFeatureCount } from "@/lib/tools/tools-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(toolsCoreFeatureCount(), 6);
const section = internalSurveyNavSections.find((s) => s.label === "Tools");
assert.deepEqual(
  section?.items.map((item) => item.label),
  TOOLS_CORE_FEATURES.map((f) => f.label),
);
assert.equal(TOOLS_MODULE_ID, "tools");
console.log("prove:tools-taxonomy: OK");
