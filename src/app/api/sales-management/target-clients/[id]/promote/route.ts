import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { assertTargetClientsApiHost } from "@/lib/target-clients";
import { promoteTargetClientToOpportunity } from "@/lib/target-clients-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function assertInternalCentralWorkspace(slug: string) {
  if (slug !== INTERNAL_WORKSPACE_SLUG) {
    throw new Error("Target Clients is only available on the internal Unit311Central workspace.");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    assertTargetClientsApiHost(getRequestHost(request));
    assertInternalCentralWorkspace(workspace.slug);

    const { id } = await context.params;
    const result = await promoteTargetClientToOpportunity(id, { workspaceId: workspace.id });

    return NextResponse.json({
      opportunityId: result.opportunityId,
      alreadyPromoted: result.alreadyPromoted,
      lead: {
        id: result.lead.id,
        companyName: result.lead.companyName,
        status: result.lead.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    let status = 500;
    if (message.includes("Authentication required") || message.includes("Workspace context")) {
      status = 401;
    } else if (message.includes("only available") || message.includes("not a Target Client")) {
      status = 403;
    } else if (message.includes("Lead not found")) {
      status = 404;
    }
    return NextResponse.json({ error: message }, { status });
  }
}
