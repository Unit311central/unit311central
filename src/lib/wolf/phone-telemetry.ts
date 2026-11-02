/** Latest phone GPS fix for the Brix WebRTC view. The video stays clean. */

export const WOLF_PHONE_DRONE_ID = "wolf-phone";
export const WOLF_PHONE_TELEMETRY_PATH = "/api/wolf/live/phone-telemetry";
export const WOLF_PHONE_LINK_PATH = "/api/wolf/live/phone-link";
/** GPSLogger posts on an interval while Brix is in front. Keep the last fix through one missed post. */
export const PHONE_FIX_FRESH_MS = 90_000;
export const PHONE_LOGGER_INTERVAL_SECONDS = 10;

export function gpsLoggerBody(token: string): string {
  return `token=${token}&latitude=%LAT&longitude=%LON&altitude=%ALT&speed=%SPD&heading=%DIR`;
}

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

function firstFinite(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    if (!(key in record)) continue;
    const value = finiteOrNull(record[key]);
    if (value != null) return value;
  }
  return null;
}

export function parsePhoneFixInput(body: unknown): PhoneFixInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const latitude = firstFinite(record, ["latitude", "lat"]);
  const longitude = firstFinite(record, ["longitude", "lon"]);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const altitudeM = firstFinite(record, ["altitudeM", "altitude", "alt"]);
  let speedMps = firstFinite(record, ["speedMps", "speed", "spd"]);
  let headingDeg = firstFinite(record, ["headingDeg", "heading", "direction", "dir"]);
  if (speedMps != null && speedMps < 0) speedMps = null;
  if (headingDeg != null && headingDeg === 360) headingDeg = 0;
  if (headingDeg != null && (headingDeg < 0 || headingDeg >= 360)) headingDeg = null;

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
