import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import type { LeadStatus } from "@/lib/crm-data";
import { deleteLead, updateLead } from "@/lib/crm-leads-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      businessContext?: unknown;
      companyName?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      status?: LeadStatus;
      source?: string;
      nextAction?: string;
      nextActionDate?: string | null;
      estimatedValue?: number | null;
      winProbability?: number | null;
      ownerUserId?: string | null;
      notes?: string;
      discoveryNotes?: string;
    };

    const lead = await updateLead(
      id,
      body,
      salesRecordScope(workspace, readRequestedSalesBusinessContext(request, body)),
    );
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Lead not found")
        ? 404
        : message.includes("Authentication required") || message.includes("Workspace context")
          ? 401
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    await deleteLead(id, salesRecordScope(workspace, readRequestedSalesBusinessContext(request)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete lead";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Lead not found")
        ? 404
        : message.includes("Authentication required") || message.includes("Workspace context")
          ? 401
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
