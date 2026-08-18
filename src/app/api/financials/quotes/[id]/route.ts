import { NextRequest, NextResponse } from "next/server";

import {
  acceptSalesQuote,
  getSalesQuoteById,
  markSalesQuoteSent,
  renderSalesQuotePdf,
} from "@/lib/accounting/sales-quotes-service";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

async function resolveScope() {
  if (await isDemoApiRequest()) {
    return { workspaceSlug: "demo" as const };
  }
  await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  return { workspaceId: workspace.id, workspaceSlug: workspace.slug };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const scope = await resolveScope();
    const quote = await getSalesQuoteById(id, scope);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }
    return NextResponse.json({ quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load quote.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const { id } = await context.params;
    const scope = await resolveScope();
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const action = body.action ?? "accept";

    if (action === "send") {
      const quote = await markSalesQuoteSent(id, scope);
      return NextResponse.json({ quote });
    }

    if (action === "pdf") {
      const quote = await getSalesQuoteById(id, scope);
      if (!quote) {
        return NextResponse.json({ error: "Quote not found." }, { status: 404 });
      }
      const pdf = renderSalesQuotePdf(quote);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
        },
      });
    }

    const result = await acceptSalesQuote(id, scope);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update quote.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
