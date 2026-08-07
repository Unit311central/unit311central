import { NextRequest, NextResponse } from "next/server";

import { filesApiErrorStatus, requireInternalFilesAccess } from "@/lib/files-api-auth";
import { browseExternalFilesFromDb } from "@/lib/external-files-service";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { ensureTalantonFilesSeeded } from "@/lib/talanton/files-seed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireInternalFilesAccess();
  if ("error" in auth) return auth.error;

  try {
    if (isTalantonImpactSlug(auth.workspace.slug)) {
      await ensureTalantonFilesSeeded(auth.workspace.id).catch(() => undefined);
    }

    const folderId = request.nextUrl.searchParams.get("folderId");
    const query = request.nextUrl.searchParams.get("q") ?? undefined;
    const result = await browseExternalFilesFromDb(
      {
        folderId: folderId || null,
        query,
      },
      { workspaceId: auth.workspace.id },
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to browse external files";
    return NextResponse.json(
      { error: message, entries: [], breadcrumb: [] },
      { status: filesApiErrorStatus(message, error) },
    );
  }
}
