import { NextRequest, NextResponse } from "next/server";

import { engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import { getEngineeringSopRunById, listEngineeringSopRuns } from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const activeOnly = request.nextUrl.searchParams.get("active") !== "false";
    const runs = await listEngineeringSopRuns(undefined, activeOnly);
    return NextResponse.json({ runs });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}
