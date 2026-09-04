/**
 * Internal work package questionnaire checks.
 *
 * Run: npx tsx src/lib/__tests__/internal-work-packages-questions.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WOLF_BCN_QUESTIONS_WORK_PACKAGE,
  WOLF_BCN_VIDEO_HANDLING_CATEGORY,
  WOLF_BCN_VIDEO_HANDLING_QUESTIONS,
} from "@/lib/internal-work-packages/bcn-questions-seed";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

assert.equal(WOLF_BCN_QUESTIONS_WORK_PACKAGE.packageCode, "WP2");
assert.equal(WOLF_BCN_VIDEO_HANDLING_QUESTIONS.length, 9);
assert.equal(WOLF_BCN_VIDEO_HANDLING_CATEGORY, "VIDEO HANDLING");

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/200_internal_work_package_questions.sql"),
  "utf8",
);
assert.match(migration, /internal_work_package_questions/);
assert.match(migration, /internal_work_package_question_answer_log/);
assert.match(migration, /WP2/);

const workspace = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalWorkPackagesWorkspace.tsx"),
  "utf8",
);
assert.match(workspace, /lg:grid-cols-\[minmax\(240px,300px\)_minmax\(0,1fr\)\]/);
assert.match(workspace, /Save answer/);
assert.match(workspace, /Answer log/);
assert.match(workspace, /Save team members/);

assert.ok(
  UNIT311_PENDING_MIGRATIONS.includes("supabase/migrations/200_internal_work_package_questions.sql"),
);

console.log("internal-work-packages-questions.check.ts — all assertions passed.");
