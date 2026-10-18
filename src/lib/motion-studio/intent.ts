const MOTION_VERBS =
  /\b(create|make|build|generate|produce|animate|show|prepare|design)\b/i;
const MOTION_NOUNS =
  /\b(animation|animated|motion\s+studio|walkthrough|explainer|storyboard|video\s+style|motion\s+graphic)\b/i;

export function isMotionStudioRequest(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  const lower = text.toLowerCase();
  if (/\b(mp4|render\s+video|export\s+video|ffmpeg)\b/i.test(lower)) return false;
  if (MOTION_VERBS.test(text) && MOTION_NOUNS.test(text)) return true;
  if (/\banimat(e|ed|ion)\b/i.test(lower) && /\b(explain|how|walkthrough|introduction|intro)\b/i.test(lower)) {
    return true;
  }
  if (/\b30\s*[- ]?\s*second\b/i.test(lower) && /\b(sales|workflow|explainer|walkthrough)\b/i.test(lower)) {
    return true;
  }
  return false;
}

export function motionStudioToolArgs(message: string): Record<string, unknown> {
  return {
    prompt: message.trim(),
    revision: false,
  };
}
