import { NextResponse } from "next/server";

import { isTestWorkspaceSlug } from "@/lib/qa-workspace/surface";
import { getPlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace, type CurrentWorkspace } from "@/lib/workspace-context";
import type { PlatformSession } from "@/lib/platform-session";

const QA_FORBIDDEN = "QA features are only available on the dedicated Test workspace.";

export async function requireTestWorkspaceAccess(): Promise<
  { error: NextResponse } | { workspace: CurrentWorkspace; session: PlatformSession }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isTestWorkspaceSlug(workspace.slug)) {
      return { error: NextResponse.json({ error: QA_FORBIDDEN }, { status: 403 }) };
    }
    return { workspace, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace context required.";
    return { error: NextResponse.json({ error: message }, { status: 401 }) };
  }
}

export function assertTestWorkspaceSlug(slug: string | null | undefined): void {
  if (!isTestWorkspaceSlug(slug)) {
    throw new Error(QA_FORBIDDEN);
  }
}
