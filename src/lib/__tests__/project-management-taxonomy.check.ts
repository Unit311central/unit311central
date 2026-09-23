/**
 * Project Management product taxonomy.
 * Run: npm run prove:project-management-taxonomy
 */
import assert from "node:assert/strict";

import {
  PROJECT_MANAGEMENT_CORE_FEATURES,
  PROJECT_MANAGEMENT_EXCLUDED_VIEW_IDS,
  PROJECT_MANAGEMENT_MODULE_ID,
  projectManagementCoreFeatureCount,
} from "@/lib/project-management/project-management-taxonomy";
import { buildProjectManagementNavSection } from "@/lib/project-management-nav";

assert.equal(PROJECT_MANAGEMENT_MODULE_ID, "project-management");
assert.equal(projectManagementCoreFeatureCount(), 3);
const central = buildProjectManagementNavSection();
assert.deepEqual(
  central.items.map((item) => item.view),
  PROJECT_MANAGEMENT_CORE_FEATURES.map((feature) => feature.viewId),
);
for (const excluded of PROJECT_MANAGEMENT_EXCLUDED_VIEW_IDS) {
  assert.ok(
    !central.items.some((item) => item.view === excluded),
    `${excluded} must not be central PM`,
  );
}

console.log("prove:project-management-taxonomy: OK");
