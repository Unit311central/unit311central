import { NextRequest, NextResponse } from "next/server";

import { requireInternalWorkspacesAccess } from "@/lib/platform-workspaces/internal-workspaces-auth";
import { isWorkspaceSlugAvailable, normalizeSlug } from "@/lib/platform-workspaces/workspace-admin-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const slug = normalizeSlug(request.nextUrl.searchParams.get("slug") ?? "");
  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug is required." }, { status: 400 });
  }

  const available = await isWorkspaceSlugAvailable(slug);
  return NextResponse.json({ slug, available });
}
