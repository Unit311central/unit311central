import { WOLF_PHONE_TELEMETRY_PATH, type PhoneFixInput } from "@/lib/wolf/phone-telemetry";
import {
  isCapacitorBridgePresent,
  isWolfNativeShell,
  readNativeGeolocation,
} from "@/lib/wolf/phone-native-shell";

function geolocationErrorMessage(error: unknown): string {
  if (error instanceof GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Location denied. Allow location for WOLF Central (or the browser) and try again.";
    }
    if (error.code === error.TIMEOUT) {
      return "GPS timed out. Step outside or wait for a satellite fix, then try again.";
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return "GPS unavailable on this device right now.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not read GPS on this device.";
}

async function browserGeolocationFix(): Promise<PhoneFixInput> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("This view has no geolocation API.");
  }
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
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

async function currentFix(): Promise<PhoneFixInput> {
  const preferNative = isCapacitorBridgePresent() || (await isWolfNativeShell());
  if (preferNative) {
    return readNativeGeolocation();
  }
  return browserGeolocationFix();
}

/** POST a one-shot fix using the logged-in WOLF session (Android app, browser, or WebRTC page). */
export async function pushPhoneGpsToWolf(): Promise<{ ok: true } | { ok: false; error: string }> {
  let fix: PhoneFixInput;
  try {
    fix = await currentFix();
  } catch (error) {
    return { ok: false, error: geolocationErrorMessage(error) };
  }

  try {
    const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fix),
      credentials: "same-origin",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: payload?.error ?? `WOLF returned HTTP ${response.status}.` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach WOLF. Check mobile data or Wi‑Fi." };
  }
}
