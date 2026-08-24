import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import {
  createWorkPackageTask,
  getWorkPackageById,
} from "@/lib/internal-work-packages/service";
import type { WorkPackagePriority, WorkPackageTaskStatus } from "@/lib/internal-work-packages/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const task = await createWorkPackageTask(id, {
      category: typeof body.category === "string" ? body.category : undefined,
      description: String(body.description ?? ""),
      assignedToName: typeof body.assignedToName === "string" ? body.assignedToName : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : null,
      expectedCompletionDate:
        typeof body.expectedCompletionDate === "string" ? body.expectedCompletionDate : null,
      status: typeof body.status === "string" ? (body.status as WorkPackageTaskStatus) : undefined,
      priority:
        typeof body.priority === "string" ? (body.priority as WorkPackagePriority) : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    const workPackage = await getWorkPackageById(id);
    return NextResponse.json({ task, workPackage }, { status: 201 });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to create task.");
  }
}
