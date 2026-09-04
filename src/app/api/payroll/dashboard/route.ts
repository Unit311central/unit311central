import { NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarPayrollDashboard } from "@/lib/demo/northstar-hr-data";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";
import {
  ensureGreenDesertHrEmployeesSeeded,
  ensureTalantonHrEmployeesSeeded,
} from "@/lib/hr-employees-service";
import { getPayrollDashboard } from "@/lib/payroll/payroll-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { getSaecPayrollDashboard } from "@/lib/saec/saec-payroll-fixtures";
import { isSaecSlug } from "@/lib/saec-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ dashboard: getNorthstarPayrollDashboard() });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    if (isTalantonImpactSlug(workspace.slug)) {
      try {
        await ensureTalantonHrEmployeesSeeded(workspace.id);
      } catch (seedError) {
        console.error("[payroll/dashboard] Talanton compensation seed failed:", seedError);
      }
    }
    if (isGreenDesertSlug(workspace.slug)) {
      try {
        await ensureGreenDesertHrEmployeesSeeded(workspace.id);
      } catch (seedError) {
        console.error("[payroll/dashboard] Green Desert compensation seed failed:", seedError);
      }
    }
    if (isSaecSlug(workspace.slug)) {
      const live = await getPayrollDashboard({ workspaceId: workspace.id });
      const hasRuns = (live.recentRuns?.length ?? 0) > 0;
      return NextResponse.json({ dashboard: hasRuns ? live : getSaecPayrollDashboard() });
    }
    const dashboard = await getPayrollDashboard({ workspaceId: workspace.id });
    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payroll dashboard.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error, 500) });
  }
}
