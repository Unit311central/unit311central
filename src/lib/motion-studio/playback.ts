import type { MotionElement, MotionScene, MotionStudioPreviewPayload } from "./types";

export const PLAYBACK_TICK_MS = 50;

export function formatMotionClock(ms: number): string {
  const s = Math.max(0, ms / 1000);
  return `${s.toFixed(1)}s`;
}

export function activeScene(
  spec: Pick<MotionStudioPreviewPayload, "scenes">,
  timeMs: number,
): MotionScene | null {
  return (
    spec.scenes.find((s) => timeMs >= s.startMs && timeMs < s.endMs) ??
    spec.scenes[spec.scenes.length - 1] ??
    null
  );
}

export function sceneLocalMs(scene: MotionScene, timeMs: number): number {
  return Math.max(0, Math.min(scene.endMs - scene.startMs, timeMs - scene.startMs));
}

export function sceneDurationMs(scene: MotionScene): number {
  return Math.max(1, scene.endMs - scene.startMs);
}

/** Stagger element entrances across the first ~55% of a scene. */
export function elementRevealAtMs(scene: MotionScene, elementIndex: number, elementCount: number): number {
  if (elementCount <= 1) return 0;
  const staggerWindow = sceneDurationMs(scene) * 0.55;
  const step = staggerWindow / Math.max(1, elementCount - 1);
  return Math.min(staggerWindow, elementIndex * step);
}

export function isElementRevealed(
  scene: MotionScene,
  elementIndex: number,
  timeMs: number,
  reducedMotion: boolean,
): boolean {
  if (reducedMotion) return true;
  const local = sceneLocalMs(scene, timeMs);
  return local >= elementRevealAtMs(scene, elementIndex, scene.elements.length);
}

export function elementMotionProgress(
  scene: MotionScene,
  elementIndex: number,
  timeMs: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 1;
  const local = sceneLocalMs(scene, timeMs);
  const revealAt = elementRevealAtMs(scene, elementIndex, scene.elements.length);
  const rampMs = 420;
  if (local <= revealAt) return 0;
  return Math.min(1, (local - revealAt) / rampMs);
}

/** Animate pipeline stage highlight within a scene (overrides static activeIndex). */
export function pipelineActiveIndex(
  element: Extract<MotionElement, { type: "pipeline" }>,
  scene: MotionScene,
  timeMs: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return element.activeIndex;
  const local = sceneLocalMs(scene, timeMs);
  const duration = sceneDurationMs(scene);
  const maxIndex = Math.max(0, element.stages.length - 1);

  if (scene.id === "pipeline") {
    const progress = Math.min(1, local / (duration * 0.85));
    return Math.min(maxIndex, Math.round(progress * element.activeIndex));
  }
  if (scene.id === "quote") {
    const from = 2;
    const to = element.activeIndex;
    const progress = Math.min(1, local / (duration * 0.7));
    return Math.min(maxIndex, Math.round(from + (to - from) * progress));
  }
  return element.activeIndex;
}

export function advancePlaybackTime(
  timeMs: number,
  durationMs: number,
  deltaMs: number,
): { timeMs: number; reachedEnd: boolean } {
  const next = Math.min(durationMs, timeMs + deltaMs);
  return { timeMs: next, reachedEnd: next >= durationMs };
}

export function restartPlayback(): { timeMs: number; playing: boolean } {
  return { timeMs: 0, playing: true };
}

export function togglePlayPause(
  playing: boolean,
  timeMs: number,
  durationMs: number,
): { playing: boolean; timeMs: number } {
  if (!playing && timeMs >= durationMs) {
    return { playing: true, timeMs: 0 };
  }
  return { playing: !playing, timeMs };
}
