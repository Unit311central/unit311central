import { NextResponse } from "next/server";

import { ensureEngineeringSopStarterCatalogue } from "@/lib/engineering-sop/ensure-starter-catalogue";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

/** Idempotent workspace bootstrap for Engineering SOP starter catalogue. */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const result = await ensureEngineeringSopStarterCatalogue(workspace.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed engineering SOPs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
