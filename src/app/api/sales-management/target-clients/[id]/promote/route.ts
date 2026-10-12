import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  requireTargetClientsApiContext,
  targetClientsErrorResponse,
} from "@/lib/target-clients-api-context";
import { promoteTargetClientToOpportunity } from "@/lib/target-clients-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireTargetClientsApiContext(request);
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
    return targetClientsErrorResponse(error);
  }
}
