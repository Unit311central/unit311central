import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    configured: true,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
}
