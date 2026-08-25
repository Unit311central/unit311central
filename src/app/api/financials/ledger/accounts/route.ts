import { NextResponse } from "next/server";

import { listAccounts } from "@/lib/accounting/journal-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarLedgerAccounts } from "@/lib/demo/module-fixtures";
import { getSaecLedgerAccounts } from "@/lib/saec/saec-gl-fixtures";
import { isSaecSlug } from "@/lib/saec-surface";
import { ensureOnwardAirFinancialsSeeded } from "@/lib/onwardair/financials-seed";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      return NextResponse.json({ accounts: getNorthstarLedgerAccounts() });
    }

    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    if (isSaecSlug(workspace.slug)) {
      return NextResponse.json({ accounts: getSaecLedgerAccounts() });
    }
    if (isOnwardAirSlug(workspace.slug)) {
      await ensureOnwardAirFinancialsSeeded(workspace.id);
    }
    const accounts = await listAccounts({ workspaceId: workspace.id });
    return NextResponse.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load accounts.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
