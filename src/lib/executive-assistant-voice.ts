export type ExecutiveVoiceGender = "male" | "female";

export type ExecutiveVoicePrefs = {
  voiceEnabled: boolean;
  gender: ExecutiveVoiceGender;
  /** 0.75 – 1.5 */
  speed: number;
  hideIntro: boolean;
};

export const DEFAULT_EXECUTIVE_VOICE_PREFS: ExecutiveVoicePrefs = {
  voiceEnabled: true,
  gender: "male",
  speed: 1,
  hideIntro: false,
};

export type ExecutiveVoiceStatus = "idle" | "listening" | "processing" | "thinking" | "speaking";

function prefsKey(userId: string) {
  return `unit311.ea.voice.prefs.${userId || "anon"}`;
}

export function loadExecutiveVoicePrefs(userId: string): ExecutiveVoicePrefs {
  if (typeof window === "undefined") return { ...DEFAULT_EXECUTIVE_VOICE_PREFS };
  try {
    const raw = window.localStorage.getItem(prefsKey(userId));
    if (!raw) return { ...DEFAULT_EXECUTIVE_VOICE_PREFS };
    const parsed = JSON.parse(raw) as Partial<ExecutiveVoicePrefs>;
    return {
      voiceEnabled:
        typeof parsed.voiceEnabled === "boolean"
          ? parsed.voiceEnabled
          : DEFAULT_EXECUTIVE_VOICE_PREFS.voiceEnabled,
      gender: parsed.gender === "female" ? "female" : "male",
      speed:
        typeof parsed.speed === "number" && parsed.speed >= 0.75 && parsed.speed <= 1.5
          ? parsed.speed
          : DEFAULT_EXECUTIVE_VOICE_PREFS.speed,
      hideIntro: Boolean(parsed.hideIntro),
    };
  } catch {
    return { ...DEFAULT_EXECUTIVE_VOICE_PREFS };
  }
}

export function saveExecutiveVoicePrefs(userId: string, prefs: ExecutiveVoicePrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(prefsKey(userId), JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}

/** Map gender preference to OpenAI TTS voice ids. */
export function openaiVoiceForGender(gender: ExecutiveVoiceGender) {
  return gender === "female" ? "nova" : "onyx";
}

/** Strip markdown / UI chrome so TTS sounds natural. */
export function stripTextForSpeech(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>]{1,3}/g, "")
    .replace(/^\s*[-•*]\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export function voiceStatusLabel(status: ExecutiveVoiceStatus) {
  switch (status) {
    case "listening":
      return "Listening...";
    case "processing":
      return "Processing...";
    case "thinking":
      return "Thinking...";
    case "speaking":
      return "Speaking...";
    default:
      return "Idle";
  }
}
