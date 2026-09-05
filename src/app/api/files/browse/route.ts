import { NextRequest, NextResponse } from "next/server";

import { browseClientFiles } from "@/lib/client-files-root";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import {
  browseNorthstarClientFiles,
  browseNorthstarInternalFiles,
} from "@/lib/demo/northstar-files-fixtures";
import { filesApiErrorStatus, requireInternalFilesAccess } from "@/lib/files-api-auth";
import { browseFolder } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ensureGreenDesertFilesSeeded } from "@/lib/greendesert/files-seed";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { ensureTalantonFilesSeeded } from "@/lib/talanton/files-seed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get("folderId");
  const query = request.nextUrl.searchParams.get("q") ?? undefined;
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() || null;

  if (await isDemoApiRequest()) {
    if (clientId) {
      return NextResponse.json(
        browseNorthstarClientFiles({
          clientId,
          folderId: folderId || null,
          query,
        }),
      );
    }

    return NextResponse.json(
      browseNorthstarInternalFiles({
        folderId: folderId || null,
        query,
      }),
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY." },
      { status: 503 },
    );
  }

  const auth = await requireInternalFilesAccess();
  if ("error" in auth) return auth.error;

  try {
    if (isTalantonImpactSlug(auth.workspace.slug)) {
      await ensureTalantonFilesSeeded(auth.workspace.id).catch(() => undefined);
    }
    if (isGreenDesertSlug(auth.workspace.slug)) {
      await ensureGreenDesertFilesSeeded(auth.workspace.id).catch(() => undefined);
    }

    if (clientId) {
      const result = await browseClientFiles({
        clientId,
        folderId: folderId || null,
        query,
        categoryId: categoryId || null,
        workspaceId: auth.workspace.id,
      });
      return NextResponse.json(result);
    }

    const result = await browseFolder(
      {
        folderId: folderId || null,
        query,
        categoryId: categoryId || null,
      },
      { workspaceId: auth.workspace.id },
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to browse files";
    return NextResponse.json(
      { error: message },
      { status: filesApiErrorStatus(message, error) },
    );
  }
}
