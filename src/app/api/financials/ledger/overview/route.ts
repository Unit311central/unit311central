import { NextResponse } from "next/server";

import { getFinancialOverview } from "@/lib/accounting/overview-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { buildNorthstarFinancialOverview } from "@/lib/demo/module-fixtures";
import { ensureTalantonHrEmployeesSeeded } from "@/lib/hr-employees-service";
import {
  ensureOnwardAirFinancialsCore,
  kickOnwardAirFinancialsDetails,
} from "@/lib/onwardair/financials-seed";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { requirePlatformSession } from "@/lib/platform-session";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      return NextResponse.json({ overview: buildNorthstarFinancialOverview() });
    }

    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    if (isOnwardAirSlug(workspace.slug)) {
      // Core only (COA + $1M cash) — never block overview on 100+ expense journals.
      await ensureOnwardAirFinancialsCore(workspace.id);
      kickOnwardAirFinancialsDetails(workspace.id);
    }
    if (isTalantonImpactSlug(workspace.slug)) {
      try {
        await ensureTalantonHrEmployeesSeeded(workspace.id);
      } catch (seedError) {
        console.error("[financials/overview] Talanton compensation seed failed:", seedError);
      }
    }
    const overview = await getFinancialOverview({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ overview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load overview.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
