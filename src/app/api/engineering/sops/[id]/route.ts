import { NextRequest, NextResponse } from "next/server";

import {
  deleteEngineeringSop,
  getEngineeringSopById,
  updateEngineeringSop,
} from "@/lib/engineering-sop/service";
import { engineeringSopActor, engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const { id } = await context.params;
    const sop = await getEngineeringSopById(id);
    if (!sop) return NextResponse.json({ error: "SOP not found." }, { status: 404 });
    return NextResponse.json({ sop });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const sop = await updateEngineeringSop(
      id,
      {
        title: typeof body.title === "string" ? body.title : undefined,
        owner: typeof body.owner === "string" ? body.owner : undefined,
        approver: typeof body.approver === "string" ? body.approver : undefined,
        reviewDate: typeof body.reviewDate === "string" ? body.reviewDate : undefined,
        summary: typeof body.summary === "string" ? body.summary : undefined,
        sections: Array.isArray(body.sections) ? body.sections : undefined,
      },
      engineeringSopActor(session),
    );
    return NextResponse.json({ sop });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    await deleteEngineeringSop(id, engineeringSopActor(session));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}
