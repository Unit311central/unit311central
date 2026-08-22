import { NextRequest, NextResponse } from "next/server";

import type { PlatformSession } from "@/lib/platform-session";
import { startEngineeringSopRun } from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function actor(session: PlatformSession) {
  return { userId: session.sub, displayName: session.displayName || session.username };
}

export async function POST(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const run = await startEngineeringSopRun(id, actor(session));
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start SOP run.";
    const status = message.includes("not found") ? 404 : message.includes("Only approved") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
