import {
  buildInstructionalAnimationContent,
  type InstructionalAnimationStep,
} from "@/lib/lms/instructional-animation";
import { sanitizeCourseLessonInput } from "@/lib/lms/sanitize-lesson-content";
import type { LessonContent, LmsCourseCreateInput } from "@/lib/lms/types";

export type CourseDraft = LmsCourseCreateInput & {
  learningObjectives?: string[];
  scenarioCount?: number;
  assessmentCount?: number;
  certificateEnabled?: boolean;
  sourceFileName?: string;
};

function textFromLessonContent(content: LessonContent): string {
  switch (content.type) {
    case "rich_text":
      return content.blocks.map((b) => ("text" in b ? b.text : "")).join(" ");
    case "infographic":
      return content.items.map((i) => `${i.label} ${i.body}`).join(" ");
    case "narration":
      return content.script;
    case "scenario":
      return `${content.story} ${content.choices.map((c) => c.label).join(" ")}`;
    case "knowledge_check":
      return `${content.prompt} ${content.explanation}`;
    case "instructional_animation":
      return content.steps.map((s) => `${s.heading} ${s.body}`).join(" ");
    default:
      return "";
  }
}

function stepsFromText(title: string, body: string, partCount = 3): InstructionalAnimationStep[] {
  const sentences = body
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (!sentences.length) {
    return [
      {
        id: "step-1",
        heading: title,
        body: body.trim() || "Review the key ideas in this lesson.",
      },
    ];
  }
  const per = Math.max(1, Math.ceil(sentences.length / partCount));
  const steps: InstructionalAnimationStep[] = [];
  for (let i = 0; i < sentences.length; i += per) {
    const chunk = sentences.slice(i, i + per).join(" ");
    steps.push({
      id: `step-${steps.length + 1}`,
      heading: i === 0 ? title : `${title} · part ${steps.length + 1}`,
      body: chunk,
    });
  }
  return steps.slice(0, 6);
}

function animationLessonFromContent(
  title: string,
  content: LessonContent,
  promptEcho: string,
): { lessonType: "instructional_animation"; content: LessonContent; estimatedMinutes?: number } {
  let steps: InstructionalAnimationStep[] = [];
  if (content.type === "instructional_animation") {
    return {
      lessonType: "instructional_animation",
      content,
      estimatedMinutes: Math.max(3, Math.ceil(content.spec.durationMs / 60_000)),
    };
  }
  if (content.type === "infographic") {
    steps = content.items.map((item, i) => ({
      id: item.id || `step-${i + 1}`,
      heading: item.label,
      body: item.body,
    }));
  } else {
    const body = textFromLessonContent(content);
    steps = stepsFromText(title, body);
  }
  const built = buildInstructionalAnimationContent({
    title,
    synopsis: textFromLessonContent(content).slice(0, 280),
    steps,
    promptEcho,
  });
  return {
    lessonType: "instructional_animation",
    content: built,
    estimatedMinutes: Math.max(3, Math.ceil(built.spec.durationMs / 60_000)),
  };
}

/** Ensure every teachable lesson has instructional_animation; normalize assessment draw counts. */
export function finalizeCourseDraft(draft: CourseDraft, sourceEcho: string): CourseDraft {
  const passMark = draft.passMark ?? 80;
  const modules = draft.modules.map((mod) => {
    const lessons = mod.lessons.flatMap((lesson) => {
      const sanitized = sanitizeCourseLessonInput(lesson);
      if (sanitized.lessonType === "assessment" || sanitized.content.type === "assessment") {
        const drawCount = Math.min(
          10,
          Math.max(
            3,
            sanitized.content.type === "assessment"
              ? Math.max(10, sanitized.content.drawCount)
              : 10,
          ),
        );
        return [
          {
            ...sanitized,
            content: {
              type: "assessment",
              drawCount,
              passMark,
              questionBankScope: "course",
            },
          },
        ];
      }

      const animated = animationLessonFromContent(
        sanitized.title,
        sanitized.content,
        `${sourceEcho} · ${mod.title} · ${sanitized.title}`,
      );

      if (sanitized.content.type === "instructional_animation") {
        return [sanitizeCourseLessonInput({ ...sanitized, ...animated })];
      }

      if (sanitized.lessonType === "knowledge_check" && sanitized.content.type === "knowledge_check") {
        const kcAnim = buildInstructionalAnimationContent({
          title: sanitized.title,
          synopsis: sanitized.content.prompt,
          steps: [
            {
              id: "kc-1",
              heading: "Check your understanding",
              body: sanitized.content.prompt,
            },
            {
              id: "kc-2",
              heading: "Why this matters",
              body: sanitized.content.explanation,
            },
          ],
          promptEcho: `${sourceEcho} · ${sanitized.title}`,
        });
        return [
          sanitizeCourseLessonInput({
            title: `${sanitized.title} — walkthrough`,
            lessonType: "instructional_animation",
            content: animated.content,
            estimatedMinutes: animated.estimatedMinutes,
          }),
          sanitizeCourseLessonInput({
            ...sanitized,
            lessonType: "instructional_animation",
            content: kcAnim,
            estimatedMinutes: 3,
          }),
        ];
      }

      if (
        sanitized.lessonType === "scenario" ||
        sanitized.lessonType === "drag_drop"
      ) {
        return [
          sanitizeCourseLessonInput({
            title: `${sanitized.title} — walkthrough`,
            lessonType: "instructional_animation",
            content: animated.content,
            estimatedMinutes: animated.estimatedMinutes,
          }),
          sanitized,
        ];
      }

      return [
        sanitizeCourseLessonInput({
          ...sanitized,
          lessonType: "instructional_animation",
          content: animated.content,
          estimatedMinutes: animated.estimatedMinutes ?? sanitized.estimatedMinutes,
        }),
      ];
    });
    return { ...mod, lessons };
  });

  const questionCount = draft.questions?.length ?? 0;
  const teachingModuleCount = modules.filter(
    (m) => !m.lessons.some((l) => l.content.type === "assessment"),
  ).length;
  const minBank = Math.max(15, teachingModuleCount * 3);

  let questions = draft.questions ?? [];
  if (questionCount < minBank) {
    throw new Error(
      `Course generation produced ${questionCount} assessment questions; need at least ${minBank}. Regenerate from the source PDF.`,
    );
  }

  const scenarioCount = modules.reduce(
    (n, m) =>
      n +
      m.lessons.filter(
        (l) => l.lessonType === "scenario" || l.content.type === "scenario",
      ).length,
    0,
  );
  const assessmentCount = modules.reduce(
    (n, m) => n + m.lessons.filter((l) => l.lessonType === "assessment").length,
    0,
  );

  return {
    ...draft,
    passMark,
    modules,
    questions,
    scenarioCount,
    assessmentCount: assessmentCount || 1,
  };
}

export function summarizeDraftCounts(draft: LmsCourseCreateInput & { questions?: unknown[] }) {
  const lessonCount = draft.modules.reduce((n, m) => n + m.lessons.length, 0);
  const animationLessons = draft.modules.reduce(
    (n, m) =>
      n + m.lessons.filter((l) => l.content.type === "instructional_animation").length,
    0,
  );
  let finalAssessmentDrawCount = 0;
  for (const mod of draft.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.content.type === "assessment") {
        finalAssessmentDrawCount = lesson.content.drawCount;
      }
    }
  }
  return {
    moduleCount: draft.modules.length,
    lessonCount,
    animationLessonCount: animationLessons,
    questionBankCount: draft.questions?.length ?? 0,
    finalAssessmentDrawCount,
    passMark: draft.passMark ?? 80,
  };
}
