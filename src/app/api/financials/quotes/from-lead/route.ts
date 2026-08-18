import { NextRequest, NextResponse } from "next/server";

import { createSalesQuoteFromLead } from "@/lib/accounting/sales-quotes-service";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const body = (await request.json()) as {
      leadId?: string;
      title?: string;
      currency?: string;
    };

    if (!body.leadId?.trim()) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }

    const scope = (await isDemoApiRequest())
      ? { workspaceSlug: "demo" as const }
      : await (async () => {
          await requirePlatformSession();
          const workspace = await requireCurrentWorkspace();
          return { workspaceId: workspace.id, workspaceSlug: workspace.slug };
        })();

    const quote = await createSalesQuoteFromLead(scope, {
      leadId: body.leadId.trim(),
      title: body.title,
      currency: body.currency,
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create quote from lead.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
