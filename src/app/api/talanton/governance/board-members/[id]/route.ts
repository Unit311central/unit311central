import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import type { TiBoardMember } from "@/lib/talanton/board-portal-data";
import {
  deleteBoardMember,
  listBoardMembers,
  requireTalantonGovernanceWorkspace,
  upsertBoardMember,
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
    const existing = (await listBoardMembers(workspace.id)).find((m) => m.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Board member not found." }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<Omit<TiBoardMember, "id">>;
    const firstName = (patch.firstName ?? existing.firstName).trim();
    const lastName = (patch.lastName ?? existing.lastName).trim();
    const member: TiBoardMember = {
      ...existing,
      ...patch,
      id: existing.id,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      committees: patch.committees ?? existing.committees,
    };
    const saved = await upsertBoardMember(workspace.id, member);
    return NextResponse.json({ member: saved });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to update board member.";
    console.error("[governance/board-members PATCH]", message);
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
    await deleteBoardMember(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to remove board member.";
    console.error("[governance/board-members DELETE]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
