import { NextRequest, NextResponse } from "next/server";

import { updateStrategyItem } from "@/lib/strategy-items-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { notes?: string; priority?: number | null };
    const item = await updateStrategyItem(id, body);
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update strategy item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
