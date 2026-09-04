import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import { listWorkPackageQuestionAnswerLog } from "@/lib/internal-work-packages/service";
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
    const entries = await listWorkPackageQuestionAnswerLog(id);
    return NextResponse.json({ entries });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to load answer log.");
  }
}
