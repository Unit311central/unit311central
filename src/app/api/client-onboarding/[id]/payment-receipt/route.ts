import { NextResponse } from "next/server";

import { getClientOnboardingPaymentReceipt } from "@/lib/client-onboarding-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarOnboardingPaymentReceipt } from "@/lib/demo/northstar-api-fixtures";
import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { ensureClientOnboardingRecordsTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (await isDemoApiRequest()) {
    const receipt = getNorthstarOnboardingPaymentReceipt(id);
    if (!receipt) {
      return NextResponse.json({ error: "Payment receipt not found." }, { status: 404 });
    }
    return NextResponse.json({ receipt });
  }

  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureClientOnboardingRecordsTable().catch(() => false);

    const receipt = await getClientOnboardingPaymentReceipt(id, auth.workspace.id);

    if (!receipt) {
      return NextResponse.json({ error: "Payment receipt not found." }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payment receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
