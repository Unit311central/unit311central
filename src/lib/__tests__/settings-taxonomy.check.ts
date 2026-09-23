/** Run: npm run prove:settings-taxonomy */
import assert from "node:assert/strict";
import {
  SETTINGS_CORE_FEATURES,
  SETTINGS_MODULE_ID,
  settingsCoreFeatureCount,
} from "@/lib/settings/settings-taxonomy";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(settingsCoreFeatureCount(), 4);
const section = internalSurveyNavSections.find((s) => s.label === "Settings");
assert.deepEqual(
  section?.items.map((item) => item.label),
  SETTINGS_CORE_FEATURES.map((f) => f.label),
);
assert.equal(SETTINGS_MODULE_ID, "settings");
console.log("prove:settings-taxonomy: OK");
