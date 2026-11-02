/**
 * WHEP signalling targets for WOLF live WebRTC pages.
 * The browser never calls RunPod directly. Media stays on the WebRTC
 * peer connection; this module only names the signalling URL.
 *
 * Phone test page: live/test. DJI Neo on WOLF Sky: live/sky.
 * Set WOLF_WHEP_URL or WOLF_SKY_WHEP_URL to override a target.
 */

export const PROPOSED_WHEP_URL =
  "https://4s4dzedw76v0re-8889.proxy.runpod.net/live/test/whep";

export const SKY_WHEP_URL =
  "https://4s4dzedw76v0re-8889.proxy.runpod.net/live/sky/whep";

export const WOLF_SKY_RTMP_URL = "rtmp://38.80.152.147:39908/live/sky";

export const WOLF_GROUND_WEBRTC_PATH = "/api/wolf/live/webrtc";

export const WOLF_SKY_WEBRTC_PATH = "/api/wolf/live/sky/webrtc";

const SESSION_PATH = /^\/live\/(?:test|sky)\/whep\/[A-Za-z0-9_-]+$/;

function resolveHttpsUrl(
  envValue: string | undefined,
  fallback: string,
  envName: string,
): string {
  const trimmed = envValue?.trim();
  if (!trimmed) return fallback;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${envName} is not a valid URL.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${envName} must use https.`);
  }
  if (url.username || url.password) {
    throw new Error(`${envName} must not include credentials.`);
  }
  return url.toString();
}

export function resolveWhepUrl(envValue: string | undefined): string {
  return resolveHttpsUrl(envValue, PROPOSED_WHEP_URL, "WOLF_WHEP_URL");
}

export function resolveSkyWhepUrl(envValue: string | undefined): string {
  return resolveHttpsUrl(envValue, SKY_WHEP_URL, "WOLF_SKY_WHEP_URL");
}

/** Keep a MediaMTX WHEP session path for the phone or the Neo. Reject anything else. */
export function whepSessionPath(location: string | null | undefined): string | null {
  if (!location) return null;
  let path = location.trim();
  if (!path) return null;
  try {
    if (path.startsWith("https://") || path.startsWith("http://")) {
      path = new URL(path).pathname;
    }
  } catch {
    return null;
  }
  if (!path.startsWith("/")) path = `/${path}`;
  return SESSION_PATH.test(path) ? path : null;
}
