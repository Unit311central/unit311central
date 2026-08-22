import { NextRequest, NextResponse } from "next/server";

import { createSignedLoginAssetUrl } from "@/lib/platform-workspaces/workspace-login-page-service";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  const kind = request.nextUrl.searchParams.get("kind")?.trim().toLowerCase();

  if (!workspaceId || (kind !== "logo" && kind !== "background")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspace_admin_metadata")
    .select("login_logo_storage_path, login_background_storage_path")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const storagePath =
    kind === "logo"
      ? data.login_logo_storage_path
        ? String(data.login_logo_storage_path)
        : null
      : data.login_background_storage_path
        ? String(data.login_background_storage_path)
        : null;

  if (!storagePath) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const signedUrl = await createSignedLoginAssetUrl(storagePath);
  if (!signedUrl) {
    return NextResponse.json({ error: "Asset unavailable." }, { status: 503 });
  }

  return NextResponse.redirect(signedUrl, { status: 302 });
}
