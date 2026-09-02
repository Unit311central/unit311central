import { NextRequest, NextResponse } from "next/server";

import {
  executeWithPipelineAuth,
  pipelineErrorResponse,
} from "@/lib/realtime-video-pipeline/api-helpers";
import { createScenario, listScenarios } from "@/lib/realtime-video-pipeline/service";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    return await executeWithPipelineAuth(request, async () => {
      const scenarios = await listScenarios();
      return NextResponse.json({ scenarios });
    });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to load scenarios.");
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    return await executeWithPipelineAuth(request, async () => {
      const body = (await request.json()) as Record<string, unknown>;
      const scenario = await createScenario({
        name: String(body.name ?? "New scenario"),
        description: typeof body.description === "string" ? body.description : undefined,
        config: typeof body.config === "object" && body.config ? (body.config as never) : undefined,
      });
      return NextResponse.json({ scenario }, { status: 201 });
    });
  } catch (error) {
    return pipelineErrorResponse(error, "Failed to create scenario.");
  }
}
