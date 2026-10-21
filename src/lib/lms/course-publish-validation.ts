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
  return lesson.content.type === "procedure_animation";
}

export function validateCourseForPublish(
  tree: LmsCourseTree,
  questionBankCount: number,
): CoursePublishValidation {
  const errors: string[] = [];
  const lessons = tree.modules.flatMap((m) => m.lessons);
  const moduleCount = tree.modules.length;
  const lessonCount = lessons.length;

  let finalAssessmentDrawCount = 0;
  for (const lesson of lessons) {
    if (lesson.content.type === "assessment") {
      finalAssessmentDrawCount = lesson.content.drawCount;
    }
  }

  const teachingModules = tree.modules.filter((m) => !m.lessons.some((l) => l.content.type === "assessment"));
  const teachableLessons = lessons.filter((l) => l.content.type !== "assessment");
  const lessonsWithAnimation = teachableLessons.filter((l) => lessonHasAnimation(l)).length;

  if (teachingModules.length < 1) {
    errors.push("Course must include at least one teaching module.");
  }

  for (const mod of teachingModules) {
    const modAnimations = mod.lessons.filter((l) => lessonHasAnimation(l)).length;
    if (modAnimations < 1) {
      errors.push(`Module "${mod.title}" is missing a procedure animation lesson.`);
    }
  }

  const minBank = Math.max(15, teachingModules.length * 3);
  if (questionBankCount < minBank) {
    errors.push(`Question bank has ${questionBankCount} items; need at least ${minBank}.`);
  }

  const targetDraw = Math.min(10, questionBankCount);
  if (!finalAssessmentDrawCount) {
    errors.push("Final assessment lesson is missing or has no draw count.");
  } else if (questionBankCount >= 10 && finalAssessmentDrawCount < 10) {
    errors.push(
      `Final assessment draws ${finalAssessmentDrawCount} questions; configure 10 when the bank has ${questionBankCount} items.`,
    );
  } else if (finalAssessmentDrawCount > questionBankCount) {
    errors.push(
      `Final assessment draw count (${finalAssessmentDrawCount}) exceeds question bank (${questionBankCount}).`,
    );
  }

  if ((tree.passMark ?? 80) !== 80 && finalAssessmentDrawCount > 0) {
    /* pass mark configurable — only warn if zero */
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      moduleCount,
      lessonCount,
      lessonsWithAnimation,
      questionBankCount,
      finalAssessmentDrawCount: finalAssessmentDrawCount || targetDraw,
      passMark: tree.passMark,
    },
  };
}
