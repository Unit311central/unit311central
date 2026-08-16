import { NextResponse } from "next/server";

import type { ManagedClient } from "@/lib/client-management-data";
import { ClientFilesError } from "@/lib/client-files-root";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarClients } from "@/lib/demo/module-fixtures";
import { ensureNorthstarClientFilesRoot } from "@/lib/demo/northstar-files-fixtures";
import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * MOD-103 — ensure / repair Client Directory files root folder.
 */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (await isDemoApiRequest()) {
    const client = getNorthstarClients().find((row) => row.id === id);
    if (!client) {
      return NextResponse.json({ error: "Client not found in Client Directory." }, { status: 404 });
    }
    const enriched = ensureNorthstarClientFilesRoot(id, client as ManagedClient);
    return NextResponse.json({
      client: enriched,
      rootFolderId: enriched.filesFolderId,
      rootFolderName: enriched.filesFolderName,
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const { resolveClientFilesRoot } = await import("@/lib/client-files-root");
    const root = await resolveClientFilesRoot(id, auth.workspace.id);
    return NextResponse.json({
      client: root.client,
      rootFolderId: root.rootFolderId,
      rootFolderName: root.rootFolderName,
    });
  } catch (error) {
    if (error instanceof ClientFilesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to ensure client files root";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** GET returns current root context (ensures if missing). */
export async function GET(request: Request, context: RouteContext) {
  return POST(request, context);
}
