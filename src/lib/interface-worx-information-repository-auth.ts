import { NextResponse } from "next/server";

import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { isInterfaceWorxSlug } from "@/lib/interface-worx-surface";
import type { CurrentWorkspace } from "@/lib/workspace-context";
import type { PlatformSession } from "@/lib/platform-session";

export async function requireInterfaceWorxWorkspaceSession(): Promise<
  { error: NextResponse } | { session: PlatformSession; workspace: CurrentWorkspace }
> {
  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth;

  if (!isInterfaceWorxSlug(auth.workspace.slug)) {
    return {
      error: NextResponse.json(
        { error: "Information Repository is only available for Interface Worx." },
        { status: 403 },
      ),
    };
  }

  return auth;
}
