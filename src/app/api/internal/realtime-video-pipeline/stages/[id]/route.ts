import { NextRequest, NextResponse } from "next/server";

import {
  pipelineErrorResponse,
  requireRealtimeVideoPipelineSession,
} from "@/lib/realtime-video-pipeline/api-helpers";
import { deleteStage, getScenarioWithStages, updateStage } from "@/lib/realtime-video-pipeline/service";
import type { UpdateStageInput } from "@/lib/realtime-video-pipeline/types";
import { isSupabaseServiceRoleConfigured, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function parseStagePatch(body: Record<string, unknown>): UpdateStageInput {
  const patch: UpdateStageInput = {};
  if (body.enabled != null) patch.enabled = Boolean(body.enabled);
  if (body.pipelineSection != null) patch.pipelineSection = body.pipelineSection as UpdateStageInput["pipelineSection"];
  if (body.component != null) patch.component = String(body.component);
  if (body.whatHappens != null) patch.whatHappens = String(body.whatHappens);
  if (body.detailedDescription != null) patch.detailedDescription = String(body.detailedDescription);
  if ("processingMs" in body) patch.processingMs = body.processingMs != null ? Number(body.processingMs) : null;
  if ("transmissionMs" in body) patch.transmissionMs = body.transmissionMs != null ? Number(body.transmissionMs) : null;
  if ("bufferMs" in body) patch.bufferMs = body.bufferMs != null ? Number(body.bufferMs) : null;
  if ("queueMs" in body) patch.queueMs = body.queueMs != null ? Number(body.queueMs) : null;
  if ("aiInferenceMs" in body) patch.aiInferenceMs = body.aiInferenceMs != null ? Number(body.aiInferenceMs) : null;
  if ("processingMinMs" in body) patch.processingMinMs = body.processingMinMs != null ? Number(body.processingMinMs) : null;
  if ("processingTypicalMs" in body)
    patch.processingTypicalMs = body.processingTypicalMs != null ? Number(body.processingTypicalMs) : null;
  if ("processingMaxMs" in body) patch.processingMaxMs = body.processingMaxMs != null ? Number(body.processingMaxMs) : null;
  if (body.measurementStatus != null) patch.measurementStatus = body.measurementStatus as UpdateStageInput["measurementStatus"];
  if (body.source != null) patch.source = String(body.source);
  if ("sourceUrl" in body) patch.sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl : null;
  if (body.sourceType != null) patch.sourceType = body.sourceType as UpdateStageInput["sourceType"];
  if (body.confidence != null) patch.confidence = body.confidence as UpdateStageInput["confidence"];
  if (body.parallel != null) patch.parallel = Boolean(body.parallel);
  if ("branchGroup" in body) patch.branchGroup = typeof body.branchGroup === "string" ? body.branchGroup : null;
  if ("pathKind" in body) patch.pathKind = body.pathKind as UpdateStageInput["pathKind"];
  if ("milestone" in body) patch.milestone = body.milestone as UpdateStageInput["milestone"];
  if (body.details != null && typeof body.details === "object") patch.details = body.details as UpdateStageInput["details"];
  return patch;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const updated = await updateStage(id, parseStagePatch(body));
    const scenario = await getScenarioWithStages(updated.scenarioId);
    return NextResponse.json({ scenario });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to update stage.");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    const supabase = createSupabaseServiceRoleClient();
    const { data: row } = await supabase
      .from("realtime_video_pipeline_stages")
      .select("scenario_id")
      .eq("id", id)
      .maybeSingle();
    if (!row?.scenario_id) throw new Error("Stage not found.");
    await deleteStage(id);
    const scenario = await getScenarioWithStages(row.scenario_id as string);
    return NextResponse.json({ scenario });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to delete stage.");
  }
}
