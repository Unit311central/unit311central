import { NextRequest, NextResponse } from "next/server";

import { createSalesQuote, listSalesQuotes } from "@/lib/accounting/sales-quotes-service";
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

    const quote = await createSalesQuote(scope, {
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
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create quote.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
