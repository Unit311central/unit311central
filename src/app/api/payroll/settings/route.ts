import { NextRequest, NextResponse } from "next/server";

import { getPayrollSettings, updatePayrollSettings } from "@/lib/payroll/payroll-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarPayrollSettings } from "@/lib/demo/northstar-hr-data";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ settings: getNorthstarPayrollSettings() });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const settings = await getPayrollSettings({ workspaceId: workspace.id });
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payroll settings.";
    const status = message.includes("Authentication") || message.includes("Workspace") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = await request.json();
    const settings = await updatePayrollSettings(body ?? {}, { workspaceId: workspace.id });
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update payroll settings.";
    const status = message.includes("Authentication") || message.includes("Workspace") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
