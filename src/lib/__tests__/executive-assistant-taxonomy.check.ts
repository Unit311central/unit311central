/**
 * Executive Assistant product taxonomy.
 * Run: npm run prove:executive-assistant-taxonomy
 */
import assert from "node:assert/strict";

import {
  EXECUTIVE_ASSISTANT_CORE_FEATURES,
  EXECUTIVE_ASSISTANT_MODULE_ID,
  executiveAssistantCoreFeatureCount,
  executiveAssistantCoreSubFeatureCount,
  getExecutiveAssistantBusinessActionsSubFeature,
} from "@/lib/executive-assistant/executive-assistant-taxonomy";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";

assert.equal(EXECUTIVE_ASSISTANT_MODULE_ID, "executive-assistant");
assert.equal(executiveAssistantCoreFeatureCount(), 4);
assert.equal(executiveAssistantCoreSubFeatureCount(), 2);
assert.deepEqual(
  EXECUTIVE_ASSISTANT_CORE_FEATURES.map((feature) => feature.label),
  ["Operating Assistant", "Proactive Intelligence", "Guided Learning", "Business Actions"],
);
const goal = getExecutiveAssistantBusinessActionsSubFeature("Goal & multi-step planning");
assert.ok(goal, "Goal & multi-step planning sub-feature required");
assert.ok(goal!.toolIds.includes("planBusinessGoal"));
assert.equal(getCanonicalModule(EXECUTIVE_ASSISTANT_MODULE_ID)?.label, "Executive Assistant");

console.log("prove:executive-assistant-taxonomy: OK");
