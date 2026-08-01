import { NextResponse } from "next/server";

import { getPlatformSession, type PlatformSession } from "@/lib/platform-session";
import { getCompanyPortalByPath } from "@/lib/talanton/company-portal-routes";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
  type CurrentWorkspace,
} from "@/lib/workspace-context";

const AUTH_REQUIRED = "Authentication required.";

/**
 * LMS APIs allow internal staff and external portal users for the host workspace.
 */
export async function requireLmsWorkspaceSession(): Promise<
  { error: NextResponse } | { session: PlatformSession; workspace: CurrentWorkspace }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: AUTH_REQUIRED }, { status: 401 }) };
  }

  try {
    const workspace = await requireCurrentWorkspace();
    return { session, workspace };
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return {
        error: NextResponse.json({ error: error.message }, { status: error.status }),
      };
    }
    return {
      error: NextResponse.json({ error: "Workspace access denied." }, { status: 403 }),
    };
  }
}

/**
 * For Talanton external portal users, resolve client_id from session.redirectPath.
 * Other workspaces / internal users get null.
 */
export function resolveLmsClientId(
  session: PlatformSession,
  workspaceSlug: string,
): string | null {
  if (session.userType !== "external") return null;
  if (workspaceSlug !== TALANTON_IMPACT_SLUG) return null;
  return getCompanyPortalByPath(session.redirectPath)?.clientId ?? null;
}
