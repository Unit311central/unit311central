import {
  buildLinearProcedureSpecFromSteps,
  inferProcedureStepsFromDocument,
} from "@/lib/lms/procedure-animation-spec";
import type { LmsCourseCreateInput } from "@/lib/lms/types";

export type CourseDraftWithAnimations = LmsCourseCreateInput & { animationCount?: number };

export function countProcedureAnimationLessons(
  draft: Pick<LmsCourseCreateInput, "modules">,
): number {
  return draft.modules.reduce(
    (n, mod) =>
      n +
      mod.lessons.filter(
        (l) =>
          l.lessonType === "procedure_animation" || l.content?.type === "procedure_animation",
      ).length,
    0,
  );
}

/** Guarantee at least one persisted animation spec when the document has procedural content. */
export function ensureProcedureAnimationLessons(
  draft: CourseDraftWithAnimations,
  documentText: string,
): CourseDraftWithAnimations {
  if (countProcedureAnimationLessons(draft) > 0) {
    return { ...draft, animationCount: countProcedureAnimationLessons(draft) };
  }

  const steps = inferProcedureStepsFromDocument(documentText);
  if (steps.length < 2) return { ...draft, animationCount: 0 };

  const targetModule =
    draft.modules.find((m) => /procedure|process|report|escalat|workflow|incident/i.test(m.title)) ??
    draft.modules[0];
  if (!targetModule) return { ...draft, animationCount: 0 };

  const spec = buildLinearProcedureSpecFromSteps(
    `${draft.title} — key steps`,
    steps,
    "Animated walkthrough generated from the uploaded document.",
  );

  const lesson = {
    title: "Procedure walkthrough (animated)",
    lessonType: "procedure_animation" as const,
    estimatedMinutes: 4,
    content: {
      type: "procedure_animation" as const,
      title: spec.title,
      spec,
    },
  };

  const modules = draft.modules.map((mod) =>
    mod === targetModule ? { ...mod, lessons: [...mod.lessons, lesson] } : mod,
  );

  return {
    ...draft,
    modules,
    animationCount: 1,
  };
}
