import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { ensureCrmClientReportSchema } from "@/lib/crm-client-report-schema";
import { generateCrmClientReportPptxDraft } from "@/lib/crm-client-report-service";
import {
  getDiscoveryQuestionnaire,
  saveDiscoveryQuestionnaire,
} from "@/lib/crm-discovery-questions-service";
import type { DiscoveryQuestionnaireData } from "@/lib/discovery-questions-data";
import { getLeadById } from "@/lib/crm-leads-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
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

    const questionnaire = await getDiscoveryQuestionnaire(id, scope);
    if (!questionnaire) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    return NextResponse.json({ questionnaire });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load discovery questions";
    const status =
      message.includes("sales business context")
        ? 400
        : message.includes("Authentication required") || message.includes("Workspace context")
          ? 401
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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
      questionnaire?: DiscoveryQuestionnaireData;
      businessContext?: unknown;
    };
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request, body));

    if (!body.questionnaire) {
      return NextResponse.json({ error: "Missing questionnaire payload." }, { status: 400 });
    }

    const existingLead = await getLeadById(id, scope);
    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const questionnaire = await saveDiscoveryQuestionnaire(id, body.questionnaire, scope);
    await ensureCrmClientReportSchema().catch(() => false);

    let report = null;
    let reportWarning: string | null = null;
    try {
      // generateCrmClientReportPptxDraft resolves workspace via session context
      report = await generateCrmClientReportPptxDraft(id, scope);
    } catch (reportError) {
      reportWarning =
        reportError instanceof Error
          ? reportError.message
          : "Discovery questions saved, but PowerPoint generation failed.";
    }

    const lead = await getLeadById(id, scope);

    return NextResponse.json({ questionnaire, report, reportWarning, lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save discovery questions";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : message === "Lead not found."
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
