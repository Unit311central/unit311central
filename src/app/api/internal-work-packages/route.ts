import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageActor,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import { createWorkPackage, listWorkPackages } from "@/lib/internal-work-packages/service";
import type { WorkPackagePriority, WorkPackageStatus } from "@/lib/internal-work-packages/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const params = request.nextUrl.searchParams;
    const packages = await listWorkPackages(undefined, {
      search: params.get("search") ?? undefined,
      status: params.get("status") ?? undefined,
      owner: params.get("owner") ?? undefined,
      priority: params.get("priority") ?? undefined,
      teamMember: params.get("teamMember") ?? undefined,
    });
    return NextResponse.json({ packages });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to load work packages.");
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requireWorkPackageSession();
    const body = (await request.json()) as Record<string, unknown>;
    const workPackage = await createWorkPackage(
      {
        name: String(body.name ?? ""),
        description: typeof body.description === "string" ? body.description : undefined,
        status: typeof body.status === "string" ? (body.status as WorkPackageStatus) : undefined,
        priority:
          typeof body.priority === "string" ? (body.priority as WorkPackagePriority) : undefined,
        ownerName: typeof body.ownerName === "string" ? body.ownerName : undefined,
        startDate: typeof body.startDate === "string" ? body.startDate : null,
        expectedCompletionDate:
          typeof body.expectedCompletionDate === "string" ? body.expectedCompletionDate : null,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        memberUserIds: Array.isArray(body.members)
          ? body.members.map((row) => {
              const member = row as Record<string, unknown>;
              return {
                userId: typeof member.userId === "string" ? member.userId : null,
                displayName: String(member.displayName ?? ""),
              };
            })
          : undefined,
      },
      workPackageActor(session),
    );
    return NextResponse.json({ workPackage }, { status: 201 });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to create work package.");
  }
}
