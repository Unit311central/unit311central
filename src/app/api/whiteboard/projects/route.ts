import { NextRequest, NextResponse } from "next/server";

import { ensureWhiteboardProjectsTable, withWhiteboardProjectsTable } from "@/lib/internal-db-migrations";
import { getPlatformSession } from "@/lib/platform-session";
import { createWhiteboardProject, listWhiteboardProjects } from "@/lib/whiteboard-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureWhiteboardProjectsTable();
    const projects = await withWhiteboardProjectsTable(() => listWhiteboardProjects());
    const session = await getPlatformSession();
    return NextResponse.json({ projects, currentUser: session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load whiteboard projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    await ensureWhiteboardProjectsTable();
    const body = (await request.json()) as { name?: string };
    const project = await withWhiteboardProjectsTable(() =>
      createWhiteboardProject(session, { name: body.name }),
    );

    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create whiteboard project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
