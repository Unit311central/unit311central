/** Replaceable demo video — swap for a live drone ingest URL later. */
export const WOLF_AI_WILDLIFE_VISION_VIDEO_SRC =
  process.env.NEXT_PUBLIC_WOLF_AI_WILDLIFE_VISION_VIDEO_SRC ??
  "/videos/wolf/ai-wildlife-vision-demo.mp4";

export const WOLF_AI_WILDLIFE_VISION_DURATION_SEC = 30;

export type WildlifeVisionHudTelemetry = {
  altitudeM: number;
  speedMps: number;
  headingDeg: number;
  fov: string;
  mode: string;
  resolution: string;
  fps: number;
};

/** High-altitude survey telemetry — altitude drifts within 650–750 m during the pass. */
export function getWildlifeVisionHudAt(timeSec: number): WildlifeVisionHudTelemetry {
  const clamped = Math.min(WOLF_AI_WILDLIFE_VISION_DURATION_SEC, Math.max(0, timeSec));
  const altitudeWave = Math.sin(clamped * 0.38) * 22 + Math.sin(clamped * 0.11) * 12;
  const altitudeM = Math.round(Math.min(750, Math.max(650, 720 + altitudeWave)));
  const headingDeg = Math.round((287 + clamped * 2.4) % 360);

  return {
    altitudeM,
    speedMps: 24,
    headingDeg,
    fov: "Wide",
    mode: "Survey",
    resolution: "1080p",
    fps: 24,
  };
}

/** @deprecated Use getWildlifeVisionHudAt — kept for tests importing static defaults. */
export const WOLF_AI_WILDLIFE_VISION_HUD = getWildlifeVisionHudAt(0);
