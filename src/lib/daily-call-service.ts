import "server-only";

const DAILY_API_BASE = "https://api.daily.co/v1";

export function isDailyConfigured() {
  return Boolean(process.env.DAILY_API_KEY?.trim());
}

function requireDailyApiKey() {
  const key = process.env.DAILY_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Daily is not configured. Set DAILY_API_KEY in the environment (Daily dashboard → Developers → API keys).",
    );
  }
  return key;
}

export function dailyRoomNameForSession(sessionId: string) {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  return `u311-${safe || "meeting"}`;
}

type DailyRoomResponse = {
  id?: string;
  name?: string;
  url?: string;
  error?: string;
  info?: string;
};

async function dailyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = requireDailyApiKey();
  const response = await fetch(`${DAILY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    info?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || data.info || `Daily API failed (${response.status})`);
  }
  return data;
}

/**
 * Ensure a Daily room exists for this Unit311 messaging session.
 * Room name is deterministic so create/join is idempotent.
 */
export async function ensureDailyRoomForMessagingCall(input: {
  sessionId: string;
  callType: "voice" | "video";
}) {
  const name = dailyRoomNameForSession(input.sessionId);
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12; // 12h

  try {
    const existing = await dailyFetch<DailyRoomResponse>(`/rooms/${encodeURIComponent(name)}`);
    if (existing.url && existing.name) {
      return { roomName: existing.name, roomUrl: existing.url };
    }
  } catch {
    // create below
  }

  try {
    const created = await dailyFetch<DailyRoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name,
        privacy: "private",
        properties: {
          exp,
          max_participants: 10,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: input.callType === "voice",
          start_audio_off: false,
          eject_at_room_exp: true,
        },
      }),
    });
    if (!created.url || !created.name) {
      throw new Error("Daily room create returned no URL.");
    }
    return { roomName: created.name, roomUrl: created.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Race: room created between GET and POST
    if (/already exists|taken/i.test(message)) {
      const existing = await dailyFetch<DailyRoomResponse>(`/rooms/${encodeURIComponent(name)}`);
      if (existing.url && existing.name) {
        return { roomName: existing.name, roomUrl: existing.url };
      }
    }
    throw error;
  }
}

export async function createDailyMeetingToken(input: {
  roomName: string;
  userName: string;
  isOwner?: boolean;
}) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 6; // 6h
  const data = await dailyFetch<{ token?: string }>("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: input.roomName,
        user_name: input.userName.slice(0, 80) || "Guest",
        is_owner: Boolean(input.isOwner),
        enable_screenshare: true,
        start_video_off: false,
        exp,
      },
    }),
  });
  if (!data.token) throw new Error("Daily did not return a meeting token.");
  return data.token;
}

export async function getDailyJoinCredentials(input: {
  sessionId: string;
  callType: "voice" | "video";
  displayName: string;
  isOwner: boolean;
}) {
  const room = await ensureDailyRoomForMessagingCall({
    sessionId: input.sessionId,
    callType: input.callType,
  });
  const token = await createDailyMeetingToken({
    roomName: room.roomName,
    userName: input.displayName,
    isOwner: input.isOwner,
  });
  return {
    roomName: room.roomName,
    roomUrl: room.roomUrl,
    token,
    provider: "daily" as const,
  };
}
