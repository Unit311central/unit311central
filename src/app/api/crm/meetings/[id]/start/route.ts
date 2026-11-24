import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { sendFounderSessionStartReminder } from "@/lib/founder-booking/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request));
    const { id } = await context.params;
    const result = await sendFounderSessionStartReminder(id, scope);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send meeting reminder";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("not found")
        ? 404
        : message.includes("Authentication required") || message.includes("Workspace context")
          ? 401
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
