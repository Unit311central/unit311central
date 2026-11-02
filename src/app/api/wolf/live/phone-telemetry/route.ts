import { NextResponse } from "next/server";

import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";
import {
  WOLF_PHONE_DRONE_ID,
  parsePhoneFixInput,
  phoneFixStatus,
  rowToPhoneFix,
} from "@/lib/wolf/phone-telemetry";

export const dynamic = "force-dynamic";

function authFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Authentication required.";
  const status = message.includes("only available") ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  let workspaceId: string;
  try {
    const { workspace } = await requireWolfCentralWorkspace();
    workspaceId = workspace.id;
  } catch (error) {
    return authFailure(error);
  }
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Phone telemetry store is not configured." }, { status: 503 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("telemetry")
    .select("timestamp, latitude, longitude, altitude, speed, status")
    .eq("workspace_id", workspaceId)
    .eq("drone_id", WOLF_PHONE_DRONE_ID)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fix = data ? rowToPhoneFix(data, Date.now()) : null;
  return NextResponse.json({ fix });
}

export async function POST(request: Request) {
  let workspaceId: string;
  try {
    const { workspace } = await requireWolfCentralWorkspace();
    workspaceId = workspace.id;
  } catch (error) {
    return authFailure(error);
  }

  const fix = parsePhoneFixInput(await request.json().catch(() => null));
  if (!fix) {
    return NextResponse.json({ error: "Expected a phone GPS fix." }, { status: 400 });
  }
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Phone telemetry store is not configured." }, { status: 503 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const recordedAt = new Date().toISOString();
  const { error } = await supabase.from("telemetry").insert({
    workspace_id: workspaceId,
    drone_id: WOLF_PHONE_DRONE_ID,
    timestamp: recordedAt,
    latitude: fix.latitude,
    longitude: fix.longitude,
    altitude: fix.altitudeM,
    speed: fix.speedMps,
    battery: null,
    status: phoneFixStatus(fix.headingDeg),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cutoff = new Date(Date.now() - 2 * 60_000).toISOString();
  await supabase
    .from("telemetry")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("drone_id", WOLF_PHONE_DRONE_ID)
    .lt("timestamp", cutoff);

  return NextResponse.json({ ok: true, recordedAt });
}
