import { NextRequest, NextResponse } from "next/server";

import {
  executeWithPipelineAuth,
  pipelineErrorResponse,
} from "@/lib/realtime-video-pipeline/api-helpers";
import { getScenarioWithStages, reorderStages } from "@/lib/realtime-video-pipeline/service";
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
      const body = (await request.json()) as { orderedStageIds?: string[] };
      if (!Array.isArray(body.orderedStageIds) || body.orderedStageIds.length === 0) {
        return NextResponse.json({ error: "orderedStageIds is required." }, { status: 400 });
      }
      await reorderStages(id, body.orderedStageIds);
      const scenario = await getScenarioWithStages(id);
      return NextResponse.json({ scenario });
    });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to reorder stages.");
  }
}
