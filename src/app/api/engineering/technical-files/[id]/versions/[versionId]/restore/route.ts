import { NextResponse } from "next/server";

import {
  technicalFileActor,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import { restoreTechnicalFileVersion } from "@/lib/engineering-technical-files/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; versionId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id, versionId } = await context.params;
    const file = await restoreTechnicalFileVersion(id, versionId, technicalFileActor(session));
    return NextResponse.json({ file });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to restore version.");
  }
}
