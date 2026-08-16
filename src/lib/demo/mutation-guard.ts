import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  DEMO_ADMIN_USERNAME,
  demoMutationBlockedMessage,
  isDemoReadOnlySession,
} from "@/lib/demo/read-only";
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
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    isDemoReadOnlySession({
      workspaceSlug: ctx.workspaceSlug,
      username: ctx.session.username,
    })
  ) {
    return NextResponse.json({ error: demoMutationBlockedMessage() }, { status: 403 });
  }
  return null;
}

export function isDemoAdminUsername(username: string | null | undefined): boolean {
  return String(username ?? "").trim().toLowerCase() === DEMO_ADMIN_USERNAME;
}
