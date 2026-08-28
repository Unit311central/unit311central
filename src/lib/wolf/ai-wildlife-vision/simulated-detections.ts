import { WOLF_AI_WILDLIFE_VISION_DURATION_SEC } from "@/lib/wolf/ai-wildlife-vision/config";
import type {
  NormalisedBoundingBox,
  WildlifeDetection,
  WildlifeSpecies,
  WildlifeUniqueCounts,
} from "@/lib/wolf/ai-wildlife-vision/types";
import { WILDLIFE_SPECIES_LABELS } from "@/lib/wolf/ai-wildlife-vision/types";

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

const COUNT_MILESTONES: Array<{
  timeSec: number;
  counts: Record<WildlifeSpecies, number>;
}> = [
  {
    timeSec: 0,
    counts: {
      zebra: 0,
      eland: 0,
      giraffe: 0,
      wildebeest: 0,
      impala: 0,
      buffalo: 0,
      rhino: 0,
    },
  },
  {
    timeSec: 5,
    counts: {
      zebra: 4,
      eland: 2,
      giraffe: 0,
      wildebeest: 0,
      impala: 0,
      buffalo: 0,
      rhino: 0,
    },
  },
  {
    timeSec: 12,
    counts: {
      zebra: 11,
      eland: 4,
      giraffe: 2,
      wildebeest: 0,
      impala: 0,
      buffalo: 0,
      rhino: 0,
    },
  },
  {
    timeSec: 20,
    counts: {
      zebra: 18,
      eland: 7,
      giraffe: 3,
      wildebeest: 8,
      impala: 0,
      buffalo: 0,
      rhino: 0,
    },
  },
  {
    timeSec: 30,
    counts: {
      zebra: 23,
      eland: 8,
      giraffe: 4,
      wildebeest: 17,
      impala: 6,
      buffalo: 3,
      rhino: 2,
    },
  },
];

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

/** Pre-authored tracks — positions tuned for generic savanna aerial footage. */
const SIMULATED_TRACKS: SimulatedTrack[] = [
  track("zebra-a1", "zebra", 0.94, [
    { start: 0.4, end: 4.8, from: { x: 0.08, y: 0.58, width: 0.11, height: 0.09 }, to: { x: 0.22, y: 0.56, width: 0.12, height: 0.1 } },
    { start: 18.0, end: 22.5, from: { x: 0.62, y: 0.52, width: 0.1, height: 0.08 }, to: { x: 0.74, y: 0.5, width: 0.11, height: 0.09 } },
  ]),
  track("zebra-a2", "zebra", 0.91, [
    { start: 1.0, end: 5.2, from: { x: 0.18, y: 0.62, width: 0.1, height: 0.08 }, to: { x: 0.31, y: 0.6, width: 0.11, height: 0.09 } },
    { start: 19.5, end: 24.0, from: { x: 0.48, y: 0.55, width: 0.12, height: 0.09 }, to: { x: 0.6, y: 0.53, width: 0.11, height: 0.08 } },
  ]),
  track("zebra-a3", "zebra", 0.89, [
    { start: 2.2, end: 6.0, from: { x: 0.28, y: 0.57, width: 0.09, height: 0.07 }, to: { x: 0.4, y: 0.55, width: 0.1, height: 0.08 } },
    { start: 21.0, end: 26.0, from: { x: 0.35, y: 0.48, width: 0.1, height: 0.08 }, to: { x: 0.47, y: 0.46, width: 0.11, height: 0.09 } },
  ]),
  track("zebra-a4", "zebra", 0.92, [
    { start: 3.5, end: 7.5, from: { x: 0.52, y: 0.6, width: 0.11, height: 0.09 }, to: { x: 0.64, y: 0.58, width: 0.1, height: 0.08 } },
    { start: 23.0, end: 28.5, from: { x: 0.7, y: 0.44, width: 0.12, height: 0.1 }, to: { x: 0.82, y: 0.42, width: 0.11, height: 0.09 } },
  ]),
  track("eland-b1", "eland", 0.9, [
    { start: 1.5, end: 6.5, from: { x: 0.42, y: 0.5, width: 0.13, height: 0.11 }, to: { x: 0.55, y: 0.48, width: 0.14, height: 0.12 } },
    { start: 14.0, end: 18.5, from: { x: 0.2, y: 0.46, width: 0.15, height: 0.12 }, to: { x: 0.33, y: 0.44, width: 0.14, height: 0.11 } },
  ]),
  track("eland-b2", "eland", 0.88, [
    { start: 4.0, end: 9.0, from: { x: 0.58, y: 0.52, width: 0.12, height: 0.1 }, to: { x: 0.7, y: 0.5, width: 0.13, height: 0.11 } },
    { start: 16.5, end: 21.0, from: { x: 0.08, y: 0.42, width: 0.14, height: 0.11 }, to: { x: 0.2, y: 0.4, width: 0.13, height: 0.1 } },
  ]),
  track("giraffe-c1", "giraffe", 0.93, [
    { start: 8.0, end: 13.5, from: { x: 0.12, y: 0.32, width: 0.08, height: 0.22 }, to: { x: 0.18, y: 0.3, width: 0.09, height: 0.24 } },
    { start: 24.5, end: 29.5, from: { x: 0.55, y: 0.28, width: 0.09, height: 0.25 }, to: { x: 0.62, y: 0.26, width: 0.08, height: 0.23 } },
  ]),
  track("giraffe-c2", "giraffe", 0.9, [
    { start: 10.5, end: 16.0, from: { x: 0.68, y: 0.34, width: 0.07, height: 0.2 }, to: { x: 0.74, y: 0.32, width: 0.08, height: 0.22 } },
  ]),
  track("wildebeest-d1", "wildebeest", 0.87, [
    { start: 14.5, end: 19.5, from: { x: 0.25, y: 0.54, width: 0.1, height: 0.08 }, to: { x: 0.38, y: 0.52, width: 0.11, height: 0.09 } },
    { start: 26.0, end: 30.0, from: { x: 0.44, y: 0.5, width: 0.1, height: 0.08 }, to: { x: 0.56, y: 0.48, width: 0.11, height: 0.09 } },
  ]),
  track("wildebeest-d2", "wildebeest", 0.86, [
    { start: 15.5, end: 20.5, from: { x: 0.46, y: 0.56, width: 0.09, height: 0.07 }, to: { x: 0.58, y: 0.54, width: 0.1, height: 0.08 } },
  ]),
  track("wildebeest-d3", "wildebeest", 0.85, [
    { start: 17.0, end: 22.0, from: { x: 0.62, y: 0.5, width: 0.1, height: 0.08 }, to: { x: 0.74, y: 0.48, width: 0.11, height: 0.09 } },
  ]),
  track("impala-e1", "impala", 0.84, [
    { start: 20.5, end: 25.5, from: { x: 0.14, y: 0.48, width: 0.07, height: 0.06 }, to: { x: 0.24, y: 0.46, width: 0.08, height: 0.07 } },
  ]),
  track("impala-e2", "impala", 0.83, [
    { start: 22.0, end: 27.0, from: { x: 0.3, y: 0.44, width: 0.07, height: 0.06 }, to: { x: 0.4, y: 0.42, width: 0.08, height: 0.07 } },
  ]),
  track("buffalo-f1", "buffalo", 0.91, [
    { start: 24.0, end: 29.0, from: { x: 0.52, y: 0.46, width: 0.14, height: 0.11 }, to: { x: 0.64, y: 0.44, width: 0.15, height: 0.12 } },
  ]),
  track("rhino-g1", "rhino", 0.95, [
    { start: 26.5, end: 30.0, from: { x: 0.72, y: 0.5, width: 0.16, height: 0.12 }, to: { x: 0.84, y: 0.48, width: 0.15, height: 0.11 } },
  ]),
  track("zebra-a5", "zebra", 0.9, [
    { start: 6.0, end: 11.0, from: { x: 0.05, y: 0.5, width: 0.1, height: 0.08 }, to: { x: 0.17, y: 0.48, width: 0.11, height: 0.09 } },
  ]),
  track("zebra-a6", "zebra", 0.88, [
    { start: 9.0, end: 14.0, from: { x: 0.38, y: 0.54, width: 0.1, height: 0.08 }, to: { x: 0.5, y: 0.52, width: 0.11, height: 0.09 } },
  ]),
  track("eland-b3", "eland", 0.87, [
    { start: 11.0, end: 16.0, from: { x: 0.72, y: 0.46, width: 0.13, height: 0.1 }, to: { x: 0.82, y: 0.44, width: 0.12, height: 0.09 } },
  ]),
];

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

function interpolateCounts(timeSec: number): WildlifeUniqueCounts {
  const clamped = clamp01(timeSec / WOLF_AI_WILDLIFE_VISION_DURATION_SEC) * WOLF_AI_WILDLIFE_VISION_DURATION_SEC;

  let start = COUNT_MILESTONES[0];
  let end = COUNT_MILESTONES[COUNT_MILESTONES.length - 1];

  for (let index = 0; index < COUNT_MILESTONES.length - 1; index += 1) {
    if (clamped >= COUNT_MILESTONES[index].timeSec && clamped <= COUNT_MILESTONES[index + 1].timeSec) {
      start = COUNT_MILESTONES[index];
      end = COUNT_MILESTONES[index + 1];
      break;
    }
  }

  const span = end.timeSec - start.timeSec || 1;
  const t = clamp01((clamped - start.timeSec) / span);

  const bySpecies = {} as Record<WildlifeSpecies, number>;
  let totalUnique = 0;
  for (const species of Object.keys(start.counts) as WildlifeSpecies[]) {
    const value = Math.round(lerp(start.counts[species], end.counts[species], t));
    bySpecies[species] = value;
    totalUnique += value;
  }

  return { bySpecies, totalUnique };
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

export function getSimulatedUniqueCountsAt(timeSec: number): WildlifeUniqueCounts {
  return interpolateCounts(timeSec);
}
