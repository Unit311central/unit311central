import { NextResponse } from "next/server";

import { listPersistedSharkResults } from "@/lib/wolf/shark/shark-persistence.server";
import { listSharkJobs } from "@/lib/wolf/shark/shark-job-store.server";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireWolfCentralWorkspace();
    const persisted = await listPersistedSharkResults(30);
    const recentJobs = listSharkJobs(30);
    return NextResponse.json({ persisted, recentJobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
