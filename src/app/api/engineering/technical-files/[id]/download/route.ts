import { NextRequest, NextResponse } from "next/server";

import {
  technicalFileActor,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import { getTechnicalFileDownloadUrl } from "@/lib/engineering-technical-files/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const versionId = request.nextUrl.searchParams.get("versionId") ?? undefined;
    const result = await getTechnicalFileDownloadUrl(
      id,
      versionId,
      undefined,
      technicalFileActor(session),
    );
    return NextResponse.json(result);
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to create download URL.");
  }
}
