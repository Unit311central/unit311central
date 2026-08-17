import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import { buildLoungeUrl, ensureAllWorkspaceLoungeTokens } from "@/lib/support-lounge-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

/** Ensure every client in the current workspace has a unique Support Lounge URL. */
export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    await ensureSupportLoungeSchema();

    const results = await withSupportLoungeSchema(() =>
      ensureAllWorkspaceLoungeTokens({ workspaceId: workspace.id }),
    );

    const origin = request.nextUrl.origin;
    return NextResponse.json({
      total: results.length,
      created: results.filter((row) => row.created).length,
      kept: results.filter((row) => !row.created).length,
      clients: results.map((row) => ({
        id: row.clientId,
        companyName: row.companyName,
        token: row.loungeToken,
        url: buildLoungeUrl(row.loungeToken, origin),
        created: row.created,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ensure lounge URLs";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
