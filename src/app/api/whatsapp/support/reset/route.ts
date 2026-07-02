import { NextResponse } from "next/server";

import { clearWhatsAppSupportSession } from "@/lib/support-whatsapp-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await clearWhatsAppSupportSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset support session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
