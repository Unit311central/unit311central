import { NextRequest, NextResponse } from "next/server";

import {
  executeWithPipelineAuth,
  pipelineErrorResponse,
} from "@/lib/realtime-video-pipeline/api-helpers";
import { createStage, getScenarioWithStages } from "@/lib/realtime-video-pipeline/service";
import type { CreateStageInput, PipelineSection } from "@/lib/realtime-video-pipeline/types";
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
      const body = (await request.json()) as Record<string, unknown>;
      await createStage(id, {
        enabled: body.enabled !== false,
        pipelineSection: String(body.pipelineSection ?? "Drone") as PipelineSection,
        component: String(body.component ?? "New component"),
        whatHappens: String(body.whatHappens ?? ""),
        detailedDescription: String(body.detailedDescription ?? ""),
        processingMs: body.processingMs != null ? Number(body.processingMs) : null,
        transmissionMs: body.transmissionMs != null ? Number(body.transmissionMs) : null,
        bufferMs: body.bufferMs != null ? Number(body.bufferMs) : null,
        queueMs: body.queueMs != null ? Number(body.queueMs) : null,
        aiInferenceMs: body.aiInferenceMs != null ? Number(body.aiInferenceMs) : null,
        processingMinMs: body.processingMinMs != null ? Number(body.processingMinMs) : null,
        processingTypicalMs:
          body.processingTypicalMs != null ? Number(body.processingTypicalMs) : null,
        processingMaxMs: body.processingMaxMs != null ? Number(body.processingMaxMs) : null,
        measurementStatus: (body.measurementStatus as CreateStageInput["measurementStatus"]) ?? "TBD",
        source: String(body.source ?? ""),
        sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : null,
        sourceType: (body.sourceType as CreateStageInput["sourceType"]) ?? "",
        confidence: (body.confidence as CreateStageInput["confidence"]) ?? "Unknown",
        parallel: Boolean(body.parallel),
        branchGroup: typeof body.branchGroup === "string" ? body.branchGroup : null,
        pathKind: (body.pathKind as CreateStageInput["pathKind"]) ?? null,
        milestone: (body.milestone as CreateStageInput["milestone"]) ?? null,
        details: typeof body.details === "object" && body.details ? (body.details as never) : {},
        stageOrder: body.stageOrder != null ? Number(body.stageOrder) : undefined,
      });
      const scenario = await getScenarioWithStages(id);
      return NextResponse.json({ scenario }, { status: 201 });
    });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to create stage.");
  }
}
