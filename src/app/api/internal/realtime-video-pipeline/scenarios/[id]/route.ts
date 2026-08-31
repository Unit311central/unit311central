import { NextRequest, NextResponse } from "next/server";

import {
  pipelineErrorResponse,
  requireRealtimeVideoPipelineSession,
} from "@/lib/realtime-video-pipeline/api-helpers";
import {
  deleteScenario,
  getScenarioWithStages,
  updateScenario,
} from "@/lib/realtime-video-pipeline/service";
import type { ScenarioConfig, SyncConfig } from "@/lib/realtime-video-pipeline/types";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    const scenario = await getScenarioWithStages(id);
    return NextResponse.json(scenario);
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to load scenario.");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    await updateScenario(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      config: typeof body.config === "object" ? (body.config as ScenarioConfig) : undefined,
      syncConfig: typeof body.syncConfig === "object" ? (body.syncConfig as SyncConfig) : undefined,
    });
    const scenario = await getScenarioWithStages(id);
    return NextResponse.json(scenario);
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to update scenario.");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    await deleteScenario(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to delete scenario.");
  }
}
