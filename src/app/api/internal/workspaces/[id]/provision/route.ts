import { NextRequest, NextResponse } from "next/server";

import { requireInternalWorkspacesAccess } from "@/lib/platform-workspaces/internal-workspaces-auth";
import { provisionWorkspaceAdminRecord } from "@/lib/platform-workspaces/workspace-admin-service";
import type { InitialWorkspaceAdministratorInput } from "@/lib/platform-workspaces/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  let initialAdministrator: InitialWorkspaceAdministratorInput | undefined;
  try {
    const body = (await request.json()) as {
      initialAdministrator?: InitialWorkspaceAdministratorInput;
    };
    initialAdministrator = body.initialAdministrator;
  } catch {
    // Retry without a body is allowed when administrator provisioning already completed.
  }

  try {
    const workspace = await provisionWorkspaceAdminRecord(id, { initialAdministrator });
    return NextResponse.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace provisioning failed.";
    const status = message.includes("already in progress") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
