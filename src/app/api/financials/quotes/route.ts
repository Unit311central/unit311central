import { NextRequest, NextResponse } from "next/server";

import { mapSalesQuoteApiBody, type SalesQuoteApiBody } from "@/lib/accounting/sales-quotes-api-body";
import { createSalesQuote, listSalesQuotes } from "@/lib/accounting/sales-quotes-core";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      return NextResponse.json({ quotes: await listSalesQuotes({ workspaceSlug: "demo" }) });
    }
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const quotes = await listSalesQuotes({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load quotes.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const body = (await request.json()) as SalesQuoteApiBody;

    if (!body.companyName?.trim()) {
      return NextResponse.json({ error: "companyName is required." }, { status: 400 });
    }
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }
    if (!body.lineItems?.length) {
      return NextResponse.json({ error: "At least one line item is required." }, { status: 400 });
    }

    const scope = (await isDemoApiRequest())
      ? { workspaceSlug: "demo" as const }
      : {
          ...(await (async () => {
            await requirePlatformSession();
            const workspace = await requireCurrentWorkspace();
            return { workspaceId: workspace.id, workspaceSlug: workspace.slug };
          })()),
        };

    const mapped = mapSalesQuoteApiBody(body);
    const quote = await createSalesQuote(scope, mapped);
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create quote.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
