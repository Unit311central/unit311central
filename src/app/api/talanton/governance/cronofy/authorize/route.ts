import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { buildCronofyAuthorizeUrl } from "@/lib/cronofy/client";
import { getCronofyConfig } from "@/lib/cronofy/config";
import { createCronofyOAuthState } from "@/lib/cronofy/oauth-state";
import { cronofyOAuthRedirectUri } from "@/lib/cronofy/redirect-uri";
import { requireTalantonGovernanceWorkspace } from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!getCronofyConfig()) {
    return NextResponse.json(
      { error: "Cronofy is not configured on this environment." },
      { status: 503 },
    );
  }

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const meetingId = request.nextUrl.searchParams.get("meetingId")?.trim();
    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required." }, { status: 400 });
    }
    const returnPath =
      request.nextUrl.searchParams.get("returnPath")?.trim() || "/board/meetings";

    const state = createCronofyOAuthState({
      platformUserId: session.sub,
      workspaceId: workspace.id,
      meetingId,
      returnPath,
    });

    const redirectUri = cronofyOAuthRedirectUri(request);
    const authorizeUrl = buildCronofyAuthorizeUrl({ redirectUri, state });

    return NextResponse.json({ authorizeUrl, redirectUri });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to start Cronofy authorization.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
