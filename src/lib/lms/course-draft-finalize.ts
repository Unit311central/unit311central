import {
  buildLinearProcedureSpecFromSteps,
  inferProcedureStepsFromDocument,
} from "@/lib/lms/procedure-animation-spec";
import { buildQuestionsFromDocument } from "@/lib/lms/document-template-course";
import type { LmsCourseCreateInput } from "@/lib/lms/types";
import { countProcedureAnimationLessons } from "@/lib/lms/ensure-procedure-animations";

export type FinalizableCourseDraft = LmsCourseCreateInput & {
  questions?: LmsCourseCreateInput["questions"];
  animationCount?: number;
};

const FINAL_ASSESSMENT_DRAW = 10;
const TARGET_BANK_MIN = 17;

function isAssessmentModule(mod: { lessons: { lessonType: string; content: { type: string } }[] }) {
  return mod.lessons.some((l) => l.lessonType === "assessment" || l.content.type === "assessment");
}

/** One procedure_animation per teaching module (minimum), using document steps. */
export function ensurePerModuleProcedureAnimations(
  draft: FinalizableCourseDraft,
  documentText: string,
): FinalizableCourseDraft {
  const steps = inferProcedureStepsFromDocument(documentText);
  if (steps.length < 2) {
    return { ...draft, animationCount: countProcedureAnimationLessons(draft) };
  }

  const modules = draft.modules.map((mod, moduleIndex) => {
    if (isAssessmentModule(mod)) return mod;
    const hasAnimation = mod.lessons.some(
      (l) => l.lessonType === "procedure_animation" || l.content.type === "procedure_animation",
    );
    if (hasAnimation) return mod;

    const sliceStart = Math.min(
      steps.length - 2,
      Math.floor((moduleIndex / Math.max(1, draft.modules.length - 1)) * (steps.length - 2)),
    );
    const slice = steps.slice(sliceStart, sliceStart + Math.min(4, steps.length - sliceStart));
    const spec = buildLinearProcedureSpecFromSteps(
      `${mod.title} — animated walkthrough`,
      slice.length >= 2 ? slice : steps.slice(0, 4),
      "Steps taken from the uploaded source document.",
    );
    const animationLesson = {
      title: `${mod.title} — procedure animation`,
      lessonType: "procedure_animation" as const,
      estimatedMinutes: 4,
      content: {
        type: "procedure_animation" as const,
        title: spec.title,
        spec,
      },
    };
    return { ...mod, lessons: [animationLesson, ...mod.lessons] };
  });

  return {
    ...draft,
    modules,
    animationCount: countProcedureAnimationLessons({ modules }),
  };
}

export function ensureAssessmentAndQuestionBank(
  draft: FinalizableCourseDraft,
  documentText: string,
  topic: string,
): FinalizableCourseDraft {
  const steps = inferProcedureStepsFromDocument(documentText);
  let questions = draft.questions?.length ? [...draft.questions] : buildQuestionsFromDocument(topic, steps);

  while (questions.length < TARGET_BANK_MIN && steps.length > 0) {
    const step = steps[questions.length % steps.length]!;
    questions.push({
      questionType: questions.length % 3 === 0 ? "true_false" : "multiple_choice",
      stem: `According to the source document, which statement is correct about: "${step.slice(0, 100)}"?`,
      choices:
        questions.length % 3 === 0
          ? [{ id: "a", label: "True" }, { id: "b", label: "False" }]
          : [
              { id: "a", label: step.slice(0, 120) },
              { id: "b", label: "Defer escalation until the next leadership meeting" },
              { id: "c", label: "Skip documentation for low-visibility issues" },
              { id: "d", label: "Handle informally without records" },
            ],
      correctChoiceId: "a",
      explanation: `The source procedure states: ${step}`,
      difficulty: "medium",
    });
  }

  const modules = draft.modules.map((mod) => ({
    ...mod,
    lessons: mod.lessons.map((lesson) => {
      if (lesson.content.type !== "assessment") return lesson;
      const drawCount = Math.min(FINAL_ASSESSMENT_DRAW, questions.length);
      return {
        ...lesson,
        content: {
          ...lesson.content,
          drawCount,
          passMark: 80,
        },
      };
    }),
  }));

  return {
    ...draft,
    modules,
    questions,
    passMark: draft.passMark ?? 80,
    animationCount: countProcedureAnimationLessons({ modules }),
  };
}

function choice(id: string, label: string) {
  return { id, label };
}

/** Expand thin template drafts toward five teaching modules when the document supports it. */
export function ensureFiveTeachingModules(
  draft: FinalizableCourseDraft,
  documentText: string,
): FinalizableCourseDraft {
  const steps = inferProcedureStepsFromDocument(documentText);
  if (steps.length < 4) return draft;

  const teaching = draft.modules.filter((m) => !isAssessmentModule(m));
  if (teaching.length >= 5) return draft;

  const assessmentModules = draft.modules.filter((m) => isAssessmentModule(m));
  const newTeaching = [];
  for (let i = 0; i < 5; i += 1) {
    const chunk = steps.filter((_, idx) => idx % 5 === i);
    const fallback = [steps[i % steps.length]!, steps[(i + 1) % steps.length]!].filter(Boolean);
    const moduleSteps = chunk.length >= 1 ? chunk : fallback;
    const title = moduleSteps[0]!.slice(0, 72);
    const stepLessons = moduleSteps.map((step, stepIndex) => {
      const stepSpec = buildLinearProcedureSpecFromSteps(
        `Step ${stepIndex + 1}`,
        [step, moduleSteps[stepIndex + 1] ?? step],
        "Animated explanation from the source document.",
      );
      return {
        title: `${title} — step ${stepIndex + 1} animation`,
        lessonType: "procedure_animation" as const,
        estimatedMinutes: 3,
        content: {
          type: "procedure_animation" as const,
          title: stepSpec.title,
          spec: stepSpec,
        },
      };
    });

    newTeaching.push({
      title: `Module ${i + 1}: ${title}`,
      summary: moduleSteps.join(" "),
      lessons: [
        ...stepLessons,
        {
          title: `Knowledge check — module ${i + 1}`,
          lessonType: "knowledge_check" as const,
          estimatedMinutes: 2,
          content: {
            type: "knowledge_check" as const,
            prompt: `Which action matches the documented procedure in module ${i + 1}?`,
            choices: [
              choice("a", moduleSteps[0]!),
              choice("b", "Ignore the issue until leadership asks"),
              choice("c", "Skip documentation"),
              choice("d", "Defer escalation indefinitely"),
            ],
            correctId: "a",
            explanation: `The source document specifies: ${moduleSteps[0]}`,
          },
        },
      ],
    });
  }

  return {
    ...draft,
    modules: [...newTeaching, ...assessmentModules],
  };
}

/** Each knowledge_check lesson gets its own recap procedure_animation immediately before it. */
export function ensureKnowledgeCheckCompanionAnimations(
  draft: FinalizableCourseDraft,
  documentText: string,
): FinalizableCourseDraft {
  const steps = inferProcedureStepsFromDocument(documentText);
  const modules = draft.modules.map((mod) => {
    if (isAssessmentModule(mod)) return mod;
    const lessons: typeof mod.lessons = [];
    for (const lesson of mod.lessons) {
      if (lesson.content.type === "knowledge_check") {
        const kc = lesson.content;
        const focus =
          kc.choices.find((c) => c.id === kc.correctId)?.label ??
          steps[lessons.length % Math.max(1, steps.length)] ??
          kc.prompt;
        const spec = buildLinearProcedureSpecFromSteps(
          `Prepare for knowledge check`,
          [focus, kc.explanation ?? focus],
          "Animated recap before the in-lesson knowledge check.",
        );
        lessons.push({
          title: `${lesson.title} — instructional animation`,
          lessonType: "procedure_animation",
          estimatedMinutes: 2,
          content: {
            type: "procedure_animation",
            title: spec.title,
            spec,
          },
        });
      }
      lessons.push(lesson);
    }
    return { ...mod, lessons };
  });

  return {
    ...draft,
    modules,
    animationCount: countProcedureAnimationLessons({ modules }),
  };
}

export function finalizeGeneratedCourseDraft(
  draft: FinalizableCourseDraft,
  documentText: string,
  options?: { forceFiveModules?: boolean },
): FinalizableCourseDraft {
  const topic = draft.title;
  let next = draft;
  if (options?.forceFiveModules) {
    next = ensureFiveTeachingModules(next, documentText);
  }
  next = ensurePerModuleProcedureAnimations(next, documentText);
  next = ensureKnowledgeCheckCompanionAnimations(next, documentText);
  next = ensureAssessmentAndQuestionBank(next, documentText, topic);
  return next;
}

export function summarizeFinalizeStats(draft: FinalizableCourseDraft) {
  let finalDraw = 0;
  for (const mod of draft.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.content.type === "assessment") {
        finalDraw = lesson.content.drawCount;
      }
    }
  }
  const animationLessons = countProcedureAnimationLessons(draft);
  const lessonCount = draft.modules.reduce((n, m) => n + m.lessons.length, 0);
  return {
    moduleCount: draft.modules.length,
    lessonCount,
    animationLessonCount: animationLessons,
    questionBankCount: draft.questions?.length ?? 0,
    finalAssessmentDrawCount: finalDraw,
    passMark: draft.passMark ?? 80,
  };
}
