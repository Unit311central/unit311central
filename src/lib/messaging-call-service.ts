import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { clearWebrtcSignals } from "@/lib/executive-call-webrtc-service";
import type { PlatformSession } from "@/lib/platform-session";
import { authorizeUserForWorkspace } from "@/lib/workspace-authorization";

export type MessagingCallType = "voice" | "video";

export type MessagingCallRoom = {
  sessionId: string;
  workspaceId: string;
  channelRoom: string;
  callType: MessagingCallType;
  hostOperatorId: string;
  hostOperatorName: string;
  hostJoinedAt: string | null;
  guestOperatorId: string | null;
  guestOperatorName: string | null;
  guestJoinedAt: string | null;
  allowGuestJoin: boolean;
  guestToken: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type MessagingCallSessionPayload = {
  room: MessagingCallRoom;
  viewer: {
    isHost: boolean;
    displayName: string;
    operatorId: string;
    isExternalGuest: boolean;
  };
  bothJoined: boolean;
};

type RoomRow = {
  session_id: string;
  workspace_id: string;
  channel_room: string;
  call_type: string;
  host_operator_id: string;
  host_operator_name: string | null;
  host_joined_at: string | null;
  guest_operator_id: string | null;
  guest_operator_name: string | null;
  guest_joined_at: string | null;
  allow_guest_join?: boolean | null;
  guest_token?: string | null;
  ended_at: string | null;
  created_at: string;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

function mapRoom(row: RoomRow): MessagingCallRoom {
  return {
    sessionId: row.session_id,
    workspaceId: row.workspace_id,
    channelRoom: row.channel_room,
    callType: row.call_type === "voice" ? "voice" : "video",
    hostOperatorId: row.host_operator_id,
    hostOperatorName: row.host_operator_name ?? "",
    hostJoinedAt: row.host_joined_at,
    guestOperatorId: row.guest_operator_id,
    guestOperatorName: row.guest_operator_name,
    guestJoinedAt: row.guest_joined_at,
    allowGuestJoin: Boolean(row.allow_guest_join),
    guestToken: row.guest_token ?? null,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

export function parseMessagingCallSessionId(callLinkOrId: string) {
  const trimmed = callLinkOrId.trim();
  const match = trimmed.match(/\/meet\/(?:voice|video)\/([^/?#]+)/i);
  if (match?.[1]) return match[1];
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

export function createGuestMeetingToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export function guestOperatorIdFromToken(guestToken: string) {
  return `guest:${guestToken.slice(0, 16)}`;
}

export function assertValidGuestToken(room: MessagingCallRoom, guestToken: string | null | undefined) {
  if (!room.allowGuestJoin || !room.guestToken) {
    throw new Error("This meeting does not allow external guests.");
  }
  if (!guestToken || guestToken !== room.guestToken) {
    throw new Error("Invalid or missing guest meeting link.");
  }
}

export async function createMessagingCallRoom(input: {
  sessionId: string;
  workspaceId: string;
  channelRoom: string;
  callType: MessagingCallType;
  hostOperatorId: string;
  hostOperatorName: string;
  allowGuestJoin?: boolean;
  guestToken?: string | null;
}): Promise<MessagingCallRoom> {
  const supabase = requireSupabase();
  const sessionId = parseMessagingCallSessionId(input.sessionId);
  if (!sessionId) throw new Error("sessionId is required.");

  const { data: existing } = await supabase
    .from("messaging_call_rooms")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing && !(existing as RoomRow).ended_at) {
    if (String((existing as RoomRow).workspace_id) !== input.workspaceId) {
      throw new Error("Call session belongs to another workspace.");
    }
    return mapRoom(existing as RoomRow);
  }

  await clearWebrtcSignals(sessionId).catch(() => undefined);

  const allowGuestJoin = Boolean(input.allowGuestJoin);
  const guestToken = allowGuestJoin
    ? input.guestToken?.trim() || createGuestMeetingToken()
    : null;

  const { data, error } = await supabase
    .from("messaging_call_rooms")
    .upsert(
      {
        session_id: sessionId,
        workspace_id: input.workspaceId,
        channel_room: input.channelRoom,
        call_type: input.callType,
        host_operator_id: input.hostOperatorId,
        host_operator_name: input.hostOperatorName,
        host_joined_at: null,
        guest_operator_id: null,
        guest_operator_name: null,
        guest_joined_at: null,
        allow_guest_join: allowGuestJoin,
        guest_token: guestToken,
        ended_at: null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRoom(data as RoomRow);
}

export async function getMessagingCallRoom(sessionId: string): Promise<MessagingCallRoom | null> {
  const supabase = requireSupabase();
  const id = parseMessagingCallSessionId(sessionId);
  const { data, error } = await supabase
    .from("messaging_call_rooms")
    .select("*")
    .eq("session_id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRoom(data as RoomRow) : null;
}

function resolveOperatorId(session: PlatformSession) {
  return session.sub || session.username;
}

function resolveDisplayName(session: PlatformSession) {
  return session.displayName?.trim() || session.username;
}

export async function getMessagingCallSession(
  sessionId: string,
  session: PlatformSession,
): Promise<MessagingCallSessionPayload | null> {
  const room = await getMessagingCallRoom(sessionId);
  if (!room || room.endedAt) return null;

  const decision = await authorizeUserForWorkspace(session.sub, room.workspaceId, {
    userTypeHint: session.userType,
  });
  if (!decision.allowed) return null;

  const operatorId = resolveOperatorId(session);
  const isHost =
    room.hostOperatorId === operatorId ||
    room.hostOperatorId === session.username ||
    Boolean(
      session.username &&
        room.hostOperatorName &&
        room.hostOperatorName.toLowerCase() === session.username.toLowerCase(),
    ) ||
    Boolean(
      session.displayName &&
        room.hostOperatorName &&
        room.hostOperatorName.toLowerCase() === session.displayName.toLowerCase(),
    );

  return {
    room,
    viewer: {
      isHost,
      displayName: resolveDisplayName(session),
      operatorId,
      isExternalGuest: false,
    },
    bothJoined: Boolean(room.hostJoinedAt && room.guestJoinedAt),
  };
}

export async function getMessagingCallSessionForGuest(
  sessionId: string,
  guestToken: string,
  displayName?: string,
): Promise<MessagingCallSessionPayload | null> {
  const room = await getMessagingCallRoom(sessionId);
  if (!room || room.endedAt) return null;
  assertValidGuestToken(room, guestToken);

  const operatorId = guestOperatorIdFromToken(guestToken);
  const name =
    displayName?.trim() ||
    room.guestOperatorName ||
    "Guest";

  return {
    room,
    viewer: {
      isHost: false,
      displayName: name,
      operatorId,
      isExternalGuest: true,
    },
    bothJoined: Boolean(room.hostJoinedAt && room.guestJoinedAt),
  };
}

export async function joinMessagingCallRoom(input: {
  sessionId: string;
  session: PlatformSession;
}): Promise<MessagingCallSessionPayload> {
  const supabase = requireSupabase();
  const room = await getMessagingCallRoom(input.sessionId);
  if (!room) throw new Error("Call not found.");
  if (room.endedAt) throw new Error("This call has ended.");

  const decision = await authorizeUserForWorkspace(input.session.sub, room.workspaceId, {
    userTypeHint: input.session.userType,
  });
  if (!decision.allowed) {
    throw new Error("You are not allowed to join this call for the current workspace.");
  }

  const operatorId = resolveOperatorId(input.session);
  const displayName = resolveDisplayName(input.session);
  const isHost =
    room.hostOperatorId === operatorId ||
    room.hostOperatorId === input.session.username ||
    Boolean(
      input.session.username &&
        room.hostOperatorName &&
        room.hostOperatorName.toLowerCase() === input.session.username.toLowerCase(),
    ) ||
    Boolean(
      input.session.displayName &&
        room.hostOperatorName &&
        room.hostOperatorName.toLowerCase() === input.session.displayName.toLowerCase(),
    );
  const now = new Date().toISOString();

  if (isHost) {
    const { data, error } = await supabase
      .from("messaging_call_rooms")
      .update({ host_joined_at: room.hostJoinedAt ?? now })
      .eq("session_id", room.sessionId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const mapped = mapRoom(data as RoomRow);
    return {
      room: mapped,
      viewer: { isHost: true, displayName, operatorId, isExternalGuest: false },
      bothJoined: Boolean(mapped.hostJoinedAt && mapped.guestJoinedAt),
    };
  }

  // Multiparty (Daily): additional authenticated participants may join without
  // overwriting the primary guest slot.
  if (
    room.guestOperatorId &&
    room.guestOperatorId !== operatorId &&
    room.guestOperatorId !== input.session.username
  ) {
    return {
      room,
      viewer: { isHost: false, displayName, operatorId, isExternalGuest: false },
      bothJoined: true,
    };
  }

  const { data, error } = await supabase
    .from("messaging_call_rooms")
    .update({
      guest_operator_id: operatorId,
      guest_operator_name: displayName,
      guest_joined_at: room.guestJoinedAt ?? now,
    })
    .eq("session_id", room.sessionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const mapped = mapRoom(data as RoomRow);
  return {
    room: mapped,
    viewer: { isHost: false, displayName, operatorId, isExternalGuest: false },
    bothJoined: Boolean(mapped.hostJoinedAt && mapped.guestJoinedAt),
  };
}

export async function joinMessagingCallRoomAsGuest(input: {
  sessionId: string;
  guestToken: string;
  displayName: string;
}): Promise<MessagingCallSessionPayload> {
  const supabase = requireSupabase();
  const room = await getMessagingCallRoom(input.sessionId);
  if (!room) throw new Error("Call not found.");
  if (room.endedAt) throw new Error("This call has ended.");
  assertValidGuestToken(room, input.guestToken);

  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("Display name is required.");

  const operatorId = guestOperatorIdFromToken(input.guestToken);
  // Multiparty: same guest link can be used by several externals (Daily).
  // Only block if a *different* guest identity already occupies the primary slot
  // and we are not using shared-token joins — shared token shares operatorId.
  if (
    room.guestOperatorId &&
    room.guestOperatorId !== operatorId &&
    room.guestJoinedAt
  ) {
    // Allow additional guests; return session without overwriting primary guest metadata.
    return {
      room,
      viewer: { isHost: false, displayName, operatorId, isExternalGuest: true },
      bothJoined: true,
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("messaging_call_rooms")
    .update({
      guest_operator_id: operatorId,
      guest_operator_name: displayName,
      guest_joined_at: room.guestJoinedAt ?? now,
    })
    .eq("session_id", room.sessionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const mapped = mapRoom(data as RoomRow);
  return {
    room: mapped,
    viewer: { isHost: false, displayName, operatorId, isExternalGuest: true },
    bothJoined: Boolean(mapped.hostJoinedAt && mapped.guestJoinedAt),
  };
}

export async function leaveMessagingCallRoom(input: {
  sessionId: string;
  session: PlatformSession;
}): Promise<MessagingCallRoom> {
  const supabase = requireSupabase();
  const room = await getMessagingCallRoom(input.sessionId);
  if (!room) throw new Error("Call not found.");

  const operatorId = resolveOperatorId(input.session);
  const isHost =
    room.hostOperatorId === operatorId ||
    room.hostOperatorId === input.session.username ||
    Boolean(
      input.session.username &&
        room.hostOperatorName &&
        room.hostOperatorName.toLowerCase() === input.session.username.toLowerCase(),
    ) ||
    Boolean(
      input.session.displayName &&
        room.hostOperatorName &&
        room.hostOperatorName.toLowerCase() === input.session.displayName.toLowerCase(),
    );
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("messaging_call_rooms")
    .update({
      ended_at: now,
      ...(isHost ? { host_joined_at: room.hostJoinedAt } : { guest_joined_at: room.guestJoinedAt }),
    })
    .eq("session_id", room.sessionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await clearWebrtcSignals(room.sessionId).catch(() => undefined);
  return mapRoom(data as RoomRow);
}

export async function leaveMessagingCallRoomAsGuest(input: {
  sessionId: string;
  guestToken: string;
}): Promise<MessagingCallRoom> {
  const supabase = requireSupabase();
  const room = await getMessagingCallRoom(input.sessionId);
  if (!room) throw new Error("Call not found.");
  assertValidGuestToken(room, input.guestToken);

  const { data, error } = await supabase
    .from("messaging_call_rooms")
    .update({
      guest_operator_id: null,
      guest_operator_name: null,
      guest_joined_at: null,
    })
    .eq("session_id", room.sessionId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRoom(data as RoomRow);
}
