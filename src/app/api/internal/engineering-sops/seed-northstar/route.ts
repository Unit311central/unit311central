import { NextResponse } from "next/server";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { seedNorthstarEngineeringSops } from "@/lib/engineering-sop/seed-northstar";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const db = createTenancyServerClient();
    const { data: workspace, error } = await db
      .from("workspaces")
      .select("id, slug")
      .eq("slug", DEMO_WORKSPACE_SLUG)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!workspace) {
      return NextResponse.json({ error: "Demo workspace not found." }, { status: 404 });
    }
    const result = await seedNorthstarEngineeringSops(workspace.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed Northstar engineering SOPs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
