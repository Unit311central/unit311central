import { NextResponse } from "next/server";

import {
  WOLF_PHONE_CAPTURE_BUCKET,
  WOLF_PHONE_CAPTURE_MAX_BYTES,
  parsePhoneCaptureFix,
  type PhoneFieldLogKind,
} from "@/lib/wolf/phone-capture";
import {
  captureObjectPath,
  insertPhoneFieldLog,
  latestPhoneFixForWorkspace,
  listPhoneFieldLogs,
  phoneCaptureStoreReady,
  uploadCaptureBytes,
} from "@/lib/wolf/phone-capture-server";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";

function authFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "Authentication required.";
  const status = message.includes("only available") ? 403 : 401;
  return NextResponse.json({ error: message }, { status });
}

function extensionForMime(mimeType: string, kind: PhoneFieldLogKind): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("mp4")) return "mp4";
  if (kind === "video") return "webm";
  return "jpg";
}

function fixFromForm(form: FormData): ReturnType<typeof parsePhoneCaptureFix> {
  return parsePhoneCaptureFix({
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
    altitudeM: form.get("altitudeM"),
    speedMps: form.get("speedMps"),
    headingDeg: form.get("headingDeg"),
  });
}

async function resolveFix(
  workspaceId: string,
  body: unknown,
): Promise<Awaited<ReturnType<typeof latestPhoneFixForWorkspace>>> {
  const fix = parsePhoneCaptureFix(body);
  if (fix) return fix;
  return latestPhoneFixForWorkspace(workspaceId);
}

export async function GET() {
  let workspaceId: string;
  try {
    const { workspace } = await requireWolfCentralWorkspace();
    workspaceId = workspace.id;
  } catch (error) {
    return authFailure(error);
  }
  if (!phoneCaptureStoreReady()) {
    return NextResponse.json({ error: "Phone capture store is not configured." }, { status: 503 });
  }
  try {
    const logs = await listPhoneFieldLogs(workspaceId, 30);
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load captures.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let workspaceId: string;
  try {
    const { workspace } = await requireWolfCentralWorkspace();
    workspaceId = workspace.id;
  } catch (error) {
    return authFailure(error);
  }
  if (!phoneCaptureStoreReady()) {
    return NextResponse.json({ error: "Phone capture store is not configured." }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const kindRaw = String(form.get("kind") ?? "");
      const kind: PhoneFieldLogKind =
        kindRaw === "photo" || kindRaw === "video" ? kindRaw : (null as never);
      if (kind !== "photo" && kind !== "video") {
        return NextResponse.json({ error: "Expected kind photo or video." }, { status: 400 });
      }
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Expected a media file." }, { status: 400 });
      }
      if (file.size <= 0 || file.size > WOLF_PHONE_CAPTURE_MAX_BYTES) {
        return NextResponse.json({ error: "File is empty or too large." }, { status: 400 });
      }
      const fix = (await fixFromForm(form)) ?? (await latestPhoneFixForWorkspace(workspaceId));
      if (!fix) {
        return NextResponse.json(
          { error: "No GPS fix yet. Keep GPSLogger running or allow location on this page." },
          { status: 400 },
        );
      }
      const mimeType = file.type || (kind === "photo" ? "image/jpeg" : "video/webm");
      const path = captureObjectPath(workspaceId, extensionForMime(mimeType, kind));
      const bytes = await file.arrayBuffer();
      await uploadCaptureBytes(path, bytes, mimeType);
      const log = await insertPhoneFieldLog({
        workspaceId,
        kind,
        fix,
        storageBucket: WOLF_PHONE_CAPTURE_BUCKET,
        storageObjectPath: path,
        mimeType,
        sizeBytes: file.size,
      });
      return NextResponse.json({ log }, { status: 201 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (body?.kind !== "position") {
      return NextResponse.json({ error: "Expected kind position." }, { status: 400 });
    }
    const fix = await resolveFix(workspaceId, body);
    if (!fix) {
      return NextResponse.json(
        { error: "No GPS fix yet. Keep GPSLogger running or allow location on this page." },
        { status: 400 },
      );
    }
    const log = await insertPhoneFieldLog({ workspaceId, kind: "position", fix });
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save capture.";
    const status = message.includes("relation") || message.includes("wolf_phone_field_logs") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
