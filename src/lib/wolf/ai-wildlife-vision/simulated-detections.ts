import { WOLF_AI_WILDLIFE_VISION_DURATION_SEC } from "@/lib/wolf/ai-wildlife-vision/config";
import type {
  NormalisedBoundingBox,
  WildlifeDetection,
  WildlifeSpecies,
  WildlifeUniqueCounts,
} from "@/lib/wolf/ai-wildlife-vision/types";
import { WILDLIFE_SPECIES, WILDLIFE_SPECIES_LABELS } from "@/lib/wolf/ai-wildlife-vision/types";

type DetectionKeyframe = {
  timeSec: number;
  box: NormalisedBoundingBox;
};

type SimulatedTrack = {
  trackId: string;
  species: WildlifeSpecies;
  confidence: number;
  keyframes: DetectionKeyframe[];
};

function track(
  trackId: string,
  species: WildlifeSpecies,
  confidence: number,
  segments: Array<{ start: number; end: number; from: NormalisedBoundingBox; to: NormalisedBoundingBox }>,
): SimulatedTrack {
  const keyframes: DetectionKeyframe[] = [];
  for (const segment of segments) {
    keyframes.push({ timeSec: segment.start, box: segment.from });
    keyframes.push({ timeSec: segment.end, box: segment.to });
  }
  return { trackId, species, confidence, keyframes };
}

/**
 * Tracks tuned to the composite high-altitude survey demo:
 * - 0–9s: nadir savanna establishing pass (no animals visible)
 * - 9.5–30s: wildlife concentration zone (zebra, wildebeest, impala only)
 */
const SIMULATED_TRACKS: SimulatedTrack[] = [
  // Left zebra herd — enters as survey zone comes into view
  track("zebra-z01", "zebra", 0.94, [
    { start: 9.8, end: 16.5, from: { x: 0.028, y: 0.505, width: 0.028, height: 0.036 }, to: { x: 0.055, y: 0.498, width: 0.028, height: 0.036 } },
    { start: 16.5, end: 22.0, from: { x: 0.055, y: 0.498, width: 0.028, height: 0.036 }, to: { x: 0.038, y: 0.502, width: 0.027, height: 0.035 } },
  ]),
  track("zebra-z02", "zebra", 0.91, [
    { start: 10.0, end: 17.0, from: { x: 0.052, y: 0.512, width: 0.027, height: 0.035 }, to: { x: 0.078, y: 0.506, width: 0.028, height: 0.036 } },
    { start: 17.0, end: 23.5, from: { x: 0.078, y: 0.506, width: 0.028, height: 0.036 }, to: { x: 0.062, y: 0.509, width: 0.027, height: 0.035 } },
  ]),
  track("zebra-z03", "zebra", 0.89, [
    { start: 10.3, end: 18.0, from: { x: 0.074, y: 0.498, width: 0.026, height: 0.034 }, to: { x: 0.098, y: 0.492, width: 0.027, height: 0.035 } },
    { start: 18.0, end: 24.0, from: { x: 0.098, y: 0.492, width: 0.027, height: 0.035 }, to: { x: 0.082, y: 0.496, width: 0.026, height: 0.034 } },
  ]),
  track("zebra-z04", "zebra", 0.92, [
    { start: 10.8, end: 19.5, from: { x: 0.096, y: 0.508, width: 0.027, height: 0.035 }, to: { x: 0.118, y: 0.502, width: 0.028, height: 0.036 } },
  ]),
  track("zebra-z05", "zebra", 0.9, [
    { start: 11.5, end: 20.0, from: { x: 0.115, y: 0.515, width: 0.026, height: 0.034 }, to: { x: 0.132, y: 0.509, width: 0.027, height: 0.035 } },
  ]),

  // Right zebra group at waterhole
  track("zebra-z06", "zebra", 0.93, [
    { start: 11.2, end: 19.0, from: { x: 0.598, y: 0.488, width: 0.028, height: 0.036 }, to: { x: 0.622, y: 0.482, width: 0.028, height: 0.036 } },
    { start: 19.0, end: 26.5, from: { x: 0.622, y: 0.482, width: 0.028, height: 0.036 }, to: { x: 0.608, y: 0.486, width: 0.027, height: 0.035 } },
  ]),
  track("zebra-z07", "zebra", 0.88, [
    { start: 11.8, end: 20.5, from: { x: 0.628, y: 0.496, width: 0.027, height: 0.035 }, to: { x: 0.652, y: 0.49, width: 0.028, height: 0.036 } },
    { start: 20.5, end: 28.0, from: { x: 0.652, y: 0.49, width: 0.028, height: 0.036 }, to: { x: 0.638, y: 0.494, width: 0.027, height: 0.035 } },
  ]),
  track("zebra-z08", "zebra", 0.87, [
    { start: 12.5, end: 21.0, from: { x: 0.658, y: 0.502, width: 0.026, height: 0.034 }, to: { x: 0.682, y: 0.496, width: 0.027, height: 0.035 } },
    { start: 21.0, end: 29.0, from: { x: 0.682, y: 0.496, width: 0.027, height: 0.035 }, to: { x: 0.668, y: 0.5, width: 0.026, height: 0.034 } },
  ]),

  // Distant wildebeest line across background plain
  track("wildebeest-w01", "wildebeest", 0.86, [
    { start: 10.2, end: 28.0, from: { x: 0.045, y: 0.318, width: 0.02, height: 0.024 }, to: { x: 0.068, y: 0.316, width: 0.02, height: 0.024 } },
  ]),
  track("wildebeest-w02", "wildebeest", 0.84, [
    { start: 10.5, end: 28.5, from: { x: 0.088, y: 0.322, width: 0.019, height: 0.023 }, to: { x: 0.11, y: 0.32, width: 0.019, height: 0.023 } },
  ]),
  track("wildebeest-w03", "wildebeest", 0.85, [
    { start: 10.8, end: 29.0, from: { x: 0.132, y: 0.316, width: 0.02, height: 0.024 }, to: { x: 0.154, y: 0.314, width: 0.02, height: 0.024 } },
  ]),
  track("wildebeest-w04", "wildebeest", 0.83, [
    { start: 11.2, end: 29.0, from: { x: 0.178, y: 0.32, width: 0.019, height: 0.023 }, to: { x: 0.2, y: 0.318, width: 0.019, height: 0.023 } },
  ]),
  track("wildebeest-w05", "wildebeest", 0.82, [
    { start: 11.5, end: 29.0, from: { x: 0.228, y: 0.314, width: 0.018, height: 0.022 }, to: { x: 0.248, y: 0.312, width: 0.018, height: 0.022 } },
  ]),
  track("wildebeest-w06", "wildebeest", 0.84, [
    { start: 12.0, end: 29.0, from: { x: 0.278, y: 0.318, width: 0.019, height: 0.023 }, to: { x: 0.298, y: 0.316, width: 0.019, height: 0.023 } },
  ]),
  track("wildebeest-w07", "wildebeest", 0.81, [
    { start: 12.5, end: 29.0, from: { x: 0.328, y: 0.312, width: 0.018, height: 0.022 }, to: { x: 0.348, y: 0.31, width: 0.018, height: 0.022 } },
  ]),
  track("wildebeest-w08", "wildebeest", 0.85, [
    { start: 13.0, end: 29.0, from: { x: 0.378, y: 0.316, width: 0.019, height: 0.023 }, to: { x: 0.398, y: 0.314, width: 0.019, height: 0.023 } },
  ]),
  track("wildebeest-w09", "wildebeest", 0.83, [
    { start: 13.5, end: 29.0, from: { x: 0.428, y: 0.31, width: 0.018, height: 0.022 }, to: { x: 0.448, y: 0.308, width: 0.018, height: 0.022 } },
  ]),
  track("wildebeest-w10", "wildebeest", 0.82, [
    { start: 14.0, end: 29.0, from: { x: 0.478, y: 0.314, width: 0.019, height: 0.023 }, to: { x: 0.498, y: 0.312, width: 0.019, height: 0.023 } },
  ]),

  // Impala / springbok near central water
  track("impala-i01", "impala", 0.9, [
    { start: 10.5, end: 18.5, from: { x: 0.398, y: 0.472, width: 0.018, height: 0.028 }, to: { x: 0.418, y: 0.468, width: 0.018, height: 0.028 } },
    { start: 18.5, end: 25.0, from: { x: 0.418, y: 0.468, width: 0.018, height: 0.028 }, to: { x: 0.405, y: 0.471, width: 0.017, height: 0.027 } },
  ]),
  track("impala-i02", "impala", 0.88, [
    { start: 11.0, end: 19.5, from: { x: 0.422, y: 0.478, width: 0.017, height: 0.027 }, to: { x: 0.442, y: 0.474, width: 0.018, height: 0.028 } },
    { start: 19.5, end: 26.0, from: { x: 0.442, y: 0.474, width: 0.018, height: 0.028 }, to: { x: 0.428, y: 0.477, width: 0.017, height: 0.027 } },
  ]),
  track("impala-i03", "impala", 0.86, [
    { start: 11.5, end: 20.0, from: { x: 0.448, y: 0.484, width: 0.017, height: 0.027 }, to: { x: 0.468, y: 0.48, width: 0.018, height: 0.028 } },
    { start: 20.0, end: 27.0, from: { x: 0.468, y: 0.48, width: 0.018, height: 0.028 }, to: { x: 0.455, y: 0.483, width: 0.017, height: 0.027 } },
  ]),
  track("impala-i04", "impala", 0.85, [
    { start: 12.0, end: 21.0, from: { x: 0.472, y: 0.476, width: 0.017, height: 0.027 }, to: { x: 0.492, y: 0.472, width: 0.018, height: 0.028 } },
    { start: 21.0, end: 28.0, from: { x: 0.492, y: 0.472, width: 0.018, height: 0.028 }, to: { x: 0.478, y: 0.475, width: 0.017, height: 0.027 } },
  ]),
  track("impala-i05", "impala", 0.84, [
    { start: 12.8, end: 22.0, from: { x: 0.498, y: 0.482, width: 0.016, height: 0.026 }, to: { x: 0.516, y: 0.478, width: 0.017, height: 0.027 } },
    { start: 22.0, end: 29.0, from: { x: 0.516, y: 0.478, width: 0.017, height: 0.027 }, to: { x: 0.502, y: 0.481, width: 0.016, height: 0.026 } },
  ]),
  track("impala-i06", "impala", 0.82, [
    { start: 13.5, end: 23.0, from: { x: 0.522, y: 0.474, width: 0.016, height: 0.026 }, to: { x: 0.54, y: 0.47, width: 0.017, height: 0.027 } },
    { start: 23.0, end: 29.5, from: { x: 0.54, y: 0.47, width: 0.017, height: 0.027 }, to: { x: 0.526, y: 0.473, width: 0.016, height: 0.026 } },
  ]),
];

function emptyCounts(): Record<WildlifeSpecies, number> {
  return {
    zebra: 0,
    eland: 0,
    giraffe: 0,
    wildebeest: 0,
    impala: 0,
    buffalo: 0,
    rhino: 0,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateBox(a: NormalisedBoundingBox, b: NormalisedBoundingBox, t: number): NormalisedBoundingBox {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
  };
}

function trackFirstSeenSec(trackDef: SimulatedTrack): number {
  if (trackDef.keyframes.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...trackDef.keyframes.map((frame) => frame.timeSec));
}

function boxAtTime(trackDef: SimulatedTrack, timeSec: number): NormalisedBoundingBox | null {
  const frames = [...trackDef.keyframes].sort((a, b) => a.timeSec - b.timeSec);
  if (frames.length === 0 || timeSec < frames[0].timeSec || timeSec > frames[frames.length - 1].timeSec) {
    return null;
  }

  for (let index = 0; index < frames.length - 1; index += 1) {
    const current = frames[index];
    const next = frames[index + 1];
    if (timeSec >= current.timeSec && timeSec <= next.timeSec) {
      const span = next.timeSec - current.timeSec || 1;
      const t = (timeSec - current.timeSec) / span;
      return interpolateBox(current.box, next.box, t);
    }
  }

  return frames[frames.length - 1].box;
}

export function getSimulatedDetectionsAt(timeSec: number): WildlifeDetection[] {
  const clamped = Math.min(WOLF_AI_WILDLIFE_VISION_DURATION_SEC, Math.max(0, timeSec));
  const detections: WildlifeDetection[] = [];

  for (const trackDef of SIMULATED_TRACKS) {
    const box = boxAtTime(trackDef, clamped);
    if (!box) continue;
    detections.push({
      trackId: trackDef.trackId,
      species: trackDef.species,
      label: WILDLIFE_SPECIES_LABELS[trackDef.species],
      box,
      confidence: trackDef.confidence,
    });
  }

  return detections;
}

/** Unique counts derived from track first-seen times — no fabricated milestones. */
export function getSimulatedUniqueCountsAt(timeSec: number): WildlifeUniqueCounts {
  const clamped = clamp01(timeSec / WOLF_AI_WILDLIFE_VISION_DURATION_SEC) * WOLF_AI_WILDLIFE_VISION_DURATION_SEC;
  const bySpecies = emptyCounts();

  for (const trackDef of SIMULATED_TRACKS) {
    if (clamped < trackFirstSeenSec(trackDef)) continue;
    bySpecies[trackDef.species] += 1;
  }

  const totalUnique = WILDLIFE_SPECIES.reduce((sum, species) => sum + bySpecies[species], 0);
  return { bySpecies, totalUnique };
}

/** Expected end-of-demo totals for regression checks. */
export const WOLF_AI_WILDLIFE_VISION_FINAL_COUNTS = getSimulatedUniqueCountsAt(
  WOLF_AI_WILDLIFE_VISION_DURATION_SEC,
);
