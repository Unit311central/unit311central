/** Latest phone GPS fix for the Brix WebRTC view. The video stays clean. */

export const WOLF_PHONE_DRONE_ID = "wolf-phone";
export const WOLF_PHONE_TELEMETRY_PATH = "/api/wolf/live/phone-telemetry";
export const PHONE_FIX_FRESH_MS = 20_000;

export type PhoneFixInput = {
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
};

export type PhoneFix = PhoneFixInput & {
  recordedAt: string;
};

type PhoneTelemetryRow = {
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  status: string | null;
};

function finiteOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parsePhoneFixInput(body: unknown): PhoneFixInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const latitude = finiteOrNull(record.latitude);
  const longitude = finiteOrNull(record.longitude);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const altitudeM = finiteOrNull(record.altitudeM);
  const speedMps = finiteOrNull(record.speedMps);
  const headingDeg = finiteOrNull(record.headingDeg);
  if (speedMps != null && speedMps < 0) return null;
  if (headingDeg != null && (headingDeg < 0 || headingDeg >= 360)) return null;

  return { latitude, longitude, altitudeM, speedMps, headingDeg };
}

export function phoneFixStatus(headingDeg: number | null): string {
  if (headingDeg == null) return "phone";
  return `hdg:${headingDeg.toFixed(1)}`;
}

export function headingFromStatus(status: string | null | undefined): number | null {
  if (!status) return null;
  const match = /hdg:(-?\d+(?:\.\d+)?)/.exec(status);
  if (!match) return null;
  const heading = Number(match[1]);
  return Number.isFinite(heading) ? heading : null;
}

export function rowToPhoneFix(row: PhoneTelemetryRow, nowMs: number): PhoneFix | null {
  const recordedMs = Date.parse(row.timestamp);
  if (!Number.isFinite(recordedMs) || nowMs - recordedMs > PHONE_FIX_FRESH_MS) return null;
  const latitude = finiteOrNull(row.latitude);
  const longitude = finiteOrNull(row.longitude);
  if (latitude == null || longitude == null) return null;
  return {
    latitude,
    longitude,
    altitudeM: finiteOrNull(row.altitude),
    speedMps: finiteOrNull(row.speed),
    headingDeg: headingFromStatus(row.status),
    recordedAt: new Date(recordedMs).toISOString(),
  };
}

function hemisphere(value: number, positive: string, negative: string): string {
  const abs = Math.abs(value).toFixed(5);
  return `${abs}° ${value >= 0 ? positive : negative}`;
}

export function formatPhoneFix(fix: PhoneFix): { position: string; detail: string } {
  const position = `${hemisphere(fix.latitude, "N", "S")}, ${hemisphere(fix.longitude, "E", "W")}`;
  const parts: string[] = [];
  if (fix.altitudeM != null) parts.push(`${Math.round(fix.altitudeM)} m`);
  if (fix.speedMps != null) parts.push(`${Math.round(fix.speedMps * 3.6)} km/h`);
  if (fix.headingDeg != null) parts.push(`${Math.round(fix.headingDeg).toString().padStart(3, "0")}°`);
  return { position, detail: parts.join(" · ") || "GPS" };
}
