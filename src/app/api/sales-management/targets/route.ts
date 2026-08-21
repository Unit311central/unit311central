import { NextResponse } from "next/server";

import { resolveSalesManagementAuth, salesManagementErrorResponse } from "@/lib/sales-management-api";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const auth = await resolveSalesManagementAuth();
    if (auth.demo) {
      return NextResponse.json({ error: "Targets cannot be saved on demo fixtures." }, { status: 403 });
    }

    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      ownerUserId?: string | null;
      teamId?: string | null;
      periodType?: "month" | "quarter" | "year";
      periodStart?: string;
      periodEnd?: string;
      targetValue?: number;
      currency?: string;
      notes?: string | null;
    };

    if (!body.periodStart || !body.periodEnd || body.targetValue == null) {
      return NextResponse.json({ error: "periodStart, periodEnd, and targetValue are required." }, { status: 400 });
    }
    if (!body.ownerUserId && !body.teamId) {
      return NextResponse.json({ error: "Assign a salesperson or team." }, { status: 400 });
    }

    const supabase = createTenancyServerClient();
    const { data, error } = await supabase
      .from("sales_targets")
      .insert({
        workspace_id: workspace.id,
        owner_user_id: body.ownerUserId ?? null,
        team_id: body.teamId ?? null,
        period_type: body.periodType ?? "quarter",
        period_start: body.periodStart,
        period_end: body.periodEnd,
        target_value: body.targetValue,
        currency: body.currency ?? "GBP",
        notes: body.notes ?? null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.message.includes("sales_targets")) {
        return NextResponse.json(
          { error: "Sales targets table is not available. Apply migration 149_sales_management_foundation.sql." },
          { status: 503 },
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}
