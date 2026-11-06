/** Qwen vision read of one live frame. The on-screen words stay fixed. */

export const QWEN_LAPTOP_LABEL = "this is a laptop";

export type LaptopBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LaptopOverlay = {
  laptop: boolean;
  label: typeof QWEN_LAPTOP_LABEL | null;
  box: LaptopBox | null;
};

export type QwenLaptopAnswer = LaptopOverlay & {
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
  "Look at this camera frame.",
  "If a laptop computer is visible, reply with JSON only:",
  '{"laptop":true,"box":{"x":0.1,"y":0.2,"width":0.3,"height":0.4}}',
  "The box is the laptop, as fractions of image width and height, origin at the top left.",
  "If no laptop is visible, reply with JSON only:",
  '{"laptop":false,"box":null}',
].join(" ");

export function qwenLaptopPrompt(): string {
  return PROMPT;
}

function finiteUnit(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

function boxFrom(value: unknown): LaptopBox | null {
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

function overlayFromRecord(record: Record<string, unknown>): LaptopOverlay {
  const laptop = record.laptop === true;
  if (!laptop) return { laptop: false, label: null, box: null };
  return { laptop: true, label: QWEN_LAPTOP_LABEL, box: boxFrom(record.box) };
}

export function parseQwenLaptopOverlay(raw: string): LaptopOverlay {
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
      if (parsed && typeof parsed === "object") {
        return overlayFromRecord(parsed as Record<string, unknown>);
      }
    } catch {
      // Fall through to a plain-language read.
    }
  }
  if (/\blaptop\b/i.test(text) && !/\bno laptop\b/i.test(text)) {
    return { laptop: true, label: QWEN_LAPTOP_LABEL, box: null };
  }
  return { laptop: false, label: null, box: null };
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

