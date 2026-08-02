/**
 * Coerce AI / stored lesson JSON into shapes the LMS renderers can safely mount.
 * Never throw — fall back to a short rich_text lesson when structure is unusable.
 */

import type { LessonContent, LmsLessonType, RichTextBlock } from "@/lib/lms/types";
import { LMS_LESSON_TYPES } from "@/lib/lms/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function richTextFallback(title: string, body: string): LessonContent {
  const blocks: RichTextBlock[] = [
    { kind: "heading", level: 2, text: title || "Lesson" },
    {
      kind: "paragraph",
      text: body || "This lesson content could not be fully reconstructed. Continue to the next step.",
    },
  ];
  return { type: "rich_text", title: title || "Lesson", blocks };
}

function normalizeLessonType(raw: unknown, contentType?: unknown): LmsLessonType {
  const candidate = String(raw || contentType || "rich_text");
  return (LMS_LESSON_TYPES as readonly string[]).includes(candidate)
    ? (candidate as LmsLessonType)
    : "rich_text";
}

function sanitizeBlocks(raw: unknown, fallbackText = ""): RichTextBlock[] {
  const blocks = asArray<Record<string, unknown>>(raw)
    .map((block): RichTextBlock | null => {
      const kind = asString(block.kind);
      if (kind === "heading") {
        const level = Number(block.level);
        return {
          kind: "heading",
          text: asString(block.text, "Section"),
          level: level === 1 || level === 3 ? level : 2,
        };
      }
      if (kind === "paragraph") {
        return { kind: "paragraph", text: asString(block.text) };
      }
      if (kind === "bullet_list") {
        return {
          kind: "bullet_list",
          items: asArray<unknown>(block.items).map((item) => asString(item)).filter(Boolean),
        };
      }
      if (kind === "callout") {
        const tone = asString(block.tone);
        return {
          kind: "callout",
          title: block.title ? asString(block.title) : undefined,
          text: asString(block.text),
          tone: tone === "warning" || tone === "success" ? tone : "info",
        };
      }
      if (block.text) {
        return { kind: "paragraph", text: asString(block.text) };
      }
      return null;
    })
    .filter((b): b is RichTextBlock => Boolean(b));

  if (blocks.length) return blocks;
  if (fallbackText.trim()) {
    return [{ kind: "paragraph", text: fallbackText.trim() }];
  }
  return [{ kind: "paragraph", text: "Continue when you have reviewed this section." }];
}

/** Coerce common AI / alternate JSON shapes into LMS-native fields before typed sanitising. */
function coerceAiContentShape(
  lessonType: LmsLessonType,
  raw: Record<string, unknown>,
  lessonTitle: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw, type: raw.type || lessonType };

  // rich_text: { text } or { body } or { content } without blocks
  if (lessonType === "rich_text" || out.type === "rich_text") {
    if (!Array.isArray(out.blocks) || out.blocks.length === 0) {
      const text =
        asString(out.text) ||
        asString(out.body) ||
        asString(out.content) ||
        asString(out.summary);
      if (text) {
        out.blocks = [
          { kind: "heading", level: 2, text: asString(out.title, lessonTitle) },
          { kind: "paragraph", text },
        ];
      }
    }
  }

  // infographic: elements: string[] → items
  if (lessonType === "infographic" || out.type === "infographic") {
    if (!Array.isArray(out.items) || out.items.length === 0) {
      const elements = asArray<unknown>(out.elements);
      if (elements.length) {
        out.items = elements.map((el, i) => {
          if (typeof el === "string") {
            return { id: `item-${i + 1}`, label: el, body: el };
          }
          const row = asRecord(el) ?? {};
          return {
            id: asString(row.id, `item-${i + 1}`),
            label: asString(row.label || row.title || row.name, `Step ${i + 1}`),
            body: asString(row.body || row.text || row.description),
            icon: row.icon ? asString(row.icon) : undefined,
          };
        });
      }
      const data = asRecord(out.data);
      if (data && (!Array.isArray(out.items) || out.items.length === 0)) {
        out.items = Object.entries(data).map(([key, value], i) => ({
          id: `item-${i + 1}`,
          label: key,
          body: Array.isArray(value)
            ? value.map(String).join("; ")
            : typeof value === "object" && value
              ? JSON.stringify(value)
              : String(value ?? ""),
        }));
      }
    }
  }

  // scenario: description / prompt / situation → story; invent choices if missing
  if (lessonType === "scenario" || out.type === "scenario") {
    if (!asString(out.story)) {
      out.story =
        asString(out.description) ||
        asString(out.prompt) ||
        asString(out.situation) ||
        asString(out.scenario);
    }
    const choices = asArray<Record<string, unknown>>(out.choices);
    if (choices.length < 2) {
      out.choices = [
        {
          id: "a",
          label: "Follow ABHI / organisational policy, document the situation, and escalate if needed",
          correct: true,
          feedback: "Correct. Transparent process and escalation protect patients, members, and ABHI.",
        },
        {
          id: "b",
          label: "Handle it informally and move on without records",
          correct: false,
          feedback: "Incorrect. Informal handling leaves no audit trail and increases risk.",
        },
        {
          id: "c",
          label: "Ignore it unless a senior leader raises it first",
          correct: false,
          feedback: "Incorrect. Waiting for escalation delays action and may worsen harm.",
        },
      ];
    }
  }

  // knowledge_check: questions[{question,options,correctAnswer}] → first question
  if (lessonType === "knowledge_check" || out.type === "knowledge_check") {
    const choices = asArray<Record<string, unknown>>(out.choices);
    if (choices.length < 2) {
      const questions = asArray<Record<string, unknown>>(out.questions);
      const first = questions[0];
      if (first) {
        const options = asArray<unknown>(first.options || first.choices);
        out.prompt = asString(first.question || first.stem || first.prompt, lessonTitle);
        out.choices = options.map((opt, i) => {
          if (typeof opt === "string") {
            return { id: String.fromCharCode(97 + i), label: opt };
          }
          const row = asRecord(opt) ?? {};
          return {
            id: asString(row.id, String.fromCharCode(97 + i)),
            label: asString(row.label || row.text, `Option ${i + 1}`),
          };
        });
        const correct = asString(first.correctAnswer || first.correctId || first.correct_choice_id);
        const match = (out.choices as { id: string; label: string }[]).find(
          (c) => c.id === correct || c.label === correct,
        );
        out.correctId = match?.id || "a";
        out.explanation = asString(
          first.explanation,
          "Review the course material and try again.",
        );
      }
    }
  }

  // drag_drop: elements + correctOrder → zones/items sort
  if (lessonType === "drag_drop" || out.type === "drag_drop") {
    const zones = asArray<unknown>(out.zones);
    const items = asArray<unknown>(out.items);
    if (zones.length < 2 || items.length < 2) {
      const elements = asArray<unknown>(out.elements).map(String).filter(Boolean);
      const order = asArray<unknown>(out.correctOrder).map(String);
      if (elements.length >= 2) {
        out.prompt = asString(out.prompt, "Place each record type in the correct category.");
        out.mode = "match";
        out.zones = elements.map((label, i) => ({
          id: `zone-${i + 1}`,
          label,
          hint: "Match the record",
        }));
        // If correctOrder provided as ordering exercise, use ordered / unordered zones
        if (order.length >= 2 && order.every((o) => elements.includes(o))) {
          out.mode = "sort";
          out.zones = order.map((label, i) => ({
            id: `zone-${i + 1}`,
            label: `Step ${i + 1}`,
            hint: label,
          }));
          out.items = order.map((label, i) => ({
            id: `item-${i + 1}`,
            label,
            correctZoneId: `zone-${i + 1}`,
          }));
        } else {
          out.items = elements.map((label, i) => ({
            id: `item-${i + 1}`,
            label,
            correctZoneId: `zone-${i + 1}`,
          }));
        }
      }
    }
  }

  return out;
}

export function sanitizeLessonContent(
  lessonTypeInput: unknown,
  contentInput: unknown,
  lessonTitle = "Lesson",
): { lessonType: LmsLessonType; content: LessonContent } {
  const initial = asRecord(contentInput) ?? {};
  const lessonType = normalizeLessonType(lessonTypeInput, initial.type);
  const raw = coerceAiContentShape(lessonType, initial, lessonTitle);
  const type = normalizeLessonType(raw.type || lessonType, lessonType);

  try {
    switch (type) {
      case "rich_text":
        return {
          lessonType: "rich_text",
          content: {
            type: "rich_text",
            title: asString(raw.title, lessonTitle),
            blocks: sanitizeBlocks(
              raw.blocks,
              asString(raw.text) || asString(raw.body) || asString(raw.summary),
            ),
          },
        };
      case "infographic": {
        const items = asArray<Record<string, unknown>>(raw.items)
          .map((item, i) => ({
            id: asString(item.id, `item-${i + 1}`),
            label: asString(item.label, `Step ${i + 1}`),
            body: asString(item.body),
            icon: item.icon ? asString(item.icon) : undefined,
          }))
          .filter((item) => item.label);
        if (!items.length) break;
        const layout = asString(raw.layout);
        return {
          lessonType: "infographic",
          content: {
            type: "infographic",
            title: asString(raw.title, lessonTitle),
            layout: layout === "flow" || layout === "grid" ? layout : "steps",
            items,
          },
        };
      }
      case "knowledge_check": {
        const choices = asArray<Record<string, unknown>>(raw.choices)
          .map((c, i) => ({
            id: asString(c.id, String.fromCharCode(97 + i)),
            label: asString(c.label),
          }))
          .filter((c) => c.label);
        if (choices.length < 2) break;
        const correctId = asString(raw.correctId || raw.correct_id, choices[0]!.id);
        return {
          lessonType: "knowledge_check",
          content: {
            type: "knowledge_check",
            prompt: asString(raw.prompt, lessonTitle),
            choices,
            correctId: choices.some((c) => c.id === correctId) ? correctId : choices[0]!.id,
            explanation: asString(raw.explanation, "Review the policy guidance and try again."),
          },
        };
      }
      case "scenario": {
        const choices = asArray<Record<string, unknown>>(raw.choices)
          .map((c, i) => ({
            id: asString(c.id, String.fromCharCode(97 + i)),
            label: asString(c.label),
            correct: Boolean(c.correct),
            feedback: asString(c.feedback, c.correct ? "Good choice." : "Consider the policy carefully."),
          }))
          .filter((c) => c.label);
        if (!asString(raw.story) || choices.length < 2) break;
        const character = asRecord(raw.character);
        return {
          lessonType: "scenario",
          content: {
            type: "scenario",
            story: asString(raw.story),
            character: character
              ? {
                  name: asString(character.name, "Colleague"),
                  role: asString(character.role, "ABHI staff"),
                  imageUrl: character.imageUrl ? asString(character.imageUrl) : undefined,
                }
              : undefined,
            choices,
          },
        };
      }
      case "drag_drop": {
        const zones = asArray<Record<string, unknown>>(raw.zones)
          .map((z, i) => ({
            id: asString(z.id, `zone-${i + 1}`),
            label: asString(z.label, `Zone ${i + 1}`),
            hint: z.hint ? asString(z.hint) : undefined,
          }))
          .filter((z) => z.label);
        const items = asArray<Record<string, unknown>>(raw.items)
          .map((item, i) => ({
            id: asString(item.id, `item-${i + 1}`),
            label: asString(item.label, `Item ${i + 1}`),
            correctZoneId: asString(item.correctZoneId || item.correct_zone_id, zones[0]?.id || "zone-1"),
          }))
          .filter((item) => item.label);
        if (zones.length < 2 || items.length < 2) break;
        const mode = asString(raw.mode);
        return {
          lessonType: "drag_drop",
          content: {
            type: "drag_drop",
            prompt: asString(raw.prompt, "Drag each item into the correct zone."),
            mode: mode === "match" ? "match" : "sort",
            items,
            zones,
          },
        };
      }
      case "narration": {
        const script = asString(raw.script);
        if (!script) break;
        return {
          lessonType: "narration",
          content: {
            type: "narration",
            title: asString(raw.title, lessonTitle),
            script,
            audioUrl: raw.audioUrl ? asString(raw.audioUrl) : null,
            voiceHint: raw.voiceHint ? asString(raw.voiceHint) : undefined,
            autoplay: Boolean(raw.autoplay),
            highlights: asArray<Record<string, unknown>>(raw.highlights).map((h) => ({
              t: Number(h.t) || 0,
              text: asString(h.text),
            })),
          },
        };
      }
      case "interactive_cards": {
        const cards = asArray<Record<string, unknown>>(raw.cards)
          .map((c, i) => ({
            id: asString(c.id, `card-${i + 1}`),
            title: asString(c.title, `Card ${i + 1}`),
            summary: asString(c.summary),
            body: asString(c.body, asString(c.summary)),
            icon: c.icon ? asString(c.icon) : undefined,
          }))
          .filter((c) => c.title);
        if (!cards.length) break;
        return {
          lessonType: "interactive_cards",
          content: {
            type: "interactive_cards",
            intro: raw.intro ? asString(raw.intro) : undefined,
            cards,
          },
        };
      }
      case "assessment":
        return {
          lessonType: "assessment",
          content: {
            type: "assessment",
            drawCount: Math.max(1, Number(raw.drawCount) || 8),
            passMark: Math.min(100, Math.max(1, Number(raw.passMark) || 80)),
            questionBankScope:
              asString(raw.questionBankScope) === "module" ? "module" : "course",
          },
        };
      case "hotspot": {
        const regions = asArray<Record<string, unknown>>(raw.regions)
          .map((r, i) => ({
            id: asString(r.id, `region-${i + 1}`),
            label: asString(r.label, `Area ${i + 1}`),
            x: Number(r.x) || 10,
            y: Number(r.y) || 10,
            w: Number(r.w) || 20,
            h: Number(r.h) || 20,
            correct: Boolean(r.correct),
            feedback: asString(r.feedback, "Noted."),
          }));
        const imageUrl = asString(raw.imageUrl);
        if (!imageUrl || !regions.length) break;
        return {
          lessonType: "hotspot",
          content: {
            type: "hotspot",
            title: asString(raw.title, lessonTitle),
            prompt: asString(raw.prompt, "Select the correct area."),
            imageUrl,
            regions,
          },
        };
      }
      case "image": {
        const src = asString(raw.src);
        if (!src) break;
        return {
          lessonType: "image",
          content: {
            type: "image",
            src,
            alt: asString(raw.alt, lessonTitle),
            caption: raw.caption ? asString(raw.caption) : undefined,
            layout:
              asString(raw.layout) === "card" || asString(raw.layout) === "split"
                ? (asString(raw.layout) as "card" | "split")
                : "full",
          },
        };
      }
      case "video": {
        const src = asString(raw.src);
        if (!src) break;
        return {
          lessonType: "video",
          content: {
            type: "video",
            src,
            poster: raw.poster ? asString(raw.poster) : undefined,
            caption: raw.caption ? asString(raw.caption) : undefined,
            provider:
              asString(raw.provider) === "youtube" || asString(raw.provider) === "vimeo"
                ? (asString(raw.provider) as "youtube" | "vimeo")
                : "file",
          },
        };
      }
      case "quiz":
        return {
          lessonType: "quiz",
          content: {
            type: "quiz",
            passMark: Number(raw.passMark) || 80,
            questionIds: asArray<unknown>(raw.questionIds).map(String),
            inlineQuestions: asArray<Record<string, unknown>>(raw.inlineQuestions).map((q, i) => ({
              id: asString(q.id, `q-${i + 1}`),
              stem: asString(q.stem),
              choices: asArray<Record<string, unknown>>(q.choices).map((c, j) => ({
                id: asString(c.id, String.fromCharCode(97 + j)),
                label: asString(c.label),
              })),
              correctId: asString(q.correctId, "a"),
              explanation: q.explanation ? asString(q.explanation) : undefined,
            })),
          },
        };
      case "document": {
        const files = asArray<Record<string, unknown>>(raw.files)
          .map((f) => ({
            title: asString(f.title, "Document"),
            url: asString(f.url),
            mime: f.mime ? asString(f.mime) : undefined,
            sizeLabel: f.sizeLabel ? asString(f.sizeLabel) : undefined,
          }))
          .filter((f) => f.url);
        if (!files.length) break;
        return {
          lessonType: "document",
          content: {
            type: "document",
            intro: raw.intro ? asString(raw.intro) : undefined,
            files,
          },
        };
      }
      case "embedded_pdf": {
        const url = asString(raw.url);
        if (!url) break;
        return {
          lessonType: "embedded_pdf",
          content: {
            type: "embedded_pdf",
            url,
            title: raw.title ? asString(raw.title) : undefined,
            height: Number(raw.height) || undefined,
          },
        };
      }
      case "branching": {
        const nodes = asRecord(raw.nodes);
        const startId = asString(raw.startId || raw.startNodeId);
        if (!nodes || !startId) break;
        return {
          lessonType: "branching",
          content: {
            type: "branching",
            startId,
            nodes: nodes as Extract<LessonContent, { type: "branching" }>["nodes"],
          },
        };
      }
      default:
        break;
    }
  } catch {
    /* fall through */
  }

  return {
    lessonType: "rich_text",
    content: richTextFallback(
      lessonTitle,
      "This interactive lesson was simplified because its generated content was incomplete.",
    ),
  };
}

export function sanitizeCourseLessonInput<
  T extends { title: string; lessonType: LmsLessonType; content: LessonContent; estimatedMinutes?: number },
>(lesson: T): T {
  const sanitized = sanitizeLessonContent(lesson.lessonType, lesson.content, lesson.title);
  return {
    ...lesson,
    lessonType: sanitized.lessonType,
    content: sanitized.content,
  };
}
