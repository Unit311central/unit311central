/**
 * Tunable adoption scoring for Platform Analytics.
 * Default blend is a recommendation, not a product lock-in.
 */

/** Recommended starting weights — adjust after real traffic. */
export const DEFAULT_REACH_WEIGHT = 0.6;
export const DEFAULT_INTENSITY_WEIGHT = 0.4;

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function intensityFromEventsPerUser(eventsPerUser: number): number {
  if (eventsPerUser <= 0) return 0;
  // log1p softens heavy clickers; 20 events/user ≈ ~100 after scale.
  return clampScore((Math.log1p(eventsPerUser) / Math.log1p(20)) * 100);
}

export function adoptionScore(input: {
  reach: number;
  intensity: number;
  reachWeight?: number;
  intensityWeight?: number;
}): number {
  const rw = input.reachWeight ?? DEFAULT_REACH_WEIGHT;
  const iw = input.intensityWeight ?? DEFAULT_INTENSITY_WEIGHT;
  const sum = rw + iw;
  const reachW = sum > 0 ? rw / sum : 0.6;
  const intensityW = sum > 0 ? iw / sum : 0.4;
  return clampScore(input.reach * reachW * 100 + input.intensity * intensityW);
}

export function normalizeIntensityAcross(raw: number[]): number[] {
  const max = Math.max(0, ...raw);
  if (max <= 0) return raw.map(() => 0);
  return raw.map((v) => clampScore((v / max) * 100));
}
