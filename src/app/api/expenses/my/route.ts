import { NextResponse } from "next/server";

import { listMyExpenses } from "@/lib/financial-expenses-service";
import { resolveWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency-server";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarExpenses } from "@/lib/demo/northstar-api-fixtures";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ expenses: getNorthstarExpenses(), currency: "USD" });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const currency = await resolveWorkspaceReportingCurrency(workspace.id, workspace.slug);
    const expenses = await listMyExpenses(session.sub, { workspaceId: workspace.id });
    return NextResponse.json({ expenses, currency });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load expenses";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
