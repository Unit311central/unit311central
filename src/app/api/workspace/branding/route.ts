import { NextResponse } from "next/server";

import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { getCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

/**
 * Branding for customer hosts only.
 * Internal / demo are out of scope — callers should not rely on this for those surfaces.
 */
export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace) {
    return NextResponse.json({ logoUrl: null, slug: null, name: null });
  }

  const slug = workspace.slug.trim().toLowerCase();
  if (slug === "unit311" || slug === "demo" || slug === "internal") {
    return NextResponse.json({
      slug,
      name: workspace.name,
      logoUrl: null,
    });
  }

  let logoUrl: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = createTenancyServerClient();
    const { data } = await supabase
      .from("workspace_settings")
      .select("logo_url")
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    logoUrl = data?.logo_url ? String(data.logo_url) : null;
  }

  return NextResponse.json({
    slug: workspace.slug,
    name: workspace.name,
    logoUrl,
  });
}
