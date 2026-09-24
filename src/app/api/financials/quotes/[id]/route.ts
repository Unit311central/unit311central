import { NextRequest, NextResponse } from "next/server";

import { mapSalesQuoteApiBody, type SalesQuoteApiBody } from "@/lib/accounting/sales-quotes-api-body";
import {
  acceptSalesQuote,
  deleteSalesQuote,
  getSalesQuoteById,
  markSalesQuoteSent,
  updateSalesQuote,
} from "@/lib/accounting/sales-quotes-core";
import { getSalesQuoteSellerProfile } from "@/lib/accounting/sales-quote-seller-profile";
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const { id } = await context.params;
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
    const quote = await updateSalesQuote(id, scope, mapped);
    return NextResponse.json({ quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update quote.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : message.includes("cannot be edited")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(_request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const { id } = await context.params;
    const scope = await resolveScope();
    const quote = await getSalesQuoteById(id, scope);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }
    if (quote.status === "accepted") {
      return NextResponse.json({ error: "Accepted quotes cannot be deleted." }, { status: 400 });
    }
    await deleteSalesQuote(id, scope);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete quote.";
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
      const seller =
        "workspaceId" in scope && scope.workspaceId
          ? await getSalesQuoteSellerProfile(scope.workspaceId)
          : null;
      const { renderSalesQuotePdf } = await import("@/lib/accounting/sales-quote-pdf-render");
      const pdf = await renderSalesQuotePdf(quote, seller ?? undefined, {
        workspaceSlug: "workspaceSlug" in scope ? scope.workspaceSlug : null,
      });
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
        },
      });
    }

    if (action === "invoice-pdf") {
      const quote = await getSalesQuoteById(id, scope);
      if (!quote) {
        return NextResponse.json({ error: "Quote not found." }, { status: 404 });
      }
      if (quote.status !== "accepted") {
        return NextResponse.json({ error: "Accept the quote before downloading the invoice." }, { status: 400 });
      }
      const { renderClientInvoicePdfForQuote } = await import("@/lib/accounting/client-invoice-service");
      const pdf = renderClientInvoicePdfForQuote(quote);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${quote.quoteNumber}-invoice.pdf"`,
        },
      });
    }

    if (action === "send-invoice") {
      const origin = request.headers.get("origin") ?? request.nextUrl.origin;
      const { sendClientInvoiceForQuote } = await import("@/lib/accounting/client-invoice-service");
      const result = await sendClientInvoiceForQuote(id, scope, origin);
      return NextResponse.json(result);
    }

    if (action === "payment-link") {
      const origin = request.headers.get("origin") ?? request.nextUrl.origin;
      const { attachPaymentLinkToQuote } = await import("@/lib/accounting/client-invoice-service");
      const quote = await attachPaymentLinkToQuote(id, scope, origin);
      return NextResponse.json({ quote });
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
