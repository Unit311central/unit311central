import { NextResponse } from "next/server";

import { listPartners } from "@/lib/partners/service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarPartners } from "@/lib/demo/module-fixtures";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ partners: getNorthstarPartners() });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const partners = await listPartners(workspace.id);
    return NextResponse.json({ partners });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list partners";
    const status =
      message.includes("Authentication") || message.includes("Workspace") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
