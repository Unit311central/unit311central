/**
 * Talanton LMS Phase 1 wiring checks.
 * Run: npx tsx src/lib/__tests__/talanton-lms-phase1.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(process.cwd());

const portfolio = readFileSync(
  join(repoRoot, "src/components/testflighthub/talanton/TalantonPortfolioCoursesWorkspace.tsx"),
  "utf8",
);
const library = readFileSync(
  join(repoRoot, "src/components/testflighthub/talanton/TalantonLearningLibraryWorkspace.tsx"),
  "utf8",
);
const coursesRoute = readFileSync(join(repoRoot, "src/app/api/lms/courses/route.ts"), "utf8");

assert.doesNotMatch(portfolio, /TALANTON_COMPLIANCE_COURSES\.map/);
assert.match(portfolio, /fetchPublishedLmsCoursesWithStats/);
assert.match(portfolio, /reloadPublishedCourses/);
assert.match(portfolio, /LmsCoursePlayerOverlay/);

assert.doesNotMatch(library, /LEARNING_LIBRARY\.filter/);
assert.match(library, /fetchPublishedLmsCoursesWithStats/);
assert.match(library, /LmsCoursePlayerOverlay/);

assert.match(coursesRoute, /includeStats/);
assert.match(coursesRoute, /listPublishedCoursesWithStats/);

console.log("talanton-lms-phase1.check.ts — all assertions passed");
