import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { CENTRAL_SITE_URL } from "@/lib/app-domains";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { ensureDailyRoomForMessagingCall, isDailyConfigured } from "@/lib/daily-call-service";
import {
  createMessagingCallRoom,
  parseMessagingCallSessionId,
  type MessagingCallType,
} from "@/lib/messaging-call-service";
import {
  ensureMessagingInstantMeetingSchema,
  isMissingInstantMeetingColumnError,
} from "@/lib/messaging-instant-meeting-schema";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const body = (await request.json()) as {
    sessionId?: string;
    callType?: MessagingCallType;
    channelRoom?: string;
    hostOperatorId?: string;
    hostOperatorName?: string;
    instantMeeting?: boolean;
    allowGuestJoin?: boolean;
  };

  if (await isDemoApiRequest()) {
    const callType: MessagingCallType = body.callType === "voice" ? "voice" : "video";
    const instantMeeting = Boolean(body.instantMeeting || body.allowGuestJoin);
    const sessionId = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const callLink = `${CENTRAL_SITE_URL}/meet/${callType}/${sessionId}`;
    const guestToken = crypto.randomUUID().slice(0, 12);
    const guestLink = instantMeeting ? `${callLink}?guest=${encodeURIComponent(guestToken)}` : null;
    return NextResponse.json({
      room: {
        sessionId,
        callType,
        channelRoom: body.channelRoom ?? `instant-meeting:${sessionId}`,
        allowGuestJoin: instantMeeting,
        guestToken: instantMeeting ? guestToken : null,
      },
      callLink,
      guestLink,
      instantMeeting,
      provider: "demo",
      dailyRoomUrl: null,
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();

    const callType: MessagingCallType = body.callType === "voice" ? "voice" : "video";
    const instantMeeting = Boolean(body.instantMeeting || body.allowGuestJoin);
    const sessionId =
      parseMessagingCallSessionId(body.sessionId || "") ||
      (instantMeeting
        ? crypto.randomUUID().replace(/-/g, "")
        : crypto.randomUUID().replace(/-/g, "").slice(0, 10));
    const hostOperatorId =
      body.hostOperatorId?.trim() || session.sub || session.username;
    const hostOperatorName =
      body.hostOperatorName?.trim() || session.displayName || session.username;

    const channelRoom =
      body.channelRoom?.trim() ||
      (instantMeeting ? `instant-meeting:${sessionId}` : "");

    if (!channelRoom) {
      return NextResponse.json({ error: "channelRoom is required." }, { status: 400 });
    }

    if (instantMeeting) {
      // Soft ensure only — never block Instant Meeting on pooler password probes.
      await ensureMessagingInstantMeetingSchema().catch(() => false);
    }

    let room;
    try {
      room = await createMessagingCallRoom({
        sessionId,
        workspaceId: workspace.id,
        channelRoom,
        callType,
        hostOperatorId,
        hostOperatorName,
        allowGuestJoin: instantMeeting,
      });
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Failed to create call room";
      if (instantMeeting && isMissingInstantMeetingColumnError(message)) {
        const ready = await ensureMessagingInstantMeetingSchema(true);
        if (!ready) {
          throw new Error(
            "Instant Meeting columns are not ready yet. Wait a minute and try again, or run pending migrations.",
          );
        }
        room = await createMessagingCallRoom({
          sessionId,
          workspaceId: workspace.id,
          channelRoom,
          callType,
          hostOperatorId,
          hostOperatorName,
          allowGuestJoin: instantMeeting,
        });
      } else {
        throw createError;
      }
    }

    let dailyRoomUrl: string | null = null;
    if (isDailyConfigured()) {
      try {
        const daily = await ensureDailyRoomForMessagingCall({
          sessionId: room.sessionId,
          callType,
        });
        dailyRoomUrl = daily.roomUrl;
      } catch (dailyError) {
        console.error("[messaging/calls] Daily room ensure failed", dailyError);
      }
    }

    const callLink = `${CENTRAL_SITE_URL}/meet/${callType}/${room.sessionId}`;
    const guestLink =
      room.allowGuestJoin && room.guestToken
        ? `${callLink}?guest=${encodeURIComponent(room.guestToken)}`
        : null;

    return NextResponse.json({
      room,
      callLink,
      guestLink,
      instantMeeting,
      provider: isDailyConfigured() ? "daily" : "webrtc",
      dailyRoomUrl,
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Failed to create call room";
    const message =
      /ecircuitbreaker|too many authentication failures|temporarily blocked/i.test(raw)
        ? "Database connections are temporarily blocked after auth failures. Wait ~60 seconds and try Create Instant Meeting again."
        : raw;
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
