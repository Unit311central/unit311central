import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  deleteGovernanceRisk,
  listGovernanceRisks,
  requireTalantonGovernanceWorkspace,
  upsertGovernanceRisk,
} from "@/lib/talanton/workspace-governance-service";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";
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
    const existing = (await listGovernanceRisks(workspace.id)).find((r) => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Risk not found." }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<TiRiskRegisterEntry> & { description?: string };
    const saved = await upsertGovernanceRisk(workspace.id, {
      ...existing,
      ...patch,
      id: existing.id,
      description: patch.description?.trim() || existing.description,
    });
    return NextResponse.json({ risk: saved });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to update risk.";
    console.error("[governance/risks PATCH]", message);
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
    await deleteGovernanceRisk(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to delete risk.";
    console.error("[governance/risks DELETE]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
