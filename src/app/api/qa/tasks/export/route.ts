import { NextRequest, NextResponse } from "next/server";

import { requireTestWorkspaceAccess } from "@/lib/qa-workspace/auth";
import { qaTasksToCsv } from "@/lib/qa-workspace/csv";
import type { QaTaskStatus } from "@/lib/qa-workspace/constants";
import { listQaWorkspaceTasks } from "@/lib/qa-workspace/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireTestWorkspaceAccess();
  if ("error" in auth) return auth.error;

  const params = request.nextUrl.searchParams;
  const status = (params.get("status") ?? "all") as QaTaskStatus | "all";
  const moduleLabel = params.get("module") ?? undefined;
  const pageLabel = params.get("page") ?? undefined;
  const elementType = params.get("elementType") ?? undefined;

  try {
    const tasks = await listQaWorkspaceTasks(auth.workspace.id, {
      status,
      moduleLabel,
      pageLabel,
      elementType,
    });
    const csv = qaTasksToCsv(tasks, auth.workspace.slug);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qa-tasks-${stamp}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export QA tasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
