import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import type { TiBoardMember } from "@/lib/talanton/board-portal-data";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";
import {
  migrateLocalGovernanceData,
  requireTalantonGovernanceWorkspace,
} from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type Body = {
  importKey: string;
  meetings?: GovernanceMeeting[];
  risks?: TiRiskRegisterEntry[];
  members?: TiBoardMember[];
};

export async function POST(request: NextRequest) {
  const demoBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoBlock) return demoBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const body = (await request.json()) as Body;
    if (!body.importKey?.trim()) {
      return NextResponse.json({ error: "importKey is required." }, { status: 400 });
    }
    const result = await migrateLocalGovernanceData(workspace.id, {
      importKey: body.importKey.trim(),
      meetings: body.meetings,
      risks: body.risks,
      members: body.members,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Migration failed.";
    console.error("[governance/migrate-local]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
