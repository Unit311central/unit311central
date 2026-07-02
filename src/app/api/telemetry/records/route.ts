import { NextRequest, NextResponse } from "next/server";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function supabaseUnavailable() {
  return NextResponse.json(
    {
      error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
      status: "unconfigured",
      records: [],
      total: 0,
    },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return supabaseUnavailable();
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam ?? 50) || 50, 1), 200);

  try {
    const supabase = createSupabaseServerClient();

    const [{ count, error: countError }, { data, error }] = await Promise.all([
      supabase.from("telemetry").select("*", { count: "exact", head: true }),
      supabase
        .from("telemetry")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit),
    ]);

    if (countError) {
      return NextResponse.json(
        { error: countError.message, status: "error", records: [], total: 0 },
        { status: 500 },
      );
    }

    if (error) {
      return NextResponse.json(
        { error: error.message, status: "error", records: [], total: 0 },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        status: "connected",
        records: data ?? [],
        total: count ?? 0,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load telemetry records";
    return NextResponse.json(
      { error: message, status: "error", records: [], total: 0 },
      { status: 500 },
    );
  }
}
