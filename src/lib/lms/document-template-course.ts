/**
 * Deterministic course draft from extracted document text (no LLM).
 * Used only when AI generation fails — must be labeled as a template in the UI.
 */

import {
  buildLinearProcedureSpecFromSteps,
  inferProcedureStepsFromDocument,
} from "@/lib/lms/procedure-animation-spec";
import type { LmsCourseCreateInput, LessonContent } from "@/lib/lms/types";

export type DocumentTemplateCourseDraft = LmsCourseCreateInput & {
  learningObjectives: string[];
  scenarioCount: number;
  assessmentCount: number;
  animationCount?: number;
  certificateEnabled: true;
  sourceFileName?: string;
  generationSource: "document_template";
};

type QuestionInput = NonNullable<LmsCourseCreateInput["questions"]>[number];

export class LmsCourseGenerationError extends Error {
  readonly code: "missing_ai" | "document_unusable";

  constructor(message: string, code: "missing_ai" | "document_unusable") {
    super(message);
    this.name = "LmsCourseGenerationError";
    this.code = code;
  }
}

function choice(id: string, label: string) {
  return { id, label };
}

function kc(
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

export function buildQuestionsFromDocument(
  topic: string,
  steps: string[],
): QuestionInput[] {
  const pool = steps.length >= 2 ? steps : [topic, "Follow the documented procedure", "Record and escalate when required"];
  const questions: QuestionInput[] = [];

  for (let i = 0; i < pool.length && questions.length < 8; i += 1) {
    const step = pool[i]!;
    const stem = `According to the procedure, which statement best describes this step: "${step.slice(0, 120)}"?`;
    questions.push({
      questionType: "multiple_choice",
      stem,
      choices: [
        choice("a", step),
        choice("b", "Skip documentation and proceed informally"),
        choice("c", "Defer action until the next quarterly review"),
        choice("d", "Ignore escalation rules for low-visibility issues"),
      ],
      correctChoiceId: "a",
      explanation: `The uploaded procedure specifies: ${step}`,
      difficulty: i < 2 ? "easy" : "medium",
    });
  }

  while (questions.length < 8) {
    const n = questions.length + 1;
    questions.push({
      questionType: "true_false",
      stem: `True or false: Step ${n} of "${topic}" should be followed as written in the source document.`,
      choices: [choice("a", "True"), choice("b", "False")],
      correctChoiceId: "a",
      explanation: "Training reflects the uploaded procedure; follow documented steps.",
      difficulty: "easy",
    });
  }

  return questions;
}

/** Document-only template — not a substitute for full AI generation. */
export function buildDocumentTemplateCourse(
  docText: string,
  sourceFileName?: string,
  preferredTitle?: string,
): DocumentTemplateCourseDraft {
  const steps = inferProcedureStepsFromDocument(docText);
  if (steps.length < 2) {
    throw new LmsCourseGenerationError(
      "Could not infer procedure steps from this document. Add numbered steps or use a text-based PDF.",
      "document_unusable",
    );
  }

  const titleGuess =
    preferredTitle?.trim() ||
    sourceFileName?.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]+/g, " ").trim() ||
    "Procedure training";
  const topic = titleGuess;
  const snippet = docText.replace(/\s+/g, " ").slice(0, 320);
  const procedureSpec = buildLinearProcedureSpecFromSteps(
    `${topic} — procedure flow`,
    steps,
    "Steps taken from the uploaded document.",
  );
  const firstStep = steps[0]!;
  const escalationStep =
    steps.find((s) => /escalat|severity|high|compliance|manager/i.test(s)) ?? steps[1] ?? firstStep;

  const draft: DocumentTemplateCourseDraft = {
    title: `${topic} — Interactive Training`,
    description: `Template course built from ${sourceFileName || "uploaded document"} (AI unavailable). ${snippet}`,
    category: "Compliance",
    durationMinutes: 30,
    passMark: 80,
    certificatePrefix: "TAL",
    status: "draft",
    generationSource: "document_template",
    learningObjectives: [
      `Follow the documented steps for ${topic}`,
      "Classify severity and escalate when the procedure requires it",
      "Record incidents and actions in the central register",
      "Complete the assessment to confirm understanding",
    ],
    modules: [
      {
        title: "Procedure overview",
        summary: "Key steps from your uploaded document.",
        lessons: [
          {
            title: "What this procedure covers",
            lessonType: "rich_text",
            estimatedMinutes: 4,
            content: {
              type: "rich_text",
              title: topic,
              blocks: [
                { kind: "heading", level: 2, text: topic },
                {
                  kind: "paragraph",
                  text: "This template course is generated directly from the uploaded procedure text. Review each step, watch the animated walkthrough, and complete the knowledge checks.",
                },
                {
                  kind: "callout",
                  tone: "warning",
                  title: "Template mode",
                  text:
                    "Full AI course generation was unavailable. Content is limited to steps detected in your document — edit or regenerate when AI is available.",
                },
                { kind: "bullet_list", items: steps.slice(0, 6) },
              ],
            },
          },
          {
            title: "Procedure walkthrough (animated)",
            lessonType: "procedure_animation",
            estimatedMinutes: 4,
            content: {
              type: "procedure_animation",
              title: procedureSpec.title,
              spec: procedureSpec,
            },
          },
          {
            title: "Knowledge check — first step",
            lessonType: "knowledge_check",
            estimatedMinutes: 2,
            content: kc(
              `What is the first documented step in this procedure?`,
              firstStep,
              [
                "Ignore the issue until a formal audit",
                "Close the case without recording details",
                "Skip notification to management",
              ],
              `The procedure begins with: ${firstStep}`,
            ),
          },
        ],
      },
      {
        title: "Apply the procedure",
        summary: "Escalation and recording.",
        lessons: [
          {
            title: "Escalation and recording",
            lessonType: "knowledge_check",
            estimatedMinutes: 3,
            content: kc(
              "Which step from the document best matches escalation or severity handling?",
              escalationStep,
              [
                "Wait until the incident is mentioned in the media",
                "Only escalate if a regulator contacts you first",
                "Document the incident after closing the case without an owner",
              ],
              `The document states: ${escalationStep}`,
            ),
          },
          {
            title: "Step sequence",
            lessonType: "infographic",
            estimatedMinutes: 3,
            content: {
              type: "infographic",
              title: "Procedure sequence",
              layout: "steps",
              items: steps.slice(0, 6).map((body, index) => ({
                id: String(index + 1),
                label: `Step ${index + 1}`,
                body,
              })),
            },
          },
        ],
      },
      {
        title: "Final assessment",
        summary: "Question bank from document steps.",
        lessons: [
          {
            title: "Final assessment",
            lessonType: "assessment",
            estimatedMinutes: 12,
            content: {
              type: "assessment",
              drawCount: Math.min(8, steps.length + 2),
              passMark: 80,
              questionBankScope: "course",
            },
          },
        ],
      },
    ],
    questions: buildQuestionsFromDocument(topic, steps),
    scenarioCount: 0,
    assessmentCount: 1,
    animationCount: 1,
    certificateEnabled: true,
    sourceFileName,
  };

  return draft;
}
