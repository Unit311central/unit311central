import { NextResponse } from "next/server";

import {
  requireEngineeringTechnicalFilesApiContext,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import { restoreTechnicalFileVersion } from "@/lib/engineering-technical-files/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; versionId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const { workspace, actor } = await requireEngineeringTechnicalFilesApiContext();
    const { id, versionId } = await context.params;
    const file = await restoreTechnicalFileVersion(id, versionId, actor, {
      workspaceId: workspace.id,
    });
    return NextResponse.json({ file });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to restore version.");
  }
}
