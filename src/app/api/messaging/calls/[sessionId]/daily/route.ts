import { NextRequest, NextResponse } from "next/server";

import {
  getDailyJoinCredentials,
  isDailyConfigured,
} from "@/lib/daily-call-service";
import {
  getMessagingCallRoom,
  getMessagingCallSession,
  getMessagingCallSessionForGuest,
  assertValidGuestToken,
} from "@/lib/messaging-call-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

function guestTokenFromRequest(request: NextRequest) {
  return (
    request.headers.get("x-call-guest-token")?.trim() ||
    request.nextUrl.searchParams.get("guest")?.trim() ||
    null
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  if (!isDailyConfigured()) {
    return NextResponse.json(
      {
        error:
          "Daily is not configured. Add DAILY_API_KEY to Vercel (Daily dashboard → Developers).",
        provider: null,
      },
      { status: 503 },
    );
  }

  try {
    const { sessionId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      guestToken?: string;
      displayName?: string;
    };
    const guestToken = body.guestToken?.trim() || guestTokenFromRequest(request);
    const room = await getMessagingCallRoom(sessionId);
    if (!room || room.endedAt) {
      return NextResponse.json({ error: "Call not found." }, { status: 404 });
    }

    let displayName: string;
    let isOwner = false;

    if (guestToken) {
      assertValidGuestToken(room, guestToken);
      const payload = await getMessagingCallSessionForGuest(
        sessionId,
        guestToken,
        body.displayName?.trim(),
      );
      if (!payload) {
        return NextResponse.json({ error: "Call not found." }, { status: 404 });
      }
      displayName = body.displayName?.trim() || payload.viewer.displayName || "Guest";
      isOwner = false;
    } else {
      const session = await requirePlatformSession();
      const payload = await getMessagingCallSession(sessionId, session);
      if (!payload) {
        return NextResponse.json({ error: "Call not found." }, { status: 404 });
      }
      displayName = payload.viewer.displayName;
      isOwner = payload.viewer.isHost;
    }

    const credentials = await getDailyJoinCredentials({
      sessionId,
      callType: room.callType,
      displayName,
      isOwner,
    });

    return NextResponse.json(credentials);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Daily token";
    const status = message.includes("Authentication")
      ? 401
      : message.includes("Invalid") || message.includes("does not allow")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
