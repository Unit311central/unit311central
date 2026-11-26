/** One Qwen read of a live frame. Labels are the short names Qwen returns. */

export type LaptopBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SceneObject = {
  label: string;
  box: LaptopBox | null;
};

export type SceneOverlay = {
  objects: SceneObject[];
};

export type QwenLaptopAnswer = SceneOverlay & {
  configured: boolean;
  error: string | null;
};

export type ContainedFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const PROMPT = [
  "This is one frame from a DJI Neo drone.",
  "Name the physical objects you can see. Start with tables and chairs, then other furniture and objects.",
  "Reply with JSON only:",
  '{"objects":[{"label":"chair","box":{"x":0.1,"y":0.2,"width":0.3,"height":0.4}}]}',
  "Each box is fractions of image width and height, origin at the top left.",
  "Each label is a short English name.",
  "If nothing is recognizable, reply {\"objects\":[]}.",
].join(" ");

const MAX_OBJECTS = 8;

export function qwenLaptopPrompt(): string {
  return PROMPT;
}

function finiteUnit(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

export function boxFromUnknown(value: unknown): LaptopBox | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const x = finiteUnit(record.x);
  const y = finiteUnit(record.y);
  const width = finiteUnit(record.width);
  const height = finiteUnit(record.height);
  if (x === null || y === null || width === null || height === null) return null;
  if (width < 0.02 || height < 0.02) return null;
  if (x + width > 1.02 || y + height > 1.02) return null;
  return {
    x,
    y,
    width: Math.min(width, 1 - x),
    height: Math.min(height, 1 - y),
  };
}

export function sceneLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^a-zA-Z0-9 -]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 32);
}

function objectFrom(value: unknown): SceneObject | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const label = sceneLabel(record.label);
  if (!label) return null;
  return { label, box: boxFromUnknown(record.box) };
}

export function parseQwenLaptopOverlay(raw: string): SceneOverlay {
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
      if (parsed && typeof parsed === "object") {
        const objects = (parsed as { objects?: unknown }).objects;
        if (Array.isArray(objects)) {
          return {
            objects: objects.map(objectFrom).filter((item): item is SceneObject => item !== null).slice(0, MAX_OBJECTS),
          };
        }
      }
    } catch {
      // Fall through to an empty scene.
    }
  }
  return { objects: [] };
}

export function containFrame(
  containerWidth: number,
  containerHeight: number,
  mediaWidth: number,
  mediaHeight: number,
): ContainedFrame {
  if (containerWidth <= 0 || containerHeight <= 0 || mediaWidth <= 0 || mediaHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const scale = Math.min(containerWidth / mediaWidth, containerHeight / mediaHeight);
  const width = mediaWidth * scale;
  const height = mediaHeight * scale;
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function laptopOverlayPixels(
  container: { width: number; height: number },
  media: { width: number; height: number },
  box: LaptopBox,
): { left: number; top: number; width: number; height: number; labelTop: number } {
  const frame = containFrame(container.width, container.height, media.width, media.height);
  const top = frame.y + box.y * frame.height;
  return {
    left: frame.x + box.x * frame.width,
    top,
    width: box.width * frame.width,
    height: box.height * frame.height,
    labelTop: top < frame.y + 28 ? 4 : -28,
  };
}
