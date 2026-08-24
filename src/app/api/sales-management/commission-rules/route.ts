import { NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  createSalesCommissionRule,
  deleteSalesCommissionRule,
  updateSalesCommissionRule,
} from "@/lib/sales-management-service";
import {
  resolveSalesManagementAuth,
  salesManagementErrorResponse,
} from "@/lib/sales-management-api";

export const dynamic = "force-dynamic";

type AppliesTo = "won_deal" | "accepted_quote" | "invoice_paid";

function parseAppliesTo(value: unknown): AppliesTo | null {
  const normalized = String(value ?? "").trim();
  if (normalized === "won_deal" || normalized === "accepted_quote" || normalized === "invoice_paid") {
    return normalized;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;
    const auth = await resolveSalesManagementAuth();
    const body = (await request.json()) as {
      name?: string;
      ratePct?: number;
      appliesTo?: string;
      isActive?: boolean;
    };
    const name = String(body.name ?? "").trim();
    const ratePct = Number(body.ratePct);
    const appliesTo = parseAppliesTo(body.appliesTo);
    if (!name) return NextResponse.json({ error: "Rule name is required." }, { status: 400 });
    if (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100) {
      return NextResponse.json({ error: "Rate must be between 0 and 100." }, { status: 400 });
    }
    if (!appliesTo) {
      return NextResponse.json({ error: "Invalid appliesTo value." }, { status: 400 });
    }
    const rule = await createSalesCommissionRule({
      workspaceId: auth.workspace.id,
      name,
      ratePct,
      appliesTo,
      isActive: body.isActive ?? true,
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;
    const auth = await resolveSalesManagementAuth();
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      ratePct?: number;
      appliesTo?: string;
      isActive?: boolean;
    };
    const ruleId = String(body.id ?? "").trim();
    if (!ruleId) return NextResponse.json({ error: "Rule id is required." }, { status: 400 });
    const appliesTo = body.appliesTo != null ? parseAppliesTo(body.appliesTo) : undefined;
    if (body.appliesTo != null && !appliesTo) {
      return NextResponse.json({ error: "Invalid appliesTo value." }, { status: 400 });
    }
    const rule = await updateSalesCommissionRule({
      workspaceId: auth.workspace.id,
      ruleId,
      name: body.name != null ? String(body.name) : undefined,
      ratePct: body.ratePct != null ? Number(body.ratePct) : undefined,
      appliesTo: appliesTo ?? undefined,
      isActive: body.isActive,
    });
    return NextResponse.json({ rule });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const blocked = await assertDemoMutationAllowedForRequest(request);
    if (blocked) return blocked;
    const auth = await resolveSalesManagementAuth();
    const url = new URL(request.url);
    const ruleId = url.searchParams.get("id")?.trim();
    if (!ruleId) return NextResponse.json({ error: "Rule id is required." }, { status: 400 });
    await deleteSalesCommissionRule(auth.workspace.id, ruleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}
