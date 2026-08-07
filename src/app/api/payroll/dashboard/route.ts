import { NextResponse } from "next/server";

import { ensureTalantonHrEmployeesSeeded } from "@/lib/hr-employees-service";
import { getPayrollDashboard } from "@/lib/payroll/payroll-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
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
    const dashboard = await getPayrollDashboard({ workspaceId: workspace.id });
    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payroll dashboard.";
    const status = message.includes("Authentication") || message.includes("Workspace") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
