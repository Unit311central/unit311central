import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  buildTargetClientsExportCsv,
  targetClientsExportFilename,
} from "@/lib/target-clients-export";
import { assertTargetClientsApiHost, searchTargetClientRows } from "@/lib/target-clients";
import { listTargetClients } from "@/lib/target-clients-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function assertInternalCentralWorkspace(slug: string) {
  if (slug !== INTERNAL_WORKSPACE_SLUG) {
    throw new Error("Target Clients is only available on the internal Unit311Central workspace.");
  }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    assertTargetClientsApiHost(getRequestHost(request));
    assertInternalCentralWorkspace(workspace.slug);

    const search = request.nextUrl.searchParams.get("search") ?? "";
    const clients = await listTargetClients({ workspaceId: workspace.id });
    const filtered = searchTargetClientRows(clients, search);
    const csv = buildTargetClientsExportCsv(filtered);
    const filename = targetClientsExportFilename();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    let status = 500;
    if (message.includes("Authentication required") || message.includes("Session")) {
      status = 401;
    } else if (message.includes("only available on the internal")) {
      status = 403;
    }
    return NextResponse.json({ error: message }, { status });
  }
}
