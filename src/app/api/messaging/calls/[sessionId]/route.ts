import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  getMessagingCallSession,
  getMessagingCallSessionForGuest,
  joinMessagingCallRoom,
  joinMessagingCallRoomAsGuest,
  leaveMessagingCallRoom,
  leaveMessagingCallRoomAsGuest,
} from "@/lib/messaging-call-service";
import { getPlatformSession, requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

function authErrorStatus(message: string) {
  if (message.includes("Authentication required") || message.includes("Invalid or missing")) {
    return 401;
  }
  if (message.includes("does not allow")) return 403;
  if (message.includes("not found") || message.includes("ended")) return 404;
  if (message.includes("already has two")) return 409;
  return 500;
}

function guestTokenFromRequest(request: NextRequest) {
  return (
    request.headers.get("x-call-guest-token")?.trim() ||
    request.nextUrl.searchParams.get("guest")?.trim() ||
    null
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { sessionId } = await context.params;
    const guestToken = guestTokenFromRequest(request);
    if (guestToken) {
      const displayName = request.nextUrl.searchParams.get("name")?.trim() || undefined;
      const payload = await getMessagingCallSessionForGuest(sessionId, guestToken, displayName);
      if (!payload) {
        return NextResponse.json({ error: "Call not found." }, { status: 404 });
      }
      return NextResponse.json(payload);
    }

    const session = await requirePlatformSession();
    const payload = await getMessagingCallSession(sessionId, session);
    if (!payload) {
      return NextResponse.json({ error: "Call not found." }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load call";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { sessionId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      displayName?: string;
      guestToken?: string;
    };
    const action = body.action?.trim() || "join";
    const guestToken = body.guestToken?.trim() || guestTokenFromRequest(request);

    if (guestToken) {
      if (action === "leave") {
        const room = await leaveMessagingCallRoomAsGuest({ sessionId, guestToken });
        return NextResponse.json({ room });
      }
      if (action === "join") {
        const payload = await joinMessagingCallRoomAsGuest({
          sessionId,
          guestToken,
          displayName: body.displayName?.trim() || "Guest",
        });
        return NextResponse.json(payload);
      }
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }

    const session = (await getPlatformSession()) ?? (await requirePlatformSession());
    if (action === "leave") {
      const room = await leaveMessagingCallRoom({ sessionId, session });
      return NextResponse.json({ room });
    }

    if (action === "join") {
      const payload = await joinMessagingCallRoom({ sessionId, session });
      return NextResponse.json(payload);
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update call";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
