/**
 * LMS course deletion wiring checks.
 * Run: node --import tsx src/lib/lms/__tests__/course-delete.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const service = readFileSync(join(root, "src/lib/lms/service.ts"), "utf8");
const slugRoute = readFileSync(join(root, "src/app/api/lms/courses/[slug]/route.ts"), "utf8");
const portfolio = readFileSync(
  join(root, "src/components/testflighthub/talanton/TalantonPortfolioCoursesWorkspace.tsx"),
  "utf8",
);

assert.match(service, /export async function deleteCourseForWorkspace/);
assert.match(service, /summarizeCourseDeletionImpact/);
assert.match(service, /\.eq\("workspace_id", workspaceId\)/);
assert.match(service, /lms_enrolments/);
assert.match(service, /lms_certificates/);
assert.match(service, /lms_assignments/);

assert.match(slugRoute, /export async function DELETE/);
assert.match(slugRoute, /requireLmsWorkspaceSession/);
assert.match(slugRoute, /deleteCourseForWorkspace/);
assert.match(slugRoute, /deletionPreview/);

assert.match(portfolio, /fetchStaffLmsCoursesWithStats/);
assert.match(portfolio, /DeleteLmsCourseDialog/);
assert.match(portfolio, /deleteLmsCourseBySlug/);
assert.match(portfolio, /openDeleteDialog/);

console.log("course-delete.check.ts — ok");
