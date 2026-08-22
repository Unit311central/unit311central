import { NextRequest, NextResponse } from "next/server";

import { engineeringSopActor, engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import { completeEngineeringSopRunStep } from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ runId: string; stepId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { runId, stepId } = await context.params;
    const body = (await request.json()) as {
      outcome?: "pass" | "fail" | "na";
      notes?: string;
      evidenceRefs?: string[];
    };
    const run = await completeEngineeringSopRunStep(runId, stepId, {
      actor: engineeringSopActor(session),
      outcome: body.outcome ?? "pass",
      notes: body.notes,
      evidenceRefs: body.evidenceRefs,
    });
    return NextResponse.json({ run });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}
