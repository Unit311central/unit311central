import { NextRequest, NextResponse } from "next/server";

import { requireInternalSoftwareBillingAccess } from "@/lib/software-billing/internal-api-auth";
import { listProviderInvoices } from "@/lib/software-billing/invoice-db";
import { buildAllProviderBillingContexts } from "@/lib/software-billing/provider-snapshot-summary";
import { buildSoftwareBillingSummary } from "@/lib/software-billing/software-cost-summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireInternalSoftwareBillingAccess(request);
  if ("error" in auth) return auth.error;

  try {
    const [summary, providerContexts, providerInvoices] = await Promise.all([
      buildSoftwareBillingSummary(auth.workspaceId),
      buildAllProviderBillingContexts(auth.workspaceId),
      listProviderInvoices(auth.workspaceId).catch(() => []),
    ]);
    return NextResponse.json({ summary, providerContexts, providerInvoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load software billing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
