import { NextResponse } from "next/server";

import { listInvoices } from "@/lib/accounting/invoices-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarInvoices } from "@/lib/demo/northstar-api-fixtures";
import { ensureOnwardAirFinancialsSeeded } from "@/lib/onwardair/financials-seed";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      return NextResponse.json({ invoices: getNorthstarInvoices() });
    }

    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    if (isOnwardAirSlug(workspace.slug)) {
      await ensureOnwardAirFinancialsSeeded(workspace.id);
    }
    const invoices = await listInvoices({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load invoices.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
