import { NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";

export async function requireRealtimeVideoPipelineSession(request: { headers: Headers }) {
  const host = getRequestHost(request);
  if (!isInternalDomainHost(host)) {
    throw new Error("Not available on this host.");
  }

  const session = await getPlatformSession();
  if (!session) throw new Error("Authentication required.");
  if (session.userType !== "internal") throw new Error("Internal operators only.");
  return session;
}

export function pipelineErrorResponse(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  if (message.includes("Authentication required")) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.includes("Internal operators") || message.includes("Not available")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  if (message.includes("not found")) {
    return NextResponse.json({ error: message }, { status: 404 });
  }
  if (message.includes("not configured")) {
    return NextResponse.json({ error: message }, { status: 503 });
  }
  if (message.includes("Cannot delete") || message.includes("must be")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}
