import { NextResponse } from "next/server";

import { listStrategyItems } from "@/lib/strategy-items-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const items = await listStrategyItems();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load strategy items";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
