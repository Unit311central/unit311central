import { NextRequest, NextResponse } from "next/server";

import {
  isSupabaseConfigured,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { telemetryToInsert, type Telemetry } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

function supabaseUnavailable() {
  return NextResponse.json(
    { error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY." },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  const droneId = request.nextUrl.searchParams.get("drone_id");
  if (!droneId) {
    return NextResponse.json({ error: "drone_id is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return supabaseUnavailable();
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("telemetry")
      .select("*")
      .eq("drone_id", droneId)
      .order("timestamp", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load telemetry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return supabaseUnavailable();
  }

  let body: Telemetry;
  try {
    body = (await request.json()) as Telemetry;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body.droneId ||
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number"
  ) {
    return NextResponse.json({ error: "Invalid telemetry payload" }, { status: 400 });
  }

  const telemetry: Telemetry = {
    ...body,
    lastUpdated: new Date(body.lastUpdated),
  };

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("telemetry")
      .insert(telemetryToInsert(telemetry))
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save telemetry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const droneId = request.nextUrl.searchParams.get("drone_id");
  if (!droneId) {
    return NextResponse.json({ error: "drone_id is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return supabaseUnavailable();
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("telemetry").delete().eq("drone_id", droneId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset telemetry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
