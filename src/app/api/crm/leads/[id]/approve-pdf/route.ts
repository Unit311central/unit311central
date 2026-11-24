import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { generateAndSendCrmClientReportPdf } from "@/lib/crm-client-report-service";
import { getLeadById } from "@/lib/crm-leads-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request));

    const existingLead = await getLeadById(id, scope);
    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    // generateAndSendCrmClientReportPdf resolves workspace via session context
    const result = await generateAndSendCrmClientReportPdf(id, scope);
    const lead = await getLeadById(id, scope);

    return NextResponse.json({ ...result, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve client report";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
