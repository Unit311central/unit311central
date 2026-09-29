import { NextRequest, NextResponse } from "next/server";

import { exchangeCronofyAuthorizationCode } from "@/lib/cronofy/client";
import { getCronofyConfig } from "@/lib/cronofy/config";
import { upsertCronofyAccount } from "@/lib/cronofy/cronofy-account-service";
import { verifyCronofyOAuthState } from "@/lib/cronofy/oauth-state";
import { cronofyOAuthRedirectUri } from "@/lib/cronofy/redirect-uri";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const errorParam = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  const code = request.nextUrl.searchParams.get("code");
  const stateToken = request.nextUrl.searchParams.get("state");

  const state = stateToken ? verifyCronofyOAuthState(stateToken) : null;
  const returnPath = state?.returnPath ?? "/board/meetings";
  const meetingId = state?.meetingId ?? "";

  const redirectWith = (params: Record<string, string>) => {
    const url = new URL(returnPath, request.nextUrl.origin);
    url.searchParams.set("createMeeting", meetingId);
    url.searchParams.set("wizardStep", "2");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return NextResponse.redirect(url);
  };

  if (errorParam) {
    return redirectWith({
      cronofy: "error",
      cronofyMessage: errorDescription || errorParam,
    });
  }

  if (!getCronofyConfig()) {
    return redirectWith({
      cronofy: "error",
      cronofyMessage: "Cronofy is not configured.",
    });
  }

  if (!state || !code) {
    return redirectWith({
      cronofy: "error",
      cronofyMessage: "Invalid or expired OAuth state. Please try connecting again.",
    });
  }

  try {
    const redirectUri = cronofyOAuthRedirectUri(request);
    const token = await exchangeCronofyAuthorizationCode({ code, redirectUri });
    await upsertCronofyAccount({
      platformUserId: state.platformUserId,
      workspaceId: state.workspaceId,
      token,
    });
    return redirectWith({ cronofy: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cronofy authorization failed.";
    return redirectWith({ cronofy: "error", cronofyMessage: message });
  }
}
