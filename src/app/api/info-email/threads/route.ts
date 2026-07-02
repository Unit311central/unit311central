import { NextRequest, NextResponse } from "next/server";

import { listInfoEmailThreads } from "@/lib/internal-info-email-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const threads = await listInfoEmailThreads();
    return NextResponse.json({ threads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inbox";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
