import { NextResponse } from "next/server";

import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import {
  PHONE_LOGGER_INTERVAL_SECONDS,
  WOLF_PHONE_TELEMETRY_PATH,
  gpsLoggerBody,
} from "@/lib/wolf/phone-telemetry";
import { wolfPhoneIngestSecret } from "@/lib/wolf/phone-ingest-secret";
import { phoneIngestToken } from "@/lib/wolf/phone-telemetry-token";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

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
  const secret = wolfPhoneIngestSecret();
  if (!isSupabaseServiceRoleConfigured() || !secret) {
    return NextResponse.json({ error: "Phone telemetry store is not configured." }, { status: 503 });
  }

  return NextResponse.json({
    path: WOLF_PHONE_TELEMETRY_PATH,
    body: gpsLoggerBody(phoneIngestToken(workspaceId, secret)),
    intervalSeconds: PHONE_LOGGER_INTERVAL_SECONDS,
    workspaceHint: workspaceId.slice(0, 8),
  });
}
