import { NextRequest, NextResponse } from "next/server";

import {
  pipelineErrorResponse,
  requireRealtimeVideoPipelineSession,
} from "@/lib/realtime-video-pipeline/api-helpers";
import {
  duplicateScenarioVersion,
  getWorkbenchModelForScenario,
  updateWorkbenchConfig,
} from "@/lib/realtime-video-pipeline/service";
import type { WorkbenchConfig } from "@/lib/realtime-video-pipeline/workbench-types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRealtimeVideoPipelineSession(_request);
    const { id } = await context.params;
    const model = await getWorkbenchModelForScenario(id);
    return NextResponse.json({ model });
  } catch (error) {
    return pipelineErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    const body = (await request.json()) as { workbenchConfig: WorkbenchConfig };
    if (!body.workbenchConfig) {
      return NextResponse.json({ error: "workbenchConfig required." }, { status: 400 });
    }
    await updateWorkbenchConfig(id, body.workbenchConfig);
    const model = await getWorkbenchModelForScenario(id);
    return NextResponse.json({ model });
  } catch (error) {
    return pipelineErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRealtimeVideoPipelineSession(request);
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string; name?: string };
    if (body.action === "duplicate") {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: "name required for duplicate." }, { status: 400 });
      }
      const scenario = await duplicateScenarioVersion(id, body.name.trim());
      const model = await getWorkbenchModelForScenario(scenario.id);
      return NextResponse.json({ scenario, model });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return pipelineErrorResponse(error);
  }
}
