import {
  createOpenAIClient,
  getAssistantModel,
} from "@/lib/ai-operating-assistant/openai-client";
import { validateProcedureAnimationSpec } from "@/lib/lms/procedure-animation-spec";
import type { LmsLesson } from "@/lib/lms/types";

function safeParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(body);
}

export async function regenerateProcedureAnimationSpec(options: {
  lesson: Pick<LmsLesson, "title">;
  courseTitle: string;
  courseDescription: string;
  moduleTitle: string;
  contextExcerpt: string;
}): Promise<ReturnType<typeof validateProcedureAnimationSpec>> {
  const fallback = validateProcedureAnimationSpec({
    version: 1,
    title: options.lesson.title,
    layout: "pipeline",
    nodes: [
      { id: "start", label: "Start", kind: "start" },
      { id: "step-1", label: options.lesson.title, kind: "step" },
      { id: "end", label: "Complete", kind: "end" },
    ],
    edges: [
      { id: "e-1", from: "start", to: "step-1" },
      { id: "e-2", from: "step-1", to: "end" },
    ],
  });

  if (!process.env.OPENAI_API_KEY?.trim()) return fallback;

  try {
    const client = createOpenAIClient();
    const response = await client.chat.completions.create({
      model: getAssistantModel(),
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Return JSON { "spec": { version:1, title, subtitle?, layout, nodes[], edges[], playbackOrder? } } for a procedure animation lesson.
Use only facts from the provided context. Nodes need unique ids. Include start and end nodes. layout: linear | decision_tree | pipeline.`,
        },
        {
          role: "user",
          content: `Course: ${options.courseTitle}
Module: ${options.moduleTitle}
Lesson: ${options.lesson.title}
Description: ${options.courseDescription}

CONTEXT:
${options.contextExcerpt.slice(0, 6000)}`,
        },
      ],
    });
    const raw = response.choices[0]?.message?.content || "";
    const parsed = safeParseJson(raw) as { spec?: unknown };
    const spec = validateProcedureAnimationSpec(parsed.spec);
    return spec ?? fallback;
  } catch {
    return fallback;
  }
}
