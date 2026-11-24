import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { submitFounderSessionFocusSelections } from "@/lib/founder-booking/focus-submission-service";
import { getFounderSessionBookingInScope } from "@/lib/founder-booking/service";
import { getPlatformSession } from "@/lib/platform-session";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request));
    const { id } = await context.params;
    const booking = await getFounderSessionBookingInScope(id, scope);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!booking.focusSelections) {
      return NextResponse.json(
        {
          error:
            "No focus selections stored for this booking. The client must submit focus areas on /book after booking.",
        },
        { status: 400 },
      );
    }

    const result = await submitFounderSessionFocusSelections(id, booking.focusSelections);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to regenerate focus PDF";
    const status = message.includes("sales business context")
      ? 400
      : message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
