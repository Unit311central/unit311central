import { NextRequest, NextResponse } from "next/server";

import {
  ingestSupplierInvoice,
  listSupplierInvoiceDrafts,
} from "@/lib/accounting/supplier-invoice-service";
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

export async function GET() {
  try {
    const scope = await resolveScope();
    const drafts = await listSupplierInvoiceDrafts(scope);
    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load supplier invoices.";
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
      text?: string;
      supplier?: string;
      reference?: string | null;
      amount?: number;
      currency?: string;
      invoiceDate?: string | null;
      dueDate?: string | null;
      description?: string;
    };

    const scope = await resolveScope();
    const draft = await ingestSupplierInvoice(scope, body);
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to ingest supplier invoice.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
