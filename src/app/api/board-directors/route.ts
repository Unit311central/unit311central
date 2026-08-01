import { NextResponse } from "next/server";

import { listBoardDirectorsForWorkspace } from "@/lib/board-directors-service";
import { getPlatformSession } from "@/lib/platform-session";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const directors = await listBoardDirectorsForWorkspace(workspace.id);
    return NextResponse.json({ directors });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load board directors.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
