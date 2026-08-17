import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalSoftwareBillingAccess } from "@/lib/software-billing/internal-api-auth";
import { buildSoftwareBillingSummary } from "@/lib/software-billing/software-cost-summary";
import { syncVercelSoftwareBilling } from "@/lib/software-billing/vercel-sync";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInternalSoftwareBillingAccess(request);
  if ("error" in auth) return auth.error;

  try {
    const result = await syncVercelSoftwareBilling(auth.workspaceId);
    const summary = await buildSoftwareBillingSummary(auth.workspaceId);
    return NextResponse.json({ result, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel billing sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
