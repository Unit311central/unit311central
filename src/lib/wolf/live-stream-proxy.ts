/**
 * Same-origin pass-through for the existing WOLF Cloud HLS proxy.
 * The browser stays on WOLF Central. Upstream auth and CDN credentials
 * stay on wolf-aeris and are never read here.
 */

export const WOLF_CLOUD_HLS_PROXY_ORIGIN = "https://wolf-aeris.vercel.app";
export const WOLF_CLOUD_HLS_PROXY_PREFIX = "/api/live/stream";
export const WOLF_TEST_GROUND_HLS_PREFIX = "/api/wolf/live/stream";

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

export function wolfTestGroundPlaybackPath(): string {
  return `${WOLF_TEST_GROUND_HLS_PREFIX}/index.m3u8`;
}

export function wolfTestGroundUpstreamUrl(relativePath: string, search = ""): string | null {
  const parts = relativePath.split("/").filter(Boolean);
  if (
    !parts.length ||
    parts.some((part) => part === "." || part === ".." || !SAFE_SEGMENT.test(part))
  ) {
    return null;
  }
  return `${WOLF_CLOUD_HLS_PROXY_ORIGIN}${WOLF_CLOUD_HLS_PROXY_PREFIX}/${parts.join("/")}${search}`;
}

/** Point playlist entries at this app so the browser never calls RunPod or Vercel directly. */
export function rewriteWolfCloudPlaylist(body: string): string {
  return body.replaceAll(
    `${WOLF_CLOUD_HLS_PROXY_PREFIX}/`,
    `${WOLF_TEST_GROUND_HLS_PREFIX}/`,
  );
}
