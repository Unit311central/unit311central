import { NextRequest, NextResponse } from "next/server";

import { requireInternalWorkspacesAccess } from "@/lib/platform-workspaces/internal-workspaces-auth";
import {
  archiveWorkspaceAdminRecord,
  getWorkspaceAdminRecord,
  updateWorkspaceAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-service";
import type { UpdateWorkspaceInput } from "@/lib/platform-workspaces/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const workspace = await getWorkspaceAdminRecord(id);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }
  return NextResponse.json({ workspace });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  let body: UpdateWorkspaceInput;
  try {
    body = (await request.json()) as UpdateWorkspaceInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const workspace = await updateWorkspaceAdminRecord(id, body);
    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update workspace.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  try {
    const workspace = await archiveWorkspaceAdminRecord(id);
    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to archive workspace.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
