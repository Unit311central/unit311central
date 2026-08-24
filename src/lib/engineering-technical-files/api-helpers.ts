import { NextResponse } from "next/server";

import type { PlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export function technicalFileActor(session: PlatformSession) {
  return { userId: session.sub, displayName: session.displayName || session.username };
}

export function technicalFileErrorResponse(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  if (error instanceof WorkspaceAccessError) {
    return NextResponse.json({ error: message }, { status: error.status });
  }
  if (message.includes("Authentication required") || message.includes("Workspace context")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.includes("Workspace access denied")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  const status = message.includes("not found")
    ? 404
    : message.includes("not configured")
      ? 503
      : message.includes("must be")
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}
