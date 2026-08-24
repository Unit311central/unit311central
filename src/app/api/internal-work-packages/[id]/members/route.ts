import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import { getWorkPackageById, setWorkPackageMembers } from "@/lib/internal-work-packages/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireWorkPackageSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const members = Array.isArray(body.members)
      ? body.members.map((row) => {
          const member = row as Record<string, unknown>;
          return {
            userId: typeof member.userId === "string" ? member.userId : null,
            displayName: String(member.displayName ?? ""),
          };
        })
      : [];
    const workPackage = await setWorkPackageMembers(id, members);
    return NextResponse.json({ workPackage });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to update team members.");
  }
}

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
    return NextResponse.json({ members: workPackage.members });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to load team members.");
  }
}
