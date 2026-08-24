import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import {
  deleteWorkPackage,
  getWorkPackageById,
  updateWorkPackage,
} from "@/lib/internal-work-packages/service";
import type { WorkPackagePriority, WorkPackageStatus } from "@/lib/internal-work-packages/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id } = await context.params;
    const workPackage = await getWorkPackageById(id);
    if (!workPackage) {
      return NextResponse.json({ error: "Work package not found." }, { status: 404 });
    }
    return NextResponse.json({ workPackage });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to load work package.");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const workPackage = await updateWorkPackage(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      status: typeof body.status === "string" ? (body.status as WorkPackageStatus) : undefined,
      priority:
        typeof body.priority === "string" ? (body.priority as WorkPackagePriority) : undefined,
      ownerName: typeof body.ownerName === "string" ? body.ownerName : undefined,
      startDate: body.startDate === null ? null : typeof body.startDate === "string" ? body.startDate : undefined,
      expectedCompletionDate:
        body.expectedCompletionDate === null
          ? null
          : typeof body.expectedCompletionDate === "string"
            ? body.expectedCompletionDate
            : undefined,
      actualCompletionDate:
        body.actualCompletionDate === null
          ? null
          : typeof body.actualCompletionDate === "string"
            ? body.actualCompletionDate
            : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    return NextResponse.json({ workPackage });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to update work package.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id } = await context.params;
    await deleteWorkPackage(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to delete work package.");
  }
}
