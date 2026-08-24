import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  deleteTechnologyTelecomService,
  updateTechnologyTelecomService,
} from "@/lib/technology-telecom/service";
import type { TechnologyTelecomServiceInput } from "@/lib/technology-telecom/types";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const { id } = await context.params;
    const body = (await request.json()) as TechnologyTelecomServiceInput;
    const service = await updateTechnologyTelecomService(id, body);
    return NextResponse.json({ service });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update telecom service.";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const { id } = await context.params;
    await deleteTechnologyTelecomService(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete telecom service.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
