import { NextRequest, NextResponse } from "next/server";

import {
  acceptSalesQuote,
  deleteSalesQuote,
  getSalesQuoteById,
  getSalesQuoteSellerProfile,
  markSalesQuoteSent,
  renderSalesQuotePdf,
  updateSalesQuote,
} from "@/lib/accounting/sales-quotes-service";
import {
  attachPaymentLinkToQuote,
  renderClientInvoicePdfForQuote,
  sendClientInvoiceForQuote,
} from "@/lib/accounting/client-invoice-service";
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
    const body = (await request.json()) as {
      crmLeadId?: string | null;
      clientId?: string | null;
      companyName?: string;
      contactName?: string | null;
      contactEmail?: string | null;
      title?: string;
      currency?: string;
      issueDate?: string | null;
      validUntil?: string | null;
      reference?: string | null;
      paymentTerms?: string | null;
      termsAndConditions?: string | null;
      notes?: string | null;
      discountAmount?: number;
      lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        unit?: string | null;
        discountAmount?: number;
        taxRate?: number | null;
      }>;
    };

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

    const quote = await updateSalesQuote(id, scope, {
      crmLeadId: body.crmLeadId ?? null,
      clientId: body.clientId ?? null,
      companyName: body.companyName.trim(),
      contactName: body.contactName ?? null,
      contactEmail: body.contactEmail ?? null,
      title: body.title,
      currency: body.currency,
      issueDate: body.issueDate ?? null,
      validUntil: body.validUntil ?? null,
      reference: body.reference ?? null,
      paymentTerms: body.paymentTerms ?? null,
      termsAndConditions: body.termsAndConditions ?? null,
      notes: body.notes ?? null,
      discountAmount: body.discountAmount ?? 0,
      lineItems: body.lineItems,
    });
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
      const pdf = renderSalesQuotePdf(quote, seller ?? undefined);
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
      const result = await sendClientInvoiceForQuote(id, scope, origin);
      return NextResponse.json(result);
    }

    if (action === "payment-link") {
      const origin = request.headers.get("origin") ?? request.nextUrl.origin;
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
