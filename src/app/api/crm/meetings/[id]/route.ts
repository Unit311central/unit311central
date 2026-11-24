import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { EXECUTIVE_MEETING_STATUSES } from "@/lib/founder-booking/meeting-slug";
import {
  deleteFounderSessionBooking,
  updateFounderSessionMeetingStatus,
} from "@/lib/founder-booking/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string; businessContext?: unknown };
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request, body));
    const status = body.status?.trim();

    if (!status || !EXECUTIVE_MEETING_STATUSES.includes(status as (typeof EXECUTIVE_MEETING_STATUSES)[number])) {
      return NextResponse.json({ error: "A valid meeting status is required." }, { status: 400 });
    }

    const booking = await updateFounderSessionMeetingStatus(
      id,
      status as (typeof EXECUTIVE_MEETING_STATUSES)[number],
      scope,
    );
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update meeting";
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

export async function DELETE(request: NextRequest, context: RouteContext) {
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
    await deleteFounderSessionBooking(id, scope);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete meeting";
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
