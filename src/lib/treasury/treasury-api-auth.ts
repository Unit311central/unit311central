import { NextResponse } from "next/server";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { requirePlatformSession, getPlatformSession, type PlatformSession } from "@/lib/platform-session";
import { isWiseTreasuryWorkspaceSlug } from "@/lib/treasury/bank-provider";
import { getWiseConnectionStatus } from "@/lib/wise-service";
import {
  requireCurrentWorkspace,
  type CurrentWorkspace,
} from "@/lib/workspace-context";

const DEMO_WORKSPACE: CurrentWorkspace = {
  id: "demo-workspace",
  slug: DEMO_WORKSPACE_SLUG,
  name: "Northstar Industrial Technologies",
  workspaceType: "Demo",
};

function demoPlatformSession(existing: PlatformSession | null): PlatformSession {
  if (existing) return existing;
  return {
    sub: "demo-admin",
    username: "admin@unit311central.com",
    displayName: "Demo Admin",
    userType: "internal",
    redirectPath: "/",
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    workspaceName: DEMO_WORKSPACE.name,
  };
}

export const WISE_INTERNAL_ONLY_MESSAGE =
  "Bank connections are not enabled for this workspace.";
export const WISE_WORKSPACE_DENIED_MESSAGE =
  "Bank connections are not enabled for this workspace.";

export async function requireTreasuryApiSession():
  Promise<
    | { error: NextResponse }
    | { session: NonNullable<Awaited<ReturnType<typeof getPlatformSession>>> }
  > {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { session };
}

/**
 * Session + workspace required.
 * Internal uses live Wise; Demo uses the simulated Wise provider (no external API).
 */
export async function requireInternalWiseWorkspace():
  Promise<
    | { error: NextResponse }
    | {
        session: NonNullable<Awaited<ReturnType<typeof getPlatformSession>>>;
        workspace: CurrentWorkspace;
      }
  > {
  if (await isDemoApiRequest()) {
    const session = demoPlatformSession(await getPlatformSession());
    try {
      const workspace = await requireCurrentWorkspace();
      if (isWiseTreasuryWorkspaceSlug(workspace.slug)) {
        return { session, workspace };
      }
    } catch {
      /* fall through to synthetic demo workspace */
    }
    return { session, workspace: DEMO_WORKSPACE };
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    if (!isWiseTreasuryWorkspaceSlug(workspace.slug)) {
      return {
        error: NextResponse.json({ error: WISE_WORKSPACE_DENIED_MESSAGE }, { status: 403 }),
      };
    }
    return { session, workspace };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return { error: NextResponse.json({ error: message }, { status }) };
  }
}

export async function requireWiseTreasuryConnection():
  Promise<
    | { error: NextResponse }
    | {
        session: NonNullable<Awaited<ReturnType<typeof getPlatformSession>>>;
        workspace: CurrentWorkspace;
        status: Awaited<ReturnType<typeof getWiseConnectionStatus>>;
      }
  > {
  const auth = await requireInternalWiseWorkspace();
  if ("error" in auth) return auth;

  const status = await getWiseConnectionStatus();
  if (!status.configured) {
    return {
      error: NextResponse.json(
        { error: "Wise is not configured.", status },
        { status: 503 },
      ),
    };
  }
  if (!status.connected || !status.profileId) {
    return {
      error: NextResponse.json(
        { error: status.error ?? "Unable to connect to Wise.", status },
        { status: 502 },
      ),
    };
  }

  return { session: auth.session, workspace: auth.workspace, status };
}
