import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalSoftwareBillingAccess } from "@/lib/software-billing/internal-api-auth";
import { buildAllProviderBillingContexts } from "@/lib/software-billing/provider-snapshot-summary";
import { buildSoftwareBillingSummary } from "@/lib/software-billing/software-cost-summary";
import { syncAllSoftwareBillingProviders } from "@/lib/software-billing/sync-all";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInternalSoftwareBillingAccess(request);
  if ("error" in auth) return auth.error;

  try {
    const results = await syncAllSoftwareBillingProviders(auth.workspaceId);
    const [summary, providerContexts] = await Promise.all([
      buildSoftwareBillingSummary(auth.workspaceId),
      buildAllProviderBillingContexts(auth.workspaceId),
    ]);
    return NextResponse.json({ results, summary, providerContexts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Software billing sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
