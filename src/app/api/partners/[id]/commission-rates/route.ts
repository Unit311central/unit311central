import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  createPartnerCommissionRate,
  listPartnerCommissionRates,
} from "@/lib/partners/jobs-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    await requireCurrentWorkspace();
    const { id } = await context.params;
    const rates = await listPartnerCommissionRates(id);
    return NextResponse.json({ rates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list rates";
    const status = message.includes("Authentication") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      label?: string;
      ratePct?: number;
      isDefault?: boolean;
    };
    if (body.ratePct == null || !Number.isFinite(Number(body.ratePct))) {
      return NextResponse.json({ error: "ratePct is required." }, { status: 400 });
    }
    const rate = await createPartnerCommissionRate({
      partnerId: id,
      label: body.label?.trim() || "Commission",
      ratePct: Number(body.ratePct),
      isDefault: body.isDefault,
    });
    return NextResponse.json({ rate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create rate";
    const status = message.includes("Authentication") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
