export const SHARK_BUCKET = "wolf-shark";

export const SHARK_TEST_VIDEOS = [
  { id: "base.mp4", label: "base.mp4 (negative control)", expectedSharks: 0 },
  { id: "shark.mp4", label: "shark.mp4 (test video)", expectedSharks: 5 },
] as const;

export type SharkTestVideoId = (typeof SHARK_TEST_VIDEOS)[number]["id"];

export const SHARK_VIEWS = [
  "wolf-shark-dashboard",
  "wolf-shark-video-analysis",
  "wolf-shark-ai-detection",
  "wolf-shark-tracking",
  "wolf-shark-test-results",
  "wolf-shark-settings",
] as const;

export type SharkViewId = (typeof SHARK_VIEWS)[number];

export function isSharkView(view: string): boolean {
  return (SHARK_VIEWS as readonly string[]).includes(view);
}
