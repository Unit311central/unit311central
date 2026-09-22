import { NextResponse } from "next/server";

import { requireUsersModuleAdministratorSession } from "@/lib/internal-admin-auth";
import { loadWorkspaceDocumentLogoBytesForPreview } from "@/lib/workspace-document-logo-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  try {
    const payload = await loadWorkspaceDocumentLogoBytesForPreview({
      workspaceId: auth.workspace.id,
      workspaceSlug: auth.workspace.slug,
    });
    if (!payload) {
      return NextResponse.json({ error: "No workspace document logo configured." }, { status: 404 });
    }
    return new NextResponse(Buffer.from(payload.bytes), {
      headers: {
        "Content-Type": payload.contentType,
        "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workspace document logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
