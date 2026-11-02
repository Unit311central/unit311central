/**
 * Server-side MediaMTX HLS fetch for WOLF Test Ground.
 * The bearer secret is read only here and is never returned to the browser.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function readServerEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function getWolfHlsCdnSecret(): string | null {
  return readServerEnv("WOLF_HLS_CDN_SECRET");
}

export function refererForManifest(upstreamManifestUrl: string): string {
  const manifest = new URL(upstreamManifestUrl);
  const dir = manifest.pathname.replace(/[^/]+$/, "");
  return `${manifest.origin}${dir}`;
}

function mergeCookies(existing: string[], setCookieHeaders: string[]): string[] {
  const map = new Map<string, string>();
  for (const pair of existing) {
    const [name] = pair.split("=");
    if (name) map.set(name.trim(), pair);
  }
  for (const header of setCookieHeaders) {
    const pair = header.split(";")[0]?.trim();
    if (!pair) continue;
    const [name] = pair.split("=");
    if (name) map.set(name.trim(), pair);
  }
  return [...map.values()];
}

export async function fetchWolfHlsResource(
  target: URL,
  upstreamManifestUrl: string,
  secret: string,
): Promise<Response> {
  const referer = refererForManifest(upstreamManifestUrl);
  const authorization = `Bearer ${secret}`;
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const jar: string[] = [];
    lastResponse = await fetchWithJar(target.href, jar, referer, authorization);
    if (lastResponse.ok || lastResponse.status === 401 || lastResponse.status === 404) {
      return lastResponse;
    }
  }
  return lastResponse ?? new Response("Upstream stream unreachable", { status: 502 });
}

async function fetchWithJar(
  url: string,
  jar: string[],
  referer: string,
  authorization: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "*/*",
    "User-Agent": USER_AGENT,
    Referer: referer,
    Authorization: authorization,
    "Cache-Control": "no-cache",
  };
  if (jar.length) headers.Cookie = jar.join("; ");

  let response = await fetch(url, { redirect: "manual", headers, cache: "no-store" });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) {
    const merged = mergeCookies(jar, setCookies);
    jar.length = 0;
    jar.push(...merged);
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) return response;
    const next = location.startsWith("http") ? location : new URL(location, url).href;
    return fetchWithJar(next, jar, referer, authorization);
  }

  return response;
}
