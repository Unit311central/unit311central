import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  ensureGovernanceRisks,
  requireTalantonGovernanceWorkspace,
  upsertGovernanceRisk,
} from "@/lib/talanton/workspace-governance-service";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";
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
    const risks = await ensureGovernanceRisks({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ risks });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load risks.";
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
    const body = (await request.json()) as Partial<TiRiskRegisterEntry> & { description: string };
    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }
    const saved = await upsertGovernanceRisk(workspace.id, body);
    return NextResponse.json({ risk: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to save risk.";
    console.error("[governance/risks POST]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
