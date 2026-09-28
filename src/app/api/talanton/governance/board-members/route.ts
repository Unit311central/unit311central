import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import type { TiBoardMember } from "@/lib/talanton/board-portal-data";
import {
  ensureBoardMembers,
  requireTalantonGovernanceWorkspace,
  upsertBoardMember,
} from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const members = await ensureBoardMembers({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load board members.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}

export async function POST(request: NextRequest) {
  const demoBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoBlock) return demoBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const body = (await request.json()) as Omit<TiBoardMember, "id" | "name"> & { id?: string };
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const role = body.role?.trim();
    const email = body.email?.trim();
    if (!firstName || !lastName || !role || !email) {
      return NextResponse.json({ error: "First name, last name, role, and email are required." }, { status: 400 });
    }
    const members = await ensureBoardMembers({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    const nums = members
      .map((m) => /^ti-bm-(\d+)$/.exec(m.id)?.[1])
      .filter(Boolean)
      .map((n) => Number(n));
    const nextNum = (nums.length ? Math.max(...nums) : members.length) + 1;
    const member: TiBoardMember = {
      id: body.id?.trim() || `ti-bm-${nextNum}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role,
      email,
      committees: body.committees ?? [],
    };
    const saved = await upsertBoardMember(workspace.id, member);
    return NextResponse.json({ member: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to add board member.";
    console.error("[governance/board-members POST]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
