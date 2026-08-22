import { NextResponse } from "next/server";

import { getEngineeringSopDashboard } from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const dashboard = await getEngineeringSopDashboard();
    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load SOP dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
