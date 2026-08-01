import { NextRequest, NextResponse } from "next/server";

import {
  deleteBoardDirector,
  updateBoardDirector,
} from "@/lib/board-directors-service";
import { getPlatformSession } from "@/lib/platform-session";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      fullName?: string;
      roleTitle?: string;
      organisation?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string;
    };
    const director = await updateBoardDirector(workspace.id, id, body);
    return NextResponse.json({ director });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to update board director.";
    const status = message === "Director not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    await deleteBoardDirector(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to delete board director.";
    const status = message === "Director not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
