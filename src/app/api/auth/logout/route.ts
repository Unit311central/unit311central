import { NextRequest, NextResponse } from "next/server";

import { workspaceLoginUrl, parseValidWorkspaceReturnTo } from "@/lib/app-domains";
import { clearPlatformSessionCookie } from "@/lib/platform-session-cookie";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * End the platform session and return where the browser should navigate next.
 * Customer hosts (e.g. corpcentre) return to that host's `/login`.
 */
export async function POST(request: NextRequest) {
  const session = await getPlatformSession();

  let returnTo: string | null = null;
  try {
    const body = (await request.json().catch(() => null)) as { returnTo?: string } | null;
    returnTo = parseValidWorkspaceReturnTo(body?.returnTo ?? null);
  } catch {
    returnTo = null;
  }

  if (!returnTo) {
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      "";
    if (/\.unit311central\.com$/i.test(host) && !/^www\./i.test(host)) {
      returnTo = parseValidWorkspaceReturnTo(`https://${host}`);
    }
  }

  const loginUrl = workspaceLoginUrl(returnTo);
  const response = NextResponse.json({
    ok: true,
    loginUrl,
    hadSession: Boolean(session),
  });
  clearPlatformSessionCookie(response, request);
  return response;
}
