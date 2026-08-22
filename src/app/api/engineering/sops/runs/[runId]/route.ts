import { NextRequest, NextResponse } from "next/server";

import { engineeringSopActor, engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import {
  completeEngineeringSopRun,
  getEngineeringSopRunById,
  pauseEngineeringSopRun,
  resumeEngineeringSopRun,
} from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ runId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const { runId } = await context.params;
    const run = await getEngineeringSopRunById(runId);
    if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });
    return NextResponse.json({ run });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { runId } = await context.params;
    const body = (await request.json()) as { action?: string };
    const actor = engineeringSopActor(session);
    switch (body.action) {
      case "pause":
        return NextResponse.json({ run: await pauseEngineeringSopRun(runId, actor) });
      case "resume":
        return NextResponse.json({ run: await resumeEngineeringSopRun(runId, actor) });
      case "complete":
        return NextResponse.json({ run: await completeEngineeringSopRun(runId, actor) });
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}
