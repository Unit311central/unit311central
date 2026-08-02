import { NextRequest, NextResponse } from "next/server";

import { resolveClarityWorkspaceKey } from "@/lib/clarity";
import { getRequestHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import {
  hashUserId,
  insertPlatformUsageEvent,
} from "@/lib/platform-analytics/service";
import { resolveTaxonomyForView } from "@/lib/platform-analytics/taxonomy";
import { getCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

/**
 * Fire-and-forget usage ingest. Available on Internal + customer ops hosts.
 * Workspace is stamped server-side from the request host — never trusted from body.
 */
export async function POST(request: NextRequest) {
  try {
    const host = getRequestHost(request);
    const workspaceKey = resolveClarityWorkspaceKey(host);
    if (workspaceKey === "unknown") {
      return NextResponse.json({ ok: false, error: "Host not eligible." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      pageKey?: string;
      moduleKey?: string;
      source?: "nav" | "route" | "ea_action";
    };

    const pageKey = String(body.pageKey ?? "").trim();
    if (!pageKey) {
      return NextResponse.json({ ok: false, error: "pageKey is required." }, { status: 400 });
    }

    const taxonomy = resolveTaxonomyForView(pageKey);
    const session = await getPlatformSession();

    let workspaceId: string | null = session?.workspaceId ?? null;
    if (session) {
      try {
        const workspace = await getCurrentWorkspace();
        workspaceId = workspace?.id ?? workspaceId;
      } catch {
        // Host/session mismatch must not block telemetry.
      }
    }

    const userRole = session?.userType ?? "anonymous";

    const result = await insertPlatformUsageEvent({
      workspaceId,
      workspaceKey,
      userRole,
      userHash: hashUserId(session?.sub),
      event: {
        pageKey,
        moduleKey: body.moduleKey ?? taxonomy?.moduleKey ?? null,
        source: body.source ?? "nav",
      },
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record event.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
