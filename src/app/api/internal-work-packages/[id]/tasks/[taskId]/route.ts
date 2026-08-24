import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import {
  deleteWorkPackageTask,
  getWorkPackageById,
  updateWorkPackageTask,
} from "@/lib/internal-work-packages/service";
import type { WorkPackagePriority, WorkPackageTaskStatus } from "@/lib/internal-work-packages/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id, taskId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const task = await updateWorkPackageTask(id, taskId, {
      category: typeof body.category === "string" ? body.category : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      assignedToName: typeof body.assignedToName === "string" ? body.assignedToName : undefined,
      startDate: body.startDate === null ? null : typeof body.startDate === "string" ? body.startDate : undefined,
      expectedCompletionDate:
        body.expectedCompletionDate === null
          ? null
          : typeof body.expectedCompletionDate === "string"
            ? body.expectedCompletionDate
            : undefined,
      finished: typeof body.finished === "boolean" ? body.finished : undefined,
      status: typeof body.status === "string" ? (body.status as WorkPackageTaskStatus) : undefined,
      priority:
        typeof body.priority === "string" ? (body.priority as WorkPackagePriority) : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    const workPackage = await getWorkPackageById(id);
    return NextResponse.json({ task, workPackage });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to update task.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id, taskId } = await context.params;
    await deleteWorkPackageTask(id, taskId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to delete task.");
  }
}
