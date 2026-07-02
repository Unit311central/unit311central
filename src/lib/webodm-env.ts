const DEV_WEBODM_URL = "http://localhost:8000";

function normalizeWebODMUrl(url: string | undefined) {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/$/, "");
}

function devWebODMUrlFallback() {
  return process.env.NODE_ENV === "development" ? DEV_WEBODM_URL : "";
}

/** Server-side WebODM API base URL (`WEBODM_URL`). */
export function getServerWebODMUrl() {
  return normalizeWebODMUrl(process.env.WEBODM_URL) || devWebODMUrlFallback();
}

/** Client-facing WebODM dashboard URL (`NEXT_PUBLIC_WEBODM_URL`). */
export function getPublicWebODMUrl() {
  return normalizeWebODMUrl(process.env.NEXT_PUBLIC_WEBODM_URL) || devWebODMUrlFallback();
}

export function isWebODMCredentialsConfigured() {
  return Boolean(process.env.WEBODM_USERNAME && process.env.WEBODM_PASSWORD);
}

export function isWebODMServerConfigured() {
  return Boolean(getServerWebODMUrl()) && isWebODMCredentialsConfigured();
}
