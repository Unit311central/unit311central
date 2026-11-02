/**
 * Same-origin HLS proxy for WOLF Test Ground.
 * The browser stays on WOLF Central. MediaMTX is reached only from the server.
 */

export const WOLF_HLS_UPSTREAM_URL =
  "https://4s4dzedw76v0re-8888.proxy.runpod.net/live/test/index.m3u8";

export const WOLF_TEST_GROUND_HLS_PREFIX = "/api/live/stream";

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;
const MEDIA_FILE = /\.(m3u8|mp4|m4s|ts)$/i;

export function wolfTestGroundPlaybackPath(): string {
  return `${WOLF_TEST_GROUND_HLS_PREFIX}/index.m3u8`;
}

export function getWolfHlsUpstreamUrl(): string {
  const configured = process.env["WOLF_LIVE_STREAM_URL"];
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim();
  }
  return WOLF_HLS_UPSTREAM_URL;
}

export function wolfTestGroundUpstreamUrl(relativePath: string, search = ""): URL | null {
  const parts = relativePath.split("/").filter(Boolean);
  if (
    !parts.length ||
    parts.some((part) => part === "." || part === ".." || !SAFE_SEGMENT.test(part)) ||
    !MEDIA_FILE.test(parts[parts.length - 1] ?? "")
  ) {
    return null;
  }
  const manifest = new URL(getWolfHlsUpstreamUrl());
  const dir = manifest.pathname.replace(/[^/]+$/, "");
  const target = new URL(`${parts.join("/")}${search}`, `${manifest.origin}${dir}`);
  if (target.origin !== manifest.origin) return null;
  if (!target.pathname.startsWith(dir)) return null;
  return target;
}

function manifestDirectory(upstreamManifestUrl: string): URL {
  const manifest = new URL(upstreamManifestUrl);
  const dir = manifest.pathname.replace(/[^/]+$/, "");
  return new URL(dir, manifest.origin);
}

function proxyResource(raw: string, upstreamManifestUrl: string, proxyPrefix: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith(`${proxyPrefix}/`)) return trimmed;
  let absolute: URL;
  try {
    absolute = new URL(trimmed, manifestDirectory(upstreamManifestUrl));
  } catch {
    return trimmed;
  }
  const manifest = new URL(upstreamManifestUrl);
  const dir = manifest.pathname.replace(/[^/]+$/, "");
  if (absolute.origin !== manifest.origin || !absolute.pathname.startsWith(dir)) return trimmed;
  const relative = absolute.pathname.slice(dir.length);
  if (!relative || relative.split("/").some((part) => part === "." || part === "..")) return trimmed;
  const encoded = relative
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${proxyPrefix}/${encoded}${absolute.search}`;
}

/** Point playlist entries at this app so the browser never calls RunPod. */
export function rewriteWolfHlsPlaylist(
  body: string,
  upstreamManifestUrl = getWolfHlsUpstreamUrl(),
  proxyPrefix = WOLF_TEST_GROUND_HLS_PREFIX,
): string {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          return `URI="${proxyResource(uri, upstreamManifestUrl, proxyPrefix)}"`;
        });
      }
      return proxyResource(trimmed, upstreamManifestUrl, proxyPrefix);
    })
    .join("\n");
}
