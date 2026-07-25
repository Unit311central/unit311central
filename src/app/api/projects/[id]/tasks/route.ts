import { NextRequest, NextResponse } from "next/server";

import {
  createProjectTask,
  listProjectTasks,
} from "@/lib/internal-project-tasks-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const result = await listProjectTasks(id, { workspaceId: workspace.id });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tasks";
    const status = message.includes("not found")
      ? 404
      : message.includes("Authentication") || message.includes("Workspace")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      startDate?: string;
      dueDate?: string;
      progress?: number;
      resource?: string;
      milestone?: boolean;
      critical?: boolean;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const result = await createProjectTask(
      id,
      {
        name: body.name,
        startDate: body.startDate,
        dueDate: body.dueDate,
        progress: body.progress,
        resource: body.resource,
        milestone: body.milestone,
        critical: body.critical,
      },
      { workspaceId: workspace.id },
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    const status = message.includes("not found")
      ? 404
      : message.includes("Authentication") || message.includes("Workspace")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
