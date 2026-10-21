import { inferProcedureStepsFromDocument } from "@/lib/lms/procedure-animation-spec";
import type { CourseDraftWithAnimations } from "@/lib/lms/ensure-procedure-animations";
import type { LessonContent } from "@/lib/lms/types";

function choice(id: string, label: string) {
  return { id, label };
}

function knowledgeCheckContent(
  prompt: string,
  correct: string,
  wrong: string[],
  explanation: string,
): LessonContent {
  const choices = [
    choice("a", correct),
    ...wrong.slice(0, 3).map((w, i) => choice(String.fromCharCode(98 + i), w)),
  ];
  return {
    type: "knowledge_check",
    prompt,
    choices,
    correctId: "a",
    explanation,
  };
}

export function countKnowledgeCheckLessons(
  draft: Pick<CourseDraftWithAnimations, "modules">,
): number {
  return draft.modules.reduce(
    (n, mod) =>
      n +
      mod.lessons.filter(
        (l) => l.lessonType === "knowledge_check" || l.content?.type === "knowledge_check",
      ).length,
    0,
  );
}

const MIN_KNOWLEDGE_CHECKS = 2;

/**
 * AI drafts often put document questions only in the assessment bank.
 * Learners need in-flow knowledge_check lessons tied to procedure steps.
 */
export function ensureKnowledgeCheckLessons(
  draft: CourseDraftWithAnimations,
  documentText: string,
): CourseDraftWithAnimations {
  if (countKnowledgeCheckLessons(draft) >= MIN_KNOWLEDGE_CHECKS) {
    return draft;
  }

  const steps = inferProcedureStepsFromDocument(documentText);
  if (steps.length < 1) return draft;

  const firstStep = steps[0]!;
  const escalationStep =
    steps.find((s) => /escalat|severity|high|compliance|manager|notify/i.test(s)) ??
    steps[1] ??
    firstStep;

  const lessonsToAdd = [
    {
      title: "Knowledge check — procedure steps",
      lessonType: "knowledge_check" as const,
      estimatedMinutes: 2,
      content: knowledgeCheckContent(
        "According to the uploaded procedure, what is the first step you should take?",
        firstStep,
        [
          "Ignore the issue until a formal audit",
          "Close the case without recording details",
          "Skip notification to management",
        ],
        `The procedure begins with: ${firstStep}`,
      ),
    },
    {
      title: "Knowledge check — escalation",
      lessonType: "knowledge_check" as const,
      estimatedMinutes: 2,
      content: knowledgeCheckContent(
        "Which step from the document best matches escalation or severity handling?",
        escalationStep,
        [
          "Wait until the incident is mentioned in the media",
          "Only escalate if a regulator contacts you first",
          "Document the incident after closing without an owner",
        ],
        `The document states: ${escalationStep}`,
      ),
    },
  ];

  const modules = draft.modules.map((mod) => ({ ...mod, lessons: [...mod.lessons] }));
  const animModuleIndex = modules.findIndex((mod) =>
    mod.lessons.some((l) => l.lessonType === "procedure_animation"),
  );
  const targetIndex = animModuleIndex >= 0 ? animModuleIndex : 0;
  const target = modules[targetIndex];
  if (!target) return draft;

  const animIndex = target.lessons.findIndex((l) => l.lessonType === "procedure_animation");
  const insertAt = animIndex >= 0 ? animIndex + 1 : target.lessons.length;
  target.lessons.splice(insertAt, 0, ...lessonsToAdd);

  return { ...draft, modules };
}
