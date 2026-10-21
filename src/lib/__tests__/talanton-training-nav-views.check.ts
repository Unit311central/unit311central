/**
 * Talanton Training nav views must be grantable when Training module is enabled.
 * Run: node --import tsx src/lib/__tests__/talanton-training-nav-views.check.ts
 */
import assert from "node:assert/strict";

import {
  applyTalantonWorkspaceAllowedViews,
  isViewAllowedForWorkspaceGrants,
} from "@/lib/workspace-enabled-views";

const merged = applyTalantonWorkspaceAllowedViews(["home"], "talantonimpact", ["training"]);
assert.ok(merged?.includes("portfolio-courses"), "portfolio-courses merged for Talanton + training");

assert.equal(
  isViewAllowedForWorkspaceGrants("portfolio-courses", ["home"], {
    workspaceSlug: "talantonimpact",
    enabledModules: ["training"],
  }),
  true,
);

assert.equal(
  isViewAllowedForWorkspaceGrants("portfolio-courses", ["home"], {
    workspaceSlug: "talantonimpact",
    enabledModules: [],
  }),
  false,
);

console.log("talanton-training-nav-views.check.ts ok");
