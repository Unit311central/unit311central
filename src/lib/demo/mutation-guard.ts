import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  evaluateDemoProspectMutationBlock,
  isDemoMutationExemptApiPath,
} from "@/lib/demo/mutation-guard-core";
import { isDemoAdminUsername } from "@/lib/demo/read-only";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export async function getDemoSessionContext() {
  const jar = await cookies();
  const token = jar.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readPlatformSessionToken(token);
  if (!session) return null;
  const workspaceSlug = session.workspaceSlug ?? DEMO_WORKSPACE_SLUG;
  return { session, workspaceSlug };
}

export async function assertDemoMutationAllowed(): Promise<NextResponse | null> {
  const ctx = await getDemoSessionContext();
  return evaluateDemoProspectMutationBlock({
    session: ctx?.session ?? null,
    workspaceSlug: ctx?.workspaceSlug,
    requireSession: false,
  });
}

/** Route-handler guard: respects exempt paths (EA, auth, analytics, etc.). */
export async function assertDemoMutationAllowedForRequest(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  if (isDemoMutationExemptApiPath(pathname)) return null;
  return assertDemoMutationAllowed();
}

export { isDemoAdminUsername };
