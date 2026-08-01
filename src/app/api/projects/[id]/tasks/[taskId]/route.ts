import { NextRequest, NextResponse } from "next/server";

import {
  deleteProjectTask,
  updateProjectTask,
} from "@/lib/internal-project-tasks-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id, taskId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      startDate?: string;
      dueDate?: string;
      progress?: number;
      resource?: string;
      milestone?: boolean;
      critical?: boolean;
    };

    const result = await updateProjectTask(id, taskId, body, {
      workspaceId: workspace.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    const status = message.includes("not found")
      ? 404
      : message.includes("Authentication") || message.includes("Workspace")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id, taskId } = await context.params;
    const result = await deleteProjectTask(id, taskId, { workspaceId: workspace.id });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    const status = message.includes("not found")
      ? 404
      : message.includes("Authentication") || message.includes("Workspace")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
