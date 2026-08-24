import { NextResponse } from "next/server";

import type { PlatformSession } from "@/lib/platform-session";

export function technicalFileActor(session: PlatformSession) {
  return { userId: session.sub, displayName: session.displayName || session.username };
}

export function technicalFileErrorResponse(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const status = message.includes("not found")
    ? 404
    : message.includes("not configured")
      ? 503
      : message.includes("must be")
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}
