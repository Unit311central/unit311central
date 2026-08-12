import { NextRequest, NextResponse } from "next/server";

import { normalizeBookThankYouSelections } from "@/lib/book-thank-you-data";
import { submitFounderSessionFocusSelections } from "@/lib/founder-booking/focus-submission-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { selections?: unknown; email?: string };
    const selections = normalizeBookThankYouSelections(body.selections);
    if (!selections) {
      return NextResponse.json({ error: "Invalid focus selections payload." }, { status: 400 });
    }

    const result = await submitFounderSessionFocusSelections(id, selections);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save focus selections";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
