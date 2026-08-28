/** Replaceable demo video — swap for a live drone ingest URL later. */
export const WOLF_AI_WILDLIFE_VISION_VIDEO_SRC =
  process.env.NEXT_PUBLIC_WOLF_AI_WILDLIFE_VISION_VIDEO_SRC ??
  "/videos/wolf/ai-wildlife-vision-demo.mp4";

export const WOLF_AI_WILDLIFE_VISION_DURATION_SEC = 30;

export const WOLF_AI_WILDLIFE_VISION_HUD = {
  altitudeM: 68,
  speedMps: 24,
  resolution: "1080p",
  fps: 24,
} as const;
