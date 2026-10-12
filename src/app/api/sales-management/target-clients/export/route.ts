import { NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  requireTargetClientsApiContext,
  targetClientsErrorResponse,
} from "@/lib/target-clients-api-context";
import {
  buildTargetClientsExportCsv,
  targetClientsExportFilename,
} from "@/lib/target-clients-export";
import { searchTargetClientRows } from "@/lib/target-clients";
import { listTargetClients } from "@/lib/target-clients-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireTargetClientsApiContext(request);
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
    return targetClientsErrorResponse(error);
  }
}
