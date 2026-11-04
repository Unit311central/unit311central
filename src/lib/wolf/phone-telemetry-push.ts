import { WOLF_PHONE_TELEMETRY_PATH, type PhoneFixInput } from "@/lib/wolf/phone-telemetry";
import { isWolfNativeShell, readNativeGeolocation } from "@/lib/wolf/phone-native-shell";

async function currentFix(): Promise<PhoneFixInput | null> {
  if (await isWolfNativeShell()) {
    try {
      return await readNativeGeolocation();
    } catch {
      /* fall through to browser */
    }
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
  });
  const { latitude, longitude, altitude, speed, heading } = position.coords;
  return {
    latitude,
    longitude,
    altitudeM: altitude,
    speedMps: speed != null && speed >= 0 ? speed : null,
    headingDeg: heading != null && heading >= 0 ? heading : null,
  };
}

/** POST a one-shot fix using the logged-in WOLF session (Android app, browser, or WebRTC page). */
export async function pushPhoneGpsToWolf(): Promise<{ ok: true } | { ok: false; error: string }> {
  const fix = await currentFix();
  if (!fix) {
    return { ok: false, error: "No GPS fix. Allow location for WOLF Central." };
  }
  const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fix),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: payload?.error ?? `WOLF returned HTTP ${response.status}.` };
  }
  return { ok: true };
}
