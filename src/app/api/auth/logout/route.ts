import { NextRequest, NextResponse } from "next/server";

import {
  getRequestHost,
  normalizeHost,
  resolveValidatedLoginReturnOrigin,
  workspaceLoginUrl,
} from "@/lib/app-domains";
import {
  clearAbhiPortalsGateCookie,
  clearOverviewGateCookie,
  clearPlatformSessionCookie,
} from "@/lib/platform-session-cookie";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * End the platform session and return where the browser should navigate next.
 * Customer hosts (e.g. corpcentre) return to that host's `/login`.
 */
export async function POST(request: NextRequest) {
  const session = await getPlatformSession();

  let returnOrigin: string | null = null;
  try {
    const body = (await request.json().catch(() => null)) as { returnTo?: string } | null;
    returnOrigin = resolveValidatedLoginReturnOrigin(body?.returnTo ?? null);
  } catch {
    returnOrigin = null;
  }

  if (!returnOrigin) {
    const host = normalizeHost(getRequestHost(request));
    if (host.endsWith(".unit311central.com") && host !== "unit311central.com" && host !== "www.unit311central.com") {
      returnOrigin = resolveValidatedLoginReturnOrigin(`https://${host}`);
    }
  }

  const loginUrl = workspaceLoginUrl(returnOrigin);
  const response = NextResponse.json({
    ok: true,
    loginUrl,
    hadSession: Boolean(session),
  });
  clearPlatformSessionCookie(response, request);
  clearAbhiPortalsGateCookie(response, request);
  clearOverviewGateCookie(response, request);
  return response;
}
