import { NextResponse } from "next/server";

import { engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import { listEngineeringSopTasks } from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const tasks = await listEngineeringSopTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}
