/**
 * WHEP signalling target for the WOLF Ground WebRTC test page.
 * The browser never calls RunPod directly. Media stays on the WebRTC
 * peer connection; this module only names the signalling URL.
 *
 * The default is MediaMTX's documented WHEP address on the existing pod.
 * The running pod has not confirmed that listener. Set WOLF_WHEP_URL when
 * the real webrtcAddress is known.
 */

export const PROPOSED_WHEP_URL =
  "https://4s4dzedw76v0re-8889.proxy.runpod.net/live/test/whep";

export const WOLF_GROUND_WEBRTC_PATH = "/api/wolf/live/webrtc";

const SESSION_PATH = /^\/live\/test\/whep\/[A-Za-z0-9_-]+$/;

export function resolveWhepUrl(envValue: string | undefined): string {
  const trimmed = envValue?.trim();
  if (!trimmed) return PROPOSED_WHEP_URL;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("WOLF_WHEP_URL is not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("WOLF_WHEP_URL must use https.");
  }
  if (url.username || url.password) {
    throw new Error("WOLF_WHEP_URL must not include credentials.");
  }
  return url.toString();
}

/** Keep a MediaMTX WHEP session path. Reject anything else. */
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
