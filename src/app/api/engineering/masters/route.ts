import { NextRequest, NextResponse } from "next/server";

import {
  requireEngineeringTechnicalFilesApiContext,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import {
  createEngineeringMaster,
  listEngineeringMasters,
} from "@/lib/engineering-technical-files/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const { workspace } = await requireEngineeringTechnicalFilesApiContext();
    const masters = await listEngineeringMasters({ workspaceId: workspace.id });
    return NextResponse.json({ masters });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to load engineering masters.");
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const { workspace, actor } = await requireEngineeringTechnicalFilesApiContext();
    const body = (await request.json()) as Record<string, unknown>;
    const master = await createEngineeringMaster(
      {
        title: String(body.title ?? ""),
        description: typeof body.description === "string" ? body.description : undefined,
        programRef: typeof body.programRef === "string" ? body.programRef : undefined,
        productRef: typeof body.productRef === "string" ? body.productRef : undefined,
      },
      actor,
      { workspaceId: workspace.id },
    );
    return NextResponse.json({ master }, { status: 201 });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to create engineering master.");
  }
}
