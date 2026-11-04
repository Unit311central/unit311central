import { NextResponse } from "next/server";

import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import {
  WOLF_PHONE_DRONE_ID,
  parsePhoneFixInput,
  phoneFixStatus,
  rowToPhoneFix,
} from "@/lib/wolf/phone-telemetry";
import { workspaceIdFromPhoneToken } from "@/lib/wolf/phone-telemetry-token";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";

function authFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Authentication required.";
  const status = message.includes("only available") ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

function ingestSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

async function readRecord(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("text/plain")) {
    const params = new URLSearchParams(await request.text());
    const record: Record<string, string> = {};
    params.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  const json = (await request.json().catch(() => null)) as unknown;
  if (!json || typeof json !== "object") return null;
  return json as Record<string, unknown>;
}

function tokenFrom(request: Request, record: Record<string, unknown> | null): string {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (bearer) return bearer;
  return typeof record?.token === "string" ? record.token.trim() : "";
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

  const nowMs = Date.now();
  const fix = data ? rowToPhoneFix(data, nowMs) : null;
  const lastFixAt = data?.timestamp ?? null;
  const ageMs =
    data?.timestamp && Number.isFinite(Date.parse(data.timestamp))
      ? nowMs - Date.parse(data.timestamp)
      : null;
  return NextResponse.json({
    fix,
    lastFixAt,
    ageMs,
    fresh: fix != null,
  });
}

export async function POST(request: Request) {
  const record = await readRecord(request);
  const token = tokenFrom(request, record);
  let workspaceId: string;
  if (token) {
    const secret = ingestSecret();
    const fromToken = secret ? workspaceIdFromPhoneToken(token, secret) : null;
    if (!fromToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    workspaceId = fromToken;
  } else {
    try {
      const { workspace } = await requireWolfCentralWorkspace();
      workspaceId = workspace.id;
    } catch (error) {
      return authFailure(error);
    }
  }

  const fix = parsePhoneFixInput(record);
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
