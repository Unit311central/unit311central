import "server-only";

import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import {
  WOLF_PHONE_CAPTURE_BUCKET,
  type PhoneCaptureFix,
  type PhoneFieldLog,
  type PhoneFieldLogKind,
} from "@/lib/wolf/phone-capture";
import { WOLF_PHONE_DRONE_ID, rowToPhoneFix } from "@/lib/wolf/phone-telemetry";

type FieldLogRow = {
  id: string;
  kind: PhoneFieldLogKind;
  captured_at: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  storage_bucket: string | null;
  storage_object_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
};

export function phoneCaptureStoreReady(): boolean {
  return isSupabaseServiceRoleConfigured();
}

export async function latestPhoneFixForWorkspace(workspaceId: string): Promise<PhoneCaptureFix | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("telemetry")
    .select("timestamp, latitude, longitude, altitude, speed, status")
    .eq("workspace_id", workspaceId)
    .eq("drone_id", WOLF_PHONE_DRONE_ID)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const fix = rowToPhoneFix(data, Date.now());
  if (!fix) return null;
  return {
    latitude: fix.latitude,
    longitude: fix.longitude,
    altitudeM: fix.altitudeM,
    speedMps: fix.speedMps,
    headingDeg: fix.headingDeg,
  };
}

function rowToLog(row: FieldLogRow, mediaUrl: string | null): PhoneFieldLog {
  return {
    id: row.id,
    kind: row.kind,
    capturedAt: row.captured_at,
    latitude: row.latitude,
    longitude: row.longitude,
    altitudeM: row.altitude,
    speedMps: row.speed,
    headingDeg: row.heading,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    mediaUrl,
  };
}

export async function listPhoneFieldLogs(workspaceId: string, limit = 20): Promise<PhoneFieldLog[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("wolf_phone_field_logs")
    .select(
      "id, kind, captured_at, latitude, longitude, altitude, speed, heading, storage_bucket, storage_object_path, mime_type, size_bytes",
    )
    .eq("workspace_id", workspaceId)
    .order("captured_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as FieldLogRow[];
  const out: PhoneFieldLog[] = [];
  for (const row of rows) {
    let mediaUrl: string | null = null;
    if (row.storage_bucket && row.storage_object_path) {
      const { data: signed } = await supabase.storage
        .from(row.storage_bucket)
        .createSignedUrl(row.storage_object_path, 3600);
      mediaUrl = signed?.signedUrl ?? null;
    }
    out.push(rowToLog(row, mediaUrl));
  }
  return out;
}

export async function insertPhoneFieldLog(input: {
  workspaceId: string;
  kind: PhoneFieldLogKind;
  fix: PhoneCaptureFix;
  storageBucket?: string | null;
  storageObjectPath?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}): Promise<PhoneFieldLog> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("wolf_phone_field_logs")
    .insert({
      workspace_id: input.workspaceId,
      kind: input.kind,
      latitude: input.fix.latitude,
      longitude: input.fix.longitude,
      altitude: input.fix.altitudeM,
      speed: input.fix.speedMps,
      heading: input.fix.headingDeg,
      storage_bucket: input.storageBucket ?? null,
      storage_object_path: input.storageObjectPath ?? null,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
    })
    .select(
      "id, kind, captured_at, latitude, longitude, altitude, speed, heading, storage_bucket, storage_object_path, mime_type, size_bytes",
    )
    .single();
  if (error) throw new Error(error.message);
  const row = data as FieldLogRow;
  let mediaUrl: string | null = null;
  if (row.storage_bucket && row.storage_object_path) {
    const { data: signed } = await supabase.storage
      .from(row.storage_bucket)
      .createSignedUrl(row.storage_object_path, 3600);
    mediaUrl = signed?.signedUrl ?? null;
  }
  return rowToLog(row, mediaUrl);
}

export function captureObjectPath(workspaceId: string, ext: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  return `${workspaceId}/${day}/${id}.${ext}`;
}

export async function uploadCaptureBytes(
  path: string,
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.storage.from(WOLF_PHONE_CAPTURE_BUCKET).upload(path, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw new Error(error.message);
}
