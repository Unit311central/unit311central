/** Run: npm run prove:external-client-access-taxonomy */
import assert from "node:assert/strict";
import {
  EXTERNAL_CLIENT_ACCESS_CORE_FEATURES,
  EXTERNAL_CLIENT_ACCESS_MODULE_ID,
  externalClientAccessCoreFeatureCount,
} from "@/lib/external-client-access/external-client-access-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(externalClientAccessCoreFeatureCount(), 2);
const section = internalSurveyNavSections.find((s) => s.label === "External Client Access");
assert.deepEqual(
  section?.items.map((item) => item.label),
  EXTERNAL_CLIENT_ACCESS_CORE_FEATURES.map((f) => f.label),
);
assert.equal(EXTERNAL_CLIENT_ACCESS_MODULE_ID, "external-client-access");
console.log("prove:external-client-access-taxonomy: OK");
