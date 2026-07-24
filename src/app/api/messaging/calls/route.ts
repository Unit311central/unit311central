import { NextRequest, NextResponse } from "next/server";

import {
  createMessagingCallRoom,
  parseMessagingCallSessionId,
  type MessagingCallType,
} from "@/lib/messaging-call-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { CENTRAL_SITE_URL } from "@/lib/app-domains";

export const dynamic = "force-dynamic";

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      sessionId?: string;
      callType?: MessagingCallType;
      channelRoom?: string;
      hostOperatorId?: string;
      hostOperatorName?: string;
      instantMeeting?: boolean;
      allowGuestJoin?: boolean;
    };

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

    const room = await createMessagingCallRoom({
      sessionId,
      workspaceId: workspace.id,
      channelRoom,
      callType,
      hostOperatorId,
      hostOperatorName,
      allowGuestJoin: instantMeeting,
    });

    const callLink = `${CENTRAL_SITE_URL}/meet/${callType}/${room.sessionId}`;
    const guestLink =
      room.allowGuestJoin && room.guestToken
        ? `${callLink}?guest=${encodeURIComponent(room.guestToken)}`
        : null;

    return NextResponse.json({ room, callLink, guestLink, instantMeeting });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create call room";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
