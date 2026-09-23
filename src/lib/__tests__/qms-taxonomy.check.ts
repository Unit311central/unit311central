/** Run: npm run prove:qms-taxonomy */
import assert from "node:assert/strict";
import { QMS_CORE_FEATURES, QMS_MODULE_ID, qmsCoreFeatureCount } from "@/lib/qms/qms-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(qmsCoreFeatureCount(), 6);
const section = internalSurveyNavSections.find((s) => s.label === "QMS");
assert.deepEqual(
  section?.items.map((item) => item.label),
  QMS_CORE_FEATURES.map((f) => f.label),
);
assert.equal(QMS_MODULE_ID, "qms");
console.log("prove:qms-taxonomy: OK");
