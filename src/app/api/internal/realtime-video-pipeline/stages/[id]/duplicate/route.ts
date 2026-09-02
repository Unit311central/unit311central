import { NextRequest, NextResponse } from "next/server";

import {
  executeWithPipelineAuth,
  pipelineErrorResponse,
} from "@/lib/realtime-video-pipeline/api-helpers";
import { duplicateStage, getScenarioWithStages } from "@/lib/realtime-video-pipeline/service";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    return await executeWithPipelineAuth(request, async () => {
      const { id } = await context.params;
      const created = await duplicateStage(id);
      const scenario = await getScenarioWithStages(created.scenarioId);
      return NextResponse.json({ scenario });
    });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to duplicate stage.");
  }
}
