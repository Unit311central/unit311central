/**
 * ABHI AI course generator — policy document → interactive LMS course tree.
 */

import {
  createOpenAIClient,
  getAssistantModel,
} from "@/lib/ai-operating-assistant/openai-client";
import { clipDocumentText } from "@/lib/document-extract";
import { ensureKnowledgeCheckLessons } from "@/lib/lms/ensure-document-knowledge-checks";
import { ensureProcedureAnimationLessons, countProcedureAnimationLessons } from "@/lib/lms/ensure-procedure-animations";
import { inferProcedureStepsFromDocument } from "@/lib/lms/procedure-animation-spec";
import {
  buildDocumentTemplateCourse,
  buildQuestionsFromDocument,
  LmsCourseGenerationError,
} from "@/lib/lms/document-template-course";
import { sanitizeCourseLessonInput } from "@/lib/lms/sanitize-lesson-content";
import type { LmsCourseCreateInput } from "@/lib/lms/types";

export { LmsCourseGenerationError } from "@/lib/lms/document-template-course";

export type LmsCourseGenerationSource = "ai" | "document_template";

export type GeneratedCourseDraft = LmsCourseCreateInput & {
  learningObjectives: string[];
  scenarioCount: number;
  assessmentCount: number;
  animationCount?: number;
  certificateEnabled: true;
  sourceFileName?: string;
  generationSource: LmsCourseGenerationSource;
};

function safeParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(body);
}

function defaultLearningObjectives(topic: string): string[] {
  return [
    `Apply the documented procedure for ${topic}`,
    "Recognise when escalation is required",
    "Record actions and outcomes as described in the source document",
    "Demonstrate understanding in the final assessment",
  ];
}

function normalizeAiDraft(
  raw: unknown,
  documentText: string,
  sourceFileName?: string,
  preferredTitle?: string,
): GeneratedCourseDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const title = String(obj.title ?? preferredTitle ?? "").trim();
  const modules = Array.isArray(obj.modules) ? obj.modules : null;
  if (!title || !modules?.length) return null;

  const steps = inferProcedureStepsFromDocument(documentText);
  const topic =
    preferredTitle?.trim() ||
    sourceFileName?.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]+/g, " ").trim() ||
    title;

  try {
    const mapped = obj as LmsCourseCreateInput;
    if (!mapped.modules?.every((m) => m.title && m.lessons?.length)) return null;
    const scenarioCount = mapped.modules.reduce(
      (n, m) =>
        n +
        m.lessons.filter((l) => l.lessonType === "scenario" || l.content?.type === "scenario")
          .length,
      0,
    );
    const assessmentCount = mapped.modules.reduce(
      (n, m) => n + m.lessons.filter((l) => l.lessonType === "assessment").length,
      0,
    );
    return {
      ...mapped,
      title,
      description: String(mapped.description || `Training course from ${sourceFileName || "uploaded document"}.`),
      category: mapped.category || "Compliance",
      durationMinutes: mapped.durationMinutes || 35,
      passMark: mapped.passMark || 80,
      status: "draft",
      generationSource: "ai",
      learningObjectives: Array.isArray(obj.learningObjectives)
        ? (obj.learningObjectives as string[]).map(String)
        : defaultLearningObjectives(topic),
      modules: mapped.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => sanitizeCourseLessonInput(lesson)),
      })),
      questions:
        mapped.questions?.length ? mapped.questions : buildQuestionsFromDocument(topic, steps),
      scenarioCount,
      assessmentCount: assessmentCount || 1,
      animationCount: countProcedureAnimationLessons(mapped),
      certificateEnabled: true,
      sourceFileName,
    };
  } catch {
    return null;
  }
}

export async function generateAbhiCourseFromDocument(options: {
  documentText: string;
  sourceFileName?: string;
  preferredTitle?: string;
}): Promise<GeneratedCourseDraft> {
  const text = clipDocumentText(options.documentText);

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new LmsCourseGenerationError(
      "AI course generation is not configured (missing OPENAI_API_KEY). Upload cannot be turned into a full course without AI.",
      "missing_ai",
    );
  }

  const templateFallback = () =>
    buildDocumentTemplateCourse(text, options.sourceFileName, options.preferredTitle);

  try {
    const client = createOpenAIClient();
    const response = await client.chat.completions.create({
      model: getAssistantModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an instructional designer for compliance and operations training (health, impact investing, portfolio governance).
Create a modern interactive training course JSON from a policy/guidance document.
Return ONLY JSON matching:
{
  "title": string,
  "description": string,
  "category": string,
  "durationMinutes": number,
  "passMark": 80,
  "learningObjectives": string[],
  "modules": [{
    "title": string,
    "summary": string,
    "lessons": [{
      "title": string,
      "lessonType": "rich_text"|"infographic"|"procedure_animation"|"knowledge_check"|"scenario"|"drag_drop"|"narration"|"interactive_cards"|"assessment",
      "estimatedMinutes": number,
      "content": object // must include "type" matching lessonType; use existing LMS shapes
    }]
  }],
  "questions": [{
    "questionType": "multiple_choice"|"true_false"|"scenario",
    "stem": string,
    "choices": [{"id":"a","label":string},...],
    "correctChoiceId": string,
    "explanation": string,
    "difficulty": "easy"|"medium"|"hard"
  }]
}
Rules:
- Stay faithful to the uploaded document — use its terminology, roles, escalation paths, and step order.
- 3–5 modules. Mix explain → visual → interaction → scenario where the document supports it.
- Include realistic scenarios grounded in the document (not generic industry filler).
- Include infographic with layout "flow" or "steps".
- Include at least ONE procedure_animation lesson when the document describes multi-step procedures, escalation, decision paths, or workflows. Use faithful labels from the document (no invented steps).
- procedure_animation content shape:
  { "type":"procedure_animation", "title": string, "spec": {
      "version": 1,
      "title": string,
      "subtitle"?: string,
      "layout": "linear"|"decision_tree"|"pipeline",
      "nodes": [{ "id", "label", "description"?, "kind": "start"|"step"|"decision"|"end"|"actor" }],
      "edges": [{ "id", "from", "to", "label"? }],
      "playbackOrder"?: string[]
  }}
- Final module must include assessment lesson (drawCount 8, passMark 80, questionBankScope "course").
- Provide at least 8 question bank items.
- Keep rich_text short (no walls of text).
- Do not invent illegal instructions; stay faithful to the document principles.
- CRITICAL content shapes (do not invent alternate keys):
  - rich_text: { "type":"rich_text", "title":string, "blocks":[{ "kind":"heading"|"paragraph"|"bullet_list"|"callout", ... }] }
  - infographic: { "type":"infographic", "layout":"flow"|"steps", "items":[{ "id", "label", "body" }] }
  - knowledge_check: { "type":"knowledge_check", "prompt", "choices":[{ "id","label" }], "correctId", "explanation" }
  - scenario: { "type":"scenario", "story", "choices":[{ "id","label","correct","feedback" }] }
  - drag_drop: { "type":"drag_drop", "prompt", "mode":"match"|"sort", "zones":[{ "id","label" }], "items":[{ "id","label","correctZoneId" }] }
  - Never use top-level "text", "elements", "description", or "questions" inside a lesson content object.`,
        },
        {
          role: "user",
          content: `Source file: ${options.sourceFileName || "policy.pdf"}\nPreferred title: ${options.preferredTitle || "(infer)"}\n\nDOCUMENT:\n${text}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || "";
    const parsed = safeParseJson(raw);
    const normalized = normalizeAiDraft(
      parsed,
      text,
      options.sourceFileName,
      options.preferredTitle,
    );
    if (normalized) {
      const hasAssessment = normalized.modules.some((m) =>
        m.lessons.some((l) => l.lessonType === "assessment"),
      );
      if (!hasAssessment) {
        const template = templateFallback();
        normalized.modules.push(template.modules[template.modules.length - 1]!);
        normalized.assessmentCount = 1;
      }
      if (!normalized.questions?.length) {
        const topic = options.preferredTitle || normalized.title;
        normalized.questions = buildQuestionsFromDocument(
          topic,
          inferProcedureStepsFromDocument(text),
        );
      }
      const withAnimations = ensureKnowledgeCheckLessons(
        ensureProcedureAnimationLessons(normalized, text),
        text,
      );
      return {
        ...withAnimations,
        generationSource: "ai",
        learningObjectives: normalized.learningObjectives,
        scenarioCount: normalized.scenarioCount,
        assessmentCount: normalized.assessmentCount,
        animationCount:
          withAnimations.animationCount ?? countProcedureAnimationLessons(withAnimations),
        certificateEnabled: true,
        sourceFileName: normalized.sourceFileName,
      };
    }
  } catch {
    /* use document template */
  }

  const template = templateFallback();
  const withAnimations = ensureKnowledgeCheckLessons(
    ensureProcedureAnimationLessons(template, text),
    text,
  );
  return {
    ...withAnimations,
    learningObjectives: template.learningObjectives,
    scenarioCount: template.scenarioCount,
    assessmentCount: template.assessmentCount,
    certificateEnabled: true,
    sourceFileName: template.sourceFileName,
    generationSource: "document_template",
    animationCount: withAnimations.animationCount ?? countProcedureAnimationLessons(withAnimations),
  };
}

export function summarizeGeneratedCourse(draft: GeneratedCourseDraft) {
  const lessonCount = draft.modules.reduce((n, m) => n + m.lessons.length, 0);
  return {
    title: draft.title,
    durationMinutes: draft.durationMinutes ?? 35,
    moduleCount: draft.modules.length,
    lessonCount,
    scenarioCount: draft.scenarioCount,
    assessmentCount: draft.assessmentCount,
    animationCount: draft.animationCount ?? countProcedureAnimationLessons(draft),
    questionCount: draft.questions?.length ?? 0,
    certificateEnabled: true as const,
    learningObjectives: draft.learningObjectives,
    generationSource: draft.generationSource,
    templateFallback: draft.generationSource === "document_template",
  };
}
