import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import { buildLoungeUrl, ensureClientLoungeToken } from "@/lib/support-lounge-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    await ensureSupportLoungeSchema();

    const lounge = await withSupportLoungeSchema(() =>
      ensureClientLoungeToken({
        clientId: id,
        workspaceId: workspace.id,
      }),
    );

    const origin = request.nextUrl.origin;
    return NextResponse.json({
      token: lounge.loungeToken,
      url: buildLoungeUrl(lounge.loungeToken, origin),
      companyName: lounge.companyName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create lounge link";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : message.includes("not found")
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
