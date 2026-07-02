import { NextRequest, NextResponse } from "next/server";

import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import { ensureWhiteboardProjectsTable, withWhiteboardProjectsTable } from "@/lib/internal-db-migrations";
import { normalizeWhiteboardScene, type WhiteboardScene } from "@/lib/whiteboard-data";
import {
  deleteWhiteboardProject,
  getWhiteboardProject,
  updateWhiteboardProject,
} from "@/lib/whiteboard-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureWhiteboardProjectsTable();
    const { id } = await context.params;
    const project = await withWhiteboardProjectsTable(() => getWhiteboardProject(id));
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load whiteboard project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureWhiteboardProjectsTable();
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      ownerName?: string;
      elements?: WhiteboardScene["elements"];
      appState?: Partial<AppState>;
      files?: BinaryFiles;
    };

    const patch: Partial<{ name: string; ownerName: string; scene: WhiteboardScene }> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.ownerName !== undefined) patch.ownerName = body.ownerName;
    if (
      body.elements !== undefined ||
      body.appState !== undefined ||
      body.files !== undefined
    ) {
      patch.scene = normalizeWhiteboardScene(
        body.elements ?? [],
        (body.appState ?? { theme: "dark" }) as AppState,
        body.files ?? {},
      );
    }

    const project = await withWhiteboardProjectsTable(() => updateWhiteboardProject(id, patch));
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save whiteboard project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureWhiteboardProjectsTable();
    const { id } = await context.params;
    await withWhiteboardProjectsTable(() => deleteWhiteboardProject(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete whiteboard project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
