import { NextResponse } from "next/server";

import { ensureWhiteboardProjectsTable, withWhiteboardProjectsTable } from "@/lib/internal-db-migrations";
import { listWhiteboardProjects } from "@/lib/whiteboard-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureWhiteboardProjectsTable();
    const projects = await withWhiteboardProjectsTable(() => listWhiteboardProjects());
    const project = projects[0] ?? null;
    if (!project) {
      return NextResponse.json({ scene: { elements: [], appState: { theme: "dark" }, files: {} } });
    }

    const full = await withWhiteboardProjectsTable(async () => {
      const { getWhiteboardProject } = await import("@/lib/whiteboard-service");
      return getWhiteboardProject(project.id);
    });

    return NextResponse.json({ scene: full?.scene ?? { elements: [], appState: { theme: "dark" }, files: {} } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load whiteboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: "Use /api/whiteboard/projects instead." },
    { status: 410 },
  );
}
