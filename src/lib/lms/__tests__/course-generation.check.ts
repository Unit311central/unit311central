import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { buildCourseFromDocumentText } from "@/lib/lms/course-generation/document-course-builder";
import { finalizeCourseDraft, summarizeDraftCounts } from "@/lib/lms/course-generation/finalize-course-draft";
import { validateCourseForPublish } from "@/lib/lms/course-publish-validation";
import { isInstructionalAnimationComplete } from "@/lib/lms/instructional-animation";
import type { LmsCourseTree } from "@/lib/lms/types";

const fixture = fs.readFileSync(
  path.join(process.cwd(), "src/lib/lms/fixtures/incident-reporting-escalation-source.txt"),
  "utf8",
);

const draft = finalizeCourseDraft(
  buildCourseFromDocumentText({
    documentText: fixture,
    preferredTitle: "Incident Reporting & Escalation Training",
    sourceFileName: "incident-reporting-escalation.pdf",
  }),
  "incident-reporting-test",
);

const counts = summarizeDraftCounts(draft);
assert.ok(counts.moduleCount >= 6, "expected teaching + assessment modules");
assert.ok(counts.lessonCount >= counts.moduleCount * 2, "lessons per module");
assert.ok(counts.animationLessonCount >= counts.lessonCount - 2, "animations on teachable lessons");
assert.ok(counts.questionBankCount >= 15, "question bank size");
assert.equal(counts.finalAssessmentDrawCount, 10, "final assessment draw count");
assert.equal(counts.passMark, 80);

const fakeTree: LmsCourseTree = {
  id: "course-1",
  workspaceId: "ws",
  code: "IR-001",
  slug: "incident-reporting",
  title: draft.title,
  description: draft.description,
  category: "Compliance",
  durationMinutes: 45,
  passMark: 80,
  status: "draft",
  certificatePrefix: "TALANTON",
  sortOrder: 1,
  coverImageUrl: null,
  questionCount: counts.questionBankCount,
  modules: draft.modules.map((mod, mi) => ({
    id: `mod-${mi}`,
    courseId: "course-1",
    title: mod.title,
    summary: mod.summary ?? "",
    sortOrder: mi + 1,
    lessons: mod.lessons.map((lesson, li) => ({
      id: `lesson-${mi}-${li}`,
      courseId: "course-1",
      moduleId: `mod-${mi}`,
      title: lesson.title,
      lessonType: lesson.lessonType,
      content: lesson.content,
      sortOrder: li + 1,
      estimatedMinutes: lesson.estimatedMinutes ?? 5,
    })),
  })),
};

const validation = validateCourseForPublish(fakeTree, counts.questionBankCount);
assert.equal(validation.ok, true, validation.errors.join("; "));

const animated = fakeTree.modules
  .flatMap((m) => m.lessons)
  .filter((l) => isInstructionalAnimationComplete(l.content));
assert.ok(animated.length >= 10, `expected many animated lessons, got ${animated.length}`);

console.log("course-generation.check.ts OK", counts);
