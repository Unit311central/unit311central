import { NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { resolveSalesManagementAuth, salesManagementErrorResponse } from "@/lib/sales-management-api";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type TargetBody = {
  id?: string;
  ownerUserId?: string | null;
  teamId?: string | null;
  periodType?: "month" | "quarter" | "year";
  periodStart?: string;
  periodEnd?: string;
  targetValue?: number;
  currency?: string;
  notes?: string | null;
};

export async function POST(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;
    const auth = await resolveSalesManagementAuth();

    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as TargetBody;

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
        currency: body.currency ?? resolveSlugReportingCurrency(auth.workspace.slug),
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

export async function PUT(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;

    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as TargetBody;
    if (!body.id) {
      return NextResponse.json({ error: "Target id is required." }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.ownerUserId !== undefined) patch.owner_user_id = body.ownerUserId;
    if (body.teamId !== undefined) patch.team_id = body.teamId;
    if (body.periodType) patch.period_type = body.periodType;
    if (body.periodStart) patch.period_start = body.periodStart;
    if (body.periodEnd) patch.period_end = body.periodEnd;
    if (body.targetValue != null) patch.target_value = body.targetValue;
    if (body.currency) patch.currency = body.currency;
    if (body.notes !== undefined) patch.notes = body.notes;

    const supabase = createTenancyServerClient();
    const { error } = await supabase
      .from("sales_targets")
      .update(patch)
      .eq("workspace_id", workspace.id)
      .eq("id", body.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isSupabaseConfigured())) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;

    const workspace = await requireCurrentWorkspace();
    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Target id is required." }, { status: 400 });
    }

    const supabase = createTenancyServerClient();
    const { error } = await supabase
      .from("sales_targets")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("id", id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}
