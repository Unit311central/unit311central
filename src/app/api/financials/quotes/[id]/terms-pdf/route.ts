import { NextRequest, NextResponse } from "next/server";

import { getSalesQuoteById } from "@/lib/accounting/sales-quotes-core";
import {
  deleteSalesQuoteTermsPdf,
  uploadSalesQuoteTermsPdf,
} from "@/lib/accounting/sales-quote-terms-storage";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { requirePlatformSession } from "@/lib/platform-session";
import { applySalesBusinessContext, readRequestedSalesBusinessContext, resolveSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { resolveFinancialsWorkspaceId } from "@/lib/financials-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export const dynamic = "force-dynamic";

async function resolveScope(request: Request) {
  const requested = readRequestedSalesBusinessContext(request);
  if (await isDemoApiRequest()) {
    resolveSalesBusinessContext({ workspaceSlug: "demo", requested });
    return { workspaceSlug: "demo" as const, workspaceId: null as string | null };
  }
  await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  return salesRecordScope(workspace, requested);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const { id } = await context.params;
    const scope = await resolveScope(request);
    const quote = await getSalesQuoteById(id, scope);
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    if (!isSupabaseConfigured() || !scope.workspaceId) {
      return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadSalesQuoteTermsPdf({
      workspaceId: scope.workspaceId,
      quoteId: id,
      filename: file.name,
      bytes,
    });

    if (quote.termsPdfStoragePath && quote.termsPdfStoragePath !== uploaded.storagePath) {
      await deleteSalesQuoteTermsPdf(quote.termsPdfStoragePath);
    }

    const workspaceId = await resolveFinancialsWorkspaceId(scope);
    const supabase = createTenancyServerClient();
    const { error } = await applySalesBusinessContext(
      supabase
        .from("sales_quotes")
        .update({
          terms_pdf_storage_path: uploaded.storagePath,
          terms_pdf_filename: uploaded.filename,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId)
        .eq("id", id),
      "businessContext" in scope ? scope.businessContext : null,
    );
    if (error) throw new Error(error.message);

    const updated = await getSalesQuoteById(id, scope);
    return NextResponse.json({ quote: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to attach terms PDF.";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
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
    const scope = await resolveScope(_request);
    const quote = await getSalesQuoteById(id, scope);
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });

    await deleteSalesQuoteTermsPdf(quote.termsPdfStoragePath);
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
    }
    const workspaceId = await resolveFinancialsWorkspaceId(scope);
    const supabase = createTenancyServerClient();
    const { error } = await applySalesBusinessContext(
      supabase
        .from("sales_quotes")
        .update({
          terms_pdf_storage_path: null,
          terms_pdf_filename: null,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId)
        .eq("id", id),
      "businessContext" in scope ? scope.businessContext : null,
    );
    if (error) throw new Error(error.message);

    const updated = await getSalesQuoteById(id, scope);
    return NextResponse.json({ quote: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove terms PDF.";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
