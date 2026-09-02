import { NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { isWolfClonedAnalyticsHost } from "@/lib/wolf/wolf-analytics-access";
import { isWolfCentralHost, WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { runWithPipelineWorkspaceContext } from "@/lib/realtime-video-pipeline/workspace-context";

export type RealtimeVideoPipelineSession = Awaited<ReturnType<typeof getPlatformSession>>;

export async function requireRealtimeVideoPipelineSession(request: { headers: Headers }) {
  const host = getRequestHost(request);
  if (!isWolfClonedAnalyticsHost(host)) {
    throw new Error("Not available on this host.");
  }

  const session = await getPlatformSession();
  if (!session) throw new Error("Authentication required.");
  if (session.userType !== "internal") throw new Error("Internal operators only.");

  const workspaceSlug = isWolfCentralHost(host) ? WOLF_CENTRAL_SLUG : INTERNAL_WORKSPACE_SLUG;
  return { session, workspaceSlug };
}

export async function executeWithPipelineAuth<T>(
  request: { headers: Headers },
  fn: () => Promise<T>,
): Promise<T> {
  const { workspaceSlug } = await requireRealtimeVideoPipelineSession(request);
  return runWithPipelineWorkspaceContext(workspaceSlug, fn);
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
