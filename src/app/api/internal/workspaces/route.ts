import { NextRequest, NextResponse } from "next/server";

import { requireInternalWorkspacesAccess } from "@/lib/platform-workspaces/internal-workspaces-auth";
import {
  createWorkspaceAdminRecord,
  listWorkspaceAdminRecords,
} from "@/lib/platform-workspaces/workspace-admin-service";
import type { CreateWorkspaceInput } from "@/lib/platform-workspaces/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const params = request.nextUrl.searchParams;
  const workspaces = await listWorkspaceAdminRecords({
    query: params.get("q") ?? undefined,
    type: (params.get("type") as "Customer" | "Demo" | "Internal" | "all" | null) ?? "all",
    status:
      (params.get("status") as
        | "Active"
        | "Pending Payment"
        | "Onboarding"
        | "Archived"
        | "Preparing"
        | "all"
        | null) ?? "Active",
  });

  return NextResponse.json({ workspaces });
}

export async function POST(request: NextRequest) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  let body: CreateWorkspaceInput;
  try {
    body = (await request.json()) as CreateWorkspaceInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const workspace = await createWorkspaceAdminRecord(body, auth.actor);
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create workspace.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
