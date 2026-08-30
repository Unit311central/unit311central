import { NextResponse } from "next/server";

import { isQaEnabledWorkspaceSlug, isTestWorkspaceSlug } from "@/lib/qa-workspace/surface";
import { getPlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace, type CurrentWorkspace } from "@/lib/workspace-context";
import type { PlatformSession } from "@/lib/platform-session";

const QA_FORBIDDEN = "QA features are only available on enabled QA workspaces.";

export async function requireQaWorkspaceAccess(): Promise<
  { error: NextResponse } | { workspace: CurrentWorkspace; session: PlatformSession }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isQaEnabledWorkspaceSlug(workspace.slug)) {
      return { error: NextResponse.json({ error: QA_FORBIDDEN }, { status: 403 }) };
    }
    return { workspace, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace context required.";
    return { error: NextResponse.json({ error: message }, { status: 401 }) };
  }
}

/** @deprecated Prefer requireQaWorkspaceAccess — kept for Test-only call sites. */
export async function requireTestWorkspaceAccess(): Promise<
  { error: NextResponse } | { workspace: CurrentWorkspace; session: PlatformSession }
> {
  const auth = await requireQaWorkspaceAccess();
  if ("error" in auth) return auth;
  if (!isTestWorkspaceSlug(auth.workspace.slug)) {
    return {
      error: NextResponse.json(
        { error: "QA features are only available on the dedicated Test workspace." },
        { status: 403 },
      ),
    };
  }
  return auth;
}

export function assertTestWorkspaceSlug(slug: string | null | undefined): void {
  if (!isTestWorkspaceSlug(slug)) {
    throw new Error("QA features are only available on the dedicated Test workspace.");
  }
}

export function assertQaWorkspaceSlug(slug: string | null | undefined): void {
  if (!isQaEnabledWorkspaceSlug(slug)) {
    throw new Error(QA_FORBIDDEN);
  }
}
