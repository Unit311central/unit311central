import type { MotionElement, MotionScene, MotionStudioSpec } from "./types";

const MAX_SCENES = 12;
const MAX_ELEMENTS = 24;
const MAX_TEXT = 280;

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function trimText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function validateElement(raw: unknown): MotionElement | null {
  if (!isObject(raw) || typeof raw.type !== "string") return null;
  switch (raw.type) {
    case "title":
      return {
        type: "title",
        text: trimText(raw.text, 120),
        subtitle: trimText(raw.subtitle, 160) || undefined,
      };
    case "caption":
      return {
        type: "caption",
        text: trimText(raw.text),
        emphasis: raw.emphasis === "demo" ? "demo" : "normal",
      };
    case "card":
      return {
        type: "card",
        title: trimText(raw.title, 80),
        body: trimText(raw.body) || undefined,
        badge: trimText(raw.badge, 40) || undefined,
        tone:
          raw.tone === "accent" || raw.tone === "success" || raw.tone === "neutral"
            ? raw.tone
            : "neutral",
      };
    case "entity_row":
      return {
        type: "entity_row",
        label: trimText(raw.label, 60),
        value: trimText(raw.value, 100),
        meta: trimText(raw.meta, 80) || undefined,
      };
    case "pipeline": {
      const stages = Array.isArray(raw.stages)
        ? raw.stages.filter((s): s is string => typeof s === "string").slice(0, 8)
        : [];
      const activeIndex =
        typeof raw.activeIndex === "number" && Number.isFinite(raw.activeIndex)
          ? Math.max(0, Math.min(stages.length - 1, Math.floor(raw.activeIndex)))
          : 0;
      return {
        type: "pipeline",
        stages,
        activeIndex,
        valueLabel: trimText(raw.valueLabel, 40) || undefined,
      };
    }
    case "metric":
      return {
        type: "metric",
        label: trimText(raw.label, 60),
        value: trimText(raw.value, 40),
        hint: trimText(raw.hint, 80) || undefined,
      };
    case "arrow":
      return { type: "arrow", label: trimText(raw.label, 60) || undefined };
    case "workflow_link":
      return {
        type: "workflow_link",
        from: trimText(raw.from, 60),
        to: trimText(raw.to, 60),
        note: trimText(raw.note, 100) || undefined,
      };
    default:
      return null;
  }
}

function validateScene(raw: unknown, index: number): MotionScene | null {
  if (!isObject(raw)) return null;
  const startMs = typeof raw.startMs === "number" ? Math.max(0, Math.floor(raw.startMs)) : 0;
  const endMs = typeof raw.endMs === "number" ? Math.max(startMs + 500, Math.floor(raw.endMs)) : startMs + 6000;
  const elementsRaw = Array.isArray(raw.elements) ? raw.elements : [];
  const elements = elementsRaw
    .map(validateElement)
    .filter((e): e is MotionElement => e !== null)
    .slice(0, MAX_ELEMENTS);
  if (!elements.length) return null;
  return {
    id: trimText(raw.id, 40) || `scene_${index + 1}`,
    title: trimText(raw.title, 80) || `Scene ${index + 1}`,
    startMs,
    endMs,
    narration: trimText(raw.narration, 400) || undefined,
    elements,
  };
}

export function validateMotionStudioSpec(raw: unknown): MotionStudioSpec {
  if (!isObject(raw)) {
    throw new Error("Animation specification must be an object.");
  }
  const durationMs =
    typeof raw.durationMs === "number" && raw.durationMs >= 5_000 && raw.durationMs <= 120_000
      ? Math.floor(raw.durationMs)
      : 30_000;

  const scenesRaw = Array.isArray(raw.scenes) ? raw.scenes : [];
  const scenes = scenesRaw
    .map(validateScene)
    .filter((s): s is MotionScene => s !== null)
    .slice(0, MAX_SCENES);

  if (!scenes.length) {
    throw new Error("Animation must include at least one scene.");
  }

  const sorted = [...scenes].sort((a, b) => a.startMs - b.startMs);
  let cursor = 0;
  const normalized: MotionScene[] = sorted.map((scene, i) => {
    const startMs = i === 0 ? 0 : Math.max(cursor, scene.startMs);
    const endMs = Math.min(durationMs, Math.max(startMs + 1000, scene.endMs));
    cursor = endMs;
    return { ...scene, startMs, endMs };
  });

  const lastEnd = normalized[normalized.length - 1]?.endMs ?? durationMs;
  if (lastEnd > durationMs + 50) {
    throw new Error("Scene timings exceed total animation duration.");
  }

  return {
    version: 1,
    title: trimText(raw.title, 120) || "Unit311 Motion Studio",
    durationMs,
    aspectRatio: "16:9",
    fictional: raw.fictional !== false,
    promptEcho: trimText(raw.promptEcho, 500),
    scenes: normalized,
  };
}

export function assertSceneTimeline(spec: MotionStudioSpec): void {
  const total = spec.durationMs;
  let prev = 0;
  for (const scene of spec.scenes) {
    if (scene.startMs < prev - 1) {
      throw new Error(`Scene ${scene.id} overlaps previous scene.`);
    }
    if (scene.endMs <= scene.startMs) {
      throw new Error(`Scene ${scene.id} has invalid duration.`);
    }
    if (scene.endMs > total + 50) {
      throw new Error(`Scene ${scene.id} extends past animation end.`);
    }
    prev = scene.endMs;
  }
  const last = spec.scenes[spec.scenes.length - 1];
  if (last && Math.abs(last.endMs - total) > 250) {
    throw new Error(
      `Animation duration is ${total}ms but last scene ends at ${last.endMs}ms.`,
    );
  }
}
