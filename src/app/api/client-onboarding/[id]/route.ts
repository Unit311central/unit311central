import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { deleteClientOnboardingRecord } from "@/lib/client-onboarding-service";
import type { ClientOnboardingRecord } from "@/lib/client-onboarding-data";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { updateNorthstarOnboardingDemo } from "@/lib/demo/northstar-demo-store";
import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { ensureClientOnboardingRecordsTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const { id } = await context.params;
  const body = (await request.json()) as Partial<
    Pick<ClientOnboardingRecord, "currentStatus" | "currentStage" | "progressPercent">
  >;

  if (await isDemoApiRequest()) {
    try {
      const record = updateNorthstarOnboardingDemo(id, body);
      return NextResponse.json({ record });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update onboarding record";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  return NextResponse.json({ error: "Onboarding updates require Supabase." }, { status: 503 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (await isDemoApiRequest()) {
    return NextResponse.json({ ok: true });
  }

  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await ensureClientOnboardingRecordsTable().catch(() => false);
    await deleteClientOnboardingRecord(id, auth.workspace.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete onboarding record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
