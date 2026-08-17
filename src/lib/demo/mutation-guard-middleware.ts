import type { NextRequest } from "next/server";

import {
  evaluateDemoProspectMutationBlock,
  isApiMutationMethod,
  isDemoMutationExemptApiPath,
} from "@/lib/demo/mutation-guard-core";
import {
  PLATFORM_SESSION_COOKIE,
  readPlatformSessionToken,
} from "@/lib/platform-session-token";

/**
 * Blocks demo prospect (demo@unit311central.com) mutations on /api/* before route handlers run.
 * Returns a 403 response when blocked, otherwise null.
 */
export async function blockDemoProspectApiMutation(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return null;
  if (!isApiMutationMethod(request.method)) return null;
  if (isDemoMutationExemptApiPath(pathname)) return null;

  const token = request.cookies.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await readPlatformSessionToken(token);
  return evaluateDemoProspectMutationBlock({ session });
}
