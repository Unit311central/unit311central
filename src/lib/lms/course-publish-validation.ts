import { isInstructionalAnimationComplete } from "@/lib/lms/instructional-animation";
import type { LmsCourseTree, LmsLesson } from "@/lib/lms/types";

export type CoursePublishValidation = {
  ok: boolean;
  errors: string[];
  stats: {
    moduleCount: number;
    lessonCount: number;
    lessonsWithAnimation: number;
    questionBankCount: number;
    finalAssessmentDrawCount: number;
    passMark: number;
  };
};

function lessonHasAnimation(lesson: LmsLesson): boolean {
  return isInstructionalAnimationComplete(lesson.content);
}

export function validateCourseForPublish(
  tree: LmsCourseTree,
  questionBankCount: number,
): CoursePublishValidation {
  const errors: string[] = [];
  const lessons = tree.modules.flatMap((m) => m.lessons);
  const lessonCount = lessons.length;
  const moduleCount = tree.modules.length;

  let finalAssessmentDrawCount = 0;
  for (const lesson of lessons) {
    if (lesson.content.type === "assessment") {
      finalAssessmentDrawCount = lesson.content.drawCount;
    }
  }

  const teachableLessons = lessons.filter((l) => l.content.type !== "assessment");
  const lessonsWithAnimation = teachableLessons.filter((l) => lessonHasAnimation(l)).length;

  if (moduleCount < 1) errors.push("Course must include at least one module.");
  if (lessonCount < moduleCount * 2) {
    errors.push("Each module needs at least two lessons (instruction plus practice or check).");
  }

  const missingAnimation = teachableLessons.filter((l) => !lessonHasAnimation(l));
  if (missingAnimation.length) {
    errors.push(
      `${missingAnimation.length} lesson(s) lack instructional animation: ${missingAnimation
        .slice(0, 5)
        .map((l) => l.title)
        .join(", ")}${missingAnimation.length > 5 ? "…" : ""}.`,
    );
  }

  const teachingModuleCount = tree.modules.filter(
    (m) => !m.lessons.some((l) => l.content.type === "assessment"),
  ).length;
  const minBank = Math.max(15, teachingModuleCount * 3);
  if (questionBankCount < minBank) {
    errors.push(
      `Question bank has ${questionBankCount} items; need at least ${minBank} for this course size.`,
    );
  }

  if (!finalAssessmentDrawCount) {
    errors.push("Final assessment lesson is missing or has no draw count.");
  } else if (finalAssessmentDrawCount < Math.min(10, questionBankCount)) {
    const target = Math.min(10, questionBankCount);
    if (questionBankCount >= 3) {
      errors.push(
        `Final assessment draws ${finalAssessmentDrawCount} question(s); configure at least ${target} when the bank supports it.`,
      );
    }
  }

  if (questionBankCount < finalAssessmentDrawCount) {
    errors.push(
      `Final assessment draw count (${finalAssessmentDrawCount}) exceeds question bank (${questionBankCount}).`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      moduleCount,
      lessonCount,
      lessonsWithAnimation,
      questionBankCount,
      finalAssessmentDrawCount,
      passMark: tree.passMark,
    },
  };
}
