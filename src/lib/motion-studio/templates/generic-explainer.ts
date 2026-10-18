import type { MotionStudioSpec } from "../types";

/** Five-scene generic product explainer for non-sales topics. */
export function buildGenericExplainerSpec(input: {
  promptEcho: string;
  topic: string;
  durationMs?: number;
}): MotionStudioSpec {
  const durationMs = input.durationMs ?? 30_000;
  const slice = durationMs / 5;
  const topic = input.topic.trim() || "Unit311Central module";
  return {
    version: 1,
    title: `${topic} — animated overview`,
    durationMs,
    aspectRatio: "16:9",
    fictional: true,
    promptEcho: input.promptEcho,
    scenes: [0, 1, 2, 3, 4].map((i) => ({
      id: `part_${i + 1}`,
      title: `Part ${i + 1}`,
      startMs: Math.floor(i * slice),
      endMs: Math.floor((i + 1) * slice),
      narration: `Overview segment ${i + 1} for ${topic}.`,
      elements: [
        { type: "caption", text: "Illustrative demo storyline", emphasis: "demo" },
        {
          type: "title",
          text: i === 0 ? topic : `${topic} · step ${i + 1}`,
          subtitle: "Conceptual workflow (demo workspace)",
        },
        {
          type: "card",
          title: "Key idea",
          body: "Roles, records, and hand-offs stay connected in one operating surface.",
          tone: i === 4 ? "success" : "accent",
        },
      ],
    })),
  };
}
