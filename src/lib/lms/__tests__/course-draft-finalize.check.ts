import assert from "node:assert/strict";

import { buildDocumentTemplateCourse } from "@/lib/lms/document-template-course";
import {
  finalizeGeneratedCourseDraft,
  summarizeFinalizeStats,
} from "@/lib/lms/course-draft-finalize";
import { validateCourseForPublish } from "@/lib/lms/course-publish-validation";
import type { LmsCourseTree } from "@/lib/lms/types";

const doc = `
Incident Reporting and Escalation Procedure
1. Identify and classify the incident severity (low, medium, high).
2. Notify the duty manager immediately using the approved communication channel.
3. If severity is high, escalate to the compliance lead within one hour.
4. Record the incident in the central register with time, location, and witnesses.
5. Assign an owner to coordinate containment actions.
6. Conduct a brief review and document lessons learned before closing the case.
`.trim();

const template = buildDocumentTemplateCourse(doc, "incident-reporting.pdf", "Incident Reporting & Escalation Training");
const draft = finalizeGeneratedCourseDraft(template, doc, { forceFiveModules: true });
const stats = summarizeFinalizeStats(draft);

assert.ok(stats.moduleCount >= 6);
assert.ok(stats.animationLessonCount >= 10, `expected companion KC animations, got ${stats.animationLessonCount}`);
assert.ok(stats.questionBankCount >= 17);
assert.equal(stats.finalAssessmentDrawCount, 10);
assert.equal(stats.passMark, 80);

const fakeTree: LmsCourseTree = {
  id: "c1",
  workspaceId: "w1",
  code: "IR",
  slug: "incident",
  title: draft.title,
  description: draft.description,
  category: "Compliance",
  durationMinutes: 30,
  passMark: 80,
  status: "draft",
  certificatePrefix: "TAL",
  sortOrder: 1,
  coverImageUrl: null,
  questionCount: stats.questionBankCount,
  modules: draft.modules.map((mod, mi) => ({
    id: `m${mi}`,
    courseId: "c1",
    title: mod.title,
    summary: mod.summary ?? "",
    sortOrder: mi,
    lessons: mod.lessons.map((lesson, li) => ({
      id: `l${mi}-${li}`,
      courseId: "c1",
      moduleId: `m${mi}`,
      title: lesson.title,
      lessonType: lesson.lessonType,
      content: lesson.content,
      sortOrder: li,
      estimatedMinutes: 5,
    })),
  })),
};

const validation = validateCourseForPublish(fakeTree, stats.questionBankCount);
assert.equal(validation.ok, true, validation.errors.join("; "));

console.log("course-draft-finalize.check.ts OK", stats);
