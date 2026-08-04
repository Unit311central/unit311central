import { NextRequest, NextResponse } from "next/server";

import {
  createBoardDirector,
  ensureOnwardAirBoardDirectorsSeeded,
  listBoardDirectorsForWorkspace,
} from "@/lib/board-directors-service";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
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
    const directors =
      workspace.slug === ONWARDAIR_SLUG
        ? await ensureOnwardAirBoardDirectorsSeeded(workspace.id)
        : await listBoardDirectorsForWorkspace(workspace.id);
    return NextResponse.json({ directors });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load board directors.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      fullName?: string;
      roleTitle?: string;
      organisation?: string;
      email?: string | null;
      phone?: string | null;
      notes?: string;
    };
    if (!body.fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    const director = await createBoardDirector(workspace.id, {
      fullName: body.fullName,
      roleTitle: body.roleTitle,
      organisation: body.organisation,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
    });
    return NextResponse.json({ director }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to create board director.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
