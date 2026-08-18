import { NextRequest, NextResponse } from "next/server";

import { approveSupplierInvoiceDraft } from "@/lib/accounting/supplier-invoice-service";
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "approve") {
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }

    const scope = await resolveScope();
    const draft = await approveSupplierInvoiceDraft(id, scope);
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve supplier invoice.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
