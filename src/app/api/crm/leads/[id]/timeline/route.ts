import { NextRequest, NextResponse } from "next/server";

import {
  listCrmActivitiesForLead,
  listCrmContactHistoryForLead,
} from "@/lib/crm-contact-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request));
    const [history, activities] = await Promise.all([
      listCrmContactHistoryForLead(id, scope),
      listCrmActivitiesForLead(id, scope),
    ]);

    return NextResponse.json({ history, activities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load CRM timeline";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Lead not found")
        ? 404
        : message.includes("Authentication required") || message.includes("Workspace context")
          ? 401
          : message.includes("does not exist") || message.includes("schema cache")
            ? 503
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
