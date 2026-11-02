/** Field marks, photos, and videos from the phone (Phone Link). */

export const WOLF_PHONE_CAPTURES_PATH = "/api/wolf/phone/captures";
export const WOLF_PHONE_CAPTURE_BUCKET = "wolf-phone-capture";
export const WOLF_PHONE_CAPTURE_MAX_BYTES = 80 * 1024 * 1024;

export type PhoneFieldLogKind = "position" | "photo" | "video";

export type PhoneFieldLog = {
  id: string;
  kind: PhoneFieldLogKind;
  capturedAt: string;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
  mimeType: string | null;
  sizeBytes: number | null;
  mediaUrl: string | null;
};

export type PhoneCaptureFix = {
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
};

function finiteOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parsePhoneCaptureFix(body: unknown): PhoneCaptureFix | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const latitude = finiteOrNull(record.latitude);
  const longitude = finiteOrNull(record.longitude);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  let speedMps = finiteOrNull(record.speedMps ?? record.speed);
  let headingDeg = finiteOrNull(record.headingDeg ?? record.heading);
  if (speedMps != null && speedMps < 0) speedMps = null;
  if (headingDeg != null && headingDeg === 360) headingDeg = 0;
  if (headingDeg != null && (headingDeg < 0 || headingDeg >= 360)) headingDeg = null;
  return {
    latitude,
    longitude,
    altitudeM: finiteOrNull(record.altitudeM ?? record.altitude),
    speedMps,
    headingDeg,
  };
}

export function formatCaptureSummary(log: PhoneFieldLog): string {
  const lat = Math.abs(log.latitude).toFixed(5);
  const lon = Math.abs(log.longitude).toFixed(5);
  const latH = log.latitude >= 0 ? "N" : "S";
  const lonH = log.longitude >= 0 ? "E" : "W";
  return `${lat}° ${latH}, ${lon}° ${lonH}`;
}
