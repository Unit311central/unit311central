/**
 * ABHI AI course generator — policy document → interactive LMS course tree.
 */

import {
  createOpenAIClient,
  getAssistantModel,
} from "@/lib/ai-operating-assistant/openai-client";
import { clipDocumentText } from "@/lib/document-extract";
import { sanitizeCourseLessonInput } from "@/lib/lms/sanitize-lesson-content";
import type { LmsCourseCreateInput, LessonContent } from "@/lib/lms/types";

export type GeneratedCourseDraft = LmsCourseCreateInput & {
  learningObjectives: string[];
  scenarioCount: number;
  assessmentCount: number;
  certificateEnabled: true;
  sourceFileName?: string;
};

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

function buildFallbackCourse(docText: string, sourceFileName?: string): GeneratedCourseDraft {
  const titleGuess =
    sourceFileName?.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]+/g, " ").trim() ||
    "ABHI Policy Essentials";
  const snippet = docText.replace(/\s+/g, " ").slice(0, 280);
  const topic = titleGuess;

  return {
    title: `${topic} — Interactive Training`,
    description: `AI-generated ABHI compliance course from ${sourceFileName || "uploaded policy"}. ${snippet}`,
    category: "Compliance",
    durationMinutes: 35,
    passMark: 80,
    certificatePrefix: "ABHI-AI",
    status: "draft",
    learningObjectives: [
      `Understand the purpose of ${topic} at ABHI`,
      "Recognise high-risk situations involving members, NHS, and events",
      "Choose the correct escalation path when unsure",
      "Apply the policy in realistic HealthTech scenarios",
    ],
    modules: [
      {
        title: "Why this matters",
        summary: "Context and expectations for ABHI staff.",
        lessons: [
          {
            title: "What this policy protects",
            lessonType: "rich_text",
            estimatedMinutes: 4,
            content: {
              type: "rich_text",
              title: topic,
              blocks: [
                { kind: "heading", level: 2, text: `Welcome to ${topic}` },
                {
                  kind: "paragraph",
                  text: `This short interactive course turns the source document into practical ABHI guidance for HQ, working groups, NHS engagement, and international events.`,
                },
                {
                  kind: "callout",
                  tone: "info",
                  title: "How this works",
                  text: "Read a short explanation, review a visual, then decide a scenario. No walls of text.",
                },
                {
                  kind: "bullet_list",
                  items: [
                    "Keep decisions transparent",
                    "Escalate early when unsure",
                    "Document gifts, hospitality, and conflicts",
                    "Protect ABHI and member reputation",
                  ],
                },
              ],
            },
          },
          {
            title: "Policy journey",
            lessonType: "infographic",
            estimatedMinutes: 3,
            content: {
              type: "infographic",
              title: "Compliance journey",
              layout: "flow",
              items: [
                { id: "1", label: "Spot the risk", body: "Identify the situation before it escalates.", icon: "01" },
                { id: "2", label: "Check the rule", body: "Apply the policy principles from the document.", icon: "02" },
                { id: "3", label: "Decide / escalate", body: "Act, record, or ask Legal / Leadership.", icon: "03" },
                { id: "4", label: "Close the loop", body: "Document the outcome for audit readiness.", icon: "04" },
              ],
            },
          },
          {
            title: "Quick check",
            lessonType: "knowledge_check",
            estimatedMinutes: 2,
            content: kc(
              "When should you escalate a grey-area situation under this policy?",
              "As soon as you are unsure — early escalation is expected",
              [
                "Only after a complaint is filed",
                "Only if a member company asks you to",
                "Never escalate — use personal judgement",
              ],
              "ABHI expects early escalation for ambiguous gifts, hospitality, procurement influence, or data risks.",
            ),
          },
        ],
      },
      {
        title: "Real-world scenarios",
        summary: "Policy-based situations for ABHI HealthTech.",
        lessons: [
          {
            title: "Supplier hospitality during a review",
            lessonType: "scenario",
            estimatedMinutes: 4,
            content: {
              type: "scenario",
              story:
                "During a contract review for an ABHI event supplier, the account manager offers you VIP tickets to a Premier League match “to thank ABHI for the partnership discussion.” The review is still open.",
              character: { name: "Alex", role: "Events supplier manager" },
              choices: [
                {
                  id: "accept",
                  label: "Accept the tickets — it is relationship building",
                  correct: false,
                  feedback:
                    "Incorrect. Hospitality during an active commercial review creates a bribery / conflict risk. Decline and record the offer.",
                },
                {
                  id: "decline",
                  label: "Decline politely, log the offer, and continue the review on merit",
                  correct: true,
                  feedback:
                    "Correct. Declining and documenting protects ABHI and keeps the procurement process fair.",
                },
                {
                  id: "delay",
                  label: "Accept but decide after the contract is signed",
                  correct: false,
                  feedback:
                    "Incorrect. Timing does not remove the conflict if the offer was made during evaluation.",
                },
              ],
            },
          },
          {
            title: "NHS stakeholder dinner invite",
            lessonType: "scenario",
            estimatedMinutes: 4,
            content: {
              type: "scenario",
              story:
                "A member company invites you to an expensive dinner with an NHS procurement lead the night before a UK Pavilion briefing, saying it will “help ABHI’s influence.”",
              character: { name: "Priya", role: "Member company BD lead" },
              choices: [
                {
                  id: "go",
                  label: "Attend — ABHI should be in every influential room",
                  correct: false,
                  feedback:
                    "Incorrect. This can look like improper influence. Seek guidance and keep engagement transparent and appropriate.",
                },
                {
                  id: "guide",
                  label: "Decline the private dinner and propose a transparent ABHI-hosted briefing instead",
                  correct: true,
                  feedback:
                    "Correct. Prefer open, documented engagement over private hospitality around NHS decision-makers.",
                },
                {
                  id: "split",
                  label: "Attend if the member pays and ABHI stays silent",
                  correct: false,
                  feedback: "Incorrect. Silence does not remove the perception of influence.",
                },
              ],
            },
          },
          {
            title: "Match the response",
            lessonType: "drag_drop",
            estimatedMinutes: 3,
            content: {
              type: "drag_drop",
              prompt: "Match each situation to the right first response.",
              mode: "match",
              items: [
                { id: "i1", label: "Unsolicited luxury gift from a supplier", correctZoneId: "z1" },
                { id: "i2", label: "Unsure if a working lunch is allowed", correctZoneId: "z2" },
                { id: "i3", label: "Request to hide a hospitality entry", correctZoneId: "z3" },
              ],
              zones: [
                { id: "z1", label: "Decline & record" },
                { id: "z2", label: "Check policy / ask" },
                { id: "z3", label: "Escalate immediately" },
              ],
            },
          },
        ],
      },
      {
        title: "Final assessment",
        summary: "Question bank and certificate on pass.",
        lessons: [
          {
            title: "Voice recap",
            lessonType: "narration",
            estimatedMinutes: 2,
            content: {
              type: "narration",
              title: "Remember the essentials",
              script: `At ABHI, policies exist to protect our people, our members, and public trust. Spot the risk early, apply the rule, escalate when unsure, and always keep a clear record. You are ready for the final check.`,
              voiceHint: "ABHI coach",
            },
          },
          {
            title: "Final assessment",
            lessonType: "assessment",
            estimatedMinutes: 12,
            content: {
              type: "assessment",
              drawCount: 8,
              passMark: 80,
              questionBankScope: "course",
            },
          },
        ],
      },
    ],
    questions: [
      {
        questionType: "multiple_choice",
        stem: "What is the safest first step when a supplier offers hospitality during an open review?",
        choices: [
          choice("a", "Decline, record the offer, and continue on merit"),
          choice("b", "Accept if the value is under £500"),
          choice("c", "Accept and disclose only if asked later"),
          choice("d", "Ask a colleague to accept on your behalf"),
        ],
        correctChoiceId: "a",
        explanation: "Decline and document — never accept influence during evaluation.",
        difficulty: "easy",
      },
      {
        questionType: "true_false",
        stem: "True or false: If you are unsure whether an invitation is appropriate, you should escalate early.",
        choices: [choice("a", "True"), choice("b", "False")],
        correctChoiceId: "a",
        explanation: "Early escalation is expected at ABHI.",
        difficulty: "easy",
      },
      {
        questionType: "multiple_choice",
        stem: "Private dinners with NHS decision-makers arranged by a member around a Pavilion briefing are best handled by:",
        choices: [
          choice("a", "Attending quietly to gather intelligence"),
          choice("b", "Preferring transparent ABHI-hosted engagement instead"),
          choice("c", "Letting the member host without ABHI present"),
          choice("d", "Accepting only if no agenda is shared"),
        ],
        correctChoiceId: "b",
        explanation: "Transparent, documented engagement protects ABHI and the NHS relationship.",
        difficulty: "medium",
      },
      {
        questionType: "multiple_choice",
        stem: "Someone asks you not to log a hospitality entry. You should:",
        choices: [
          choice("a", "Escalate immediately"),
          choice("b", "Agree if they are senior"),
          choice("c", "Delete the entry after the event"),
          choice("d", "Wait until year-end audit"),
        ],
        correctChoiceId: "a",
        explanation: "Requests to hide records are a red flag.",
        difficulty: "medium",
      },
      {
        questionType: "true_false",
        stem: "True or false: Completing this course issues a certificate only if you meet the pass mark.",
        choices: [choice("a", "True"), choice("b", "False")],
        correctChoiceId: "a",
        explanation: "Certificates are issued on successful assessment.",
        difficulty: "easy",
      },
      {
        questionType: "multiple_choice",
        stem: "Which behaviour best reflects ABHI policy culture?",
        choices: [
          choice("a", "Personal judgement over documentation"),
          choice("b", "Transparent decisions with clear records"),
          choice("c", "Accept all member hospitality to be helpful"),
          choice("d", "Escalate only after damage occurs"),
        ],
        correctChoiceId: "b",
        explanation: "Transparency and records are core.",
        difficulty: "easy",
      },
      {
        questionType: "scenario",
        stem: "A WHX exhibitor offers expensive merchandise “for the ABHI team” during stand allocation discussions. Best response?",
        choices: [
          choice("a", "Accept for the team and distribute later"),
          choice("b", "Decline and keep allocation decisions separate from gifts"),
          choice("c", "Accept one item personally only"),
          choice("d", "Ask them to courier it to HQ unmarked"),
        ],
        correctChoiceId: "b",
        explanation: "Do not mix gifts with allocation or commercial decisions.",
        difficulty: "hard",
      },
      {
        questionType: "multiple_choice",
        stem: "If policy text and a live situation conflict, you should:",
        choices: [
          choice("a", "Ignore the policy for commercial urgency"),
          choice("b", "Pause and seek guidance before acting"),
          choice("c", "Follow the member company’s preference"),
          choice("d", "Decide alone and backfill later"),
        ],
        correctChoiceId: "b",
        explanation: "Pause and escalate — do not improvise under pressure.",
        difficulty: "medium",
      },
    ],
    scenarioCount: 2,
    assessmentCount: 1,
    certificateEnabled: true,
    sourceFileName,
  };
}

function safeParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(body);
}

function normalizeAiDraft(raw: unknown, sourceFileName?: string): GeneratedCourseDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const title = String(obj.title ?? "").trim();
  const modules = Array.isArray(obj.modules) ? obj.modules : null;
  if (!title || !modules?.length) return null;

  const fallback = buildFallbackCourse(title, sourceFileName);
  // Prefer AI structure when modules look usable; otherwise fallback.
  try {
    const mapped = obj as LmsCourseCreateInput;
    if (!mapped.modules?.every((m) => m.title && m.lessons?.length)) return null;
    const scenarioCount = mapped.modules.reduce(
      (n, m) => n + m.lessons.filter((l) => l.lessonType === "scenario" || l.content?.type === "scenario").length,
      0,
    );
    const assessmentCount = mapped.modules.reduce(
      (n, m) => n + m.lessons.filter((l) => l.lessonType === "assessment").length,
      0,
    );
    return {
      ...mapped,
      title,
      description: String(mapped.description || fallback.description),
      category: mapped.category || "Compliance",
      durationMinutes: mapped.durationMinutes || 35,
      passMark: mapped.passMark || 80,
      status: "draft",
      learningObjectives: Array.isArray(obj.learningObjectives)
        ? (obj.learningObjectives as string[]).map(String)
        : fallback.learningObjectives,
      modules: mapped.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => sanitizeCourseLessonInput(lesson)),
      })),
      questions: mapped.questions?.length ? mapped.questions : fallback.questions,
      scenarioCount: scenarioCount || fallback.scenarioCount,
      assessmentCount: assessmentCount || 1,
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
  const fallback = buildFallbackCourse(text, options.sourceFileName);
  if (options.preferredTitle) fallback.title = options.preferredTitle;

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return fallback;
  }

  try {
    const client = createOpenAIClient();
    const response = await client.chat.completions.create({
      model: getAssistantModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an instructional designer for ABHI (Association of British HealthTech Industries).
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
      "lessonType": "rich_text"|"infographic"|"knowledge_check"|"scenario"|"drag_drop"|"narration"|"interactive_cards"|"assessment",
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
- ABHI HealthTech context (members, NHS, UK Pavilion, WHX/Medica, working groups).
- 3–5 modules. Mix explain → visual → interaction → scenario every module.
- Include at least 2 realistic policy scenarios (not summaries).
- Include infographic with layout "flow" or "steps".
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
    const normalized = normalizeAiDraft(parsed, options.sourceFileName);
    if (normalized) {
      // Ensure assessment exists
      const hasAssessment = normalized.modules.some((m) =>
        m.lessons.some((l) => l.lessonType === "assessment"),
      );
      if (!hasAssessment) {
        normalized.modules.push(fallback.modules[fallback.modules.length - 1]!);
      }
      if (!normalized.questions?.length) normalized.questions = fallback.questions;
      return normalized;
    }
  } catch {
    /* use fallback */
  }

  return fallback;
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
    questionCount: draft.questions?.length ?? 0,
    certificateEnabled: true as const,
    learningObjectives: draft.learningObjectives,
  };
}
