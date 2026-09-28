import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import {
  deleteGovernanceMeeting,
  listGovernanceMeetings,
  requireTalantonGovernanceWorkspace,
  upsertGovernanceMeeting,
} from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoBlock) return demoBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const existing = (await listGovernanceMeetings(workspace.id)).find((m) => m.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<GovernanceMeeting>;
    const meeting: GovernanceMeeting = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    const saved = await upsertGovernanceMeeting(workspace.id, meeting);
    return NextResponse.json({ meeting: saved });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to update meeting.";
    console.error("[governance/meetings PATCH]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoBlock) return demoBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    await deleteGovernanceMeeting(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to delete meeting.";
    console.error("[governance/meetings DELETE]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
