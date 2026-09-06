/**
 * Preview-only WOLF Central tenancy helpers.
 * Scoped strictly to Vercel Preview — production wolf.unit311central.com is unchanged.
 */

import { normalizeHost } from "@/lib/app-domains";
import { parseWorkspaceSlugFromPathname } from "@/lib/workspace-host";

const WOLF_CENTRAL_SLUG = "wolf-central";
const WOLF_CENTRAL_HOST_ALIAS = "wolf";

function canonicalizeWolfCentralPreviewSlug(slug: string | null | undefined): string | null {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (normalized === WOLF_CENTRAL_SLUG || normalized === WOLF_CENTRAL_HOST_ALIAS) {
    return WOLF_CENTRAL_SLUG;
  }
  return null;
}

export const WOLF_CENTRAL_PREVIEW_ENTRY_PATH = `/ws/${WOLF_CENTRAL_SLUG}`;

/** True only on Vercel Preview deployments. */
export function isVercelPreviewEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function isVercelPreviewHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  return normalized.endsWith(".vercel.app");
}

function normalizePreviewPathname(pathname: string | null | undefined): string {
  const raw = String(pathname ?? "").trim();
  if (!raw || raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

/** `/ws/wolf-central` or `/ws/wolf` (and subpaths) on Preview. */
export function isWolfCentralPreviewPathname(pathname: string | null | undefined): boolean {
  const normalized = normalizePreviewPathname(pathname);
  if (!normalized.startsWith("/ws/")) return false;
  const slug = parseWorkspaceSlugFromPathname(normalized.split("?")[0] ?? normalized);
  return canonicalizeWolfCentralPreviewSlug(slug) === WOLF_CENTRAL_SLUG;
}

export function isWolfCentralPreviewSurface(
  host: string | null | undefined,
  pathname: string | null | undefined,
): boolean {
  if (!isVercelPreviewEnvironment()) return false;
  if (!isVercelPreviewHost(host)) return false;
  return isWolfCentralPreviewPathname(pathname);
}

/**
 * Allowlist Preview post-login return targets to the current Preview origin
 * when the path is the WOLF Central entry route.
 */
export function parseWolfCentralPreviewLoginReturnTo(
  value: string | null | undefined,
  expectedOrigin: string | null | undefined,
): string | null {
  if (!value?.trim() || !expectedOrigin?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const expected = new URL(expectedOrigin.trim());
    if (url.origin !== expected.origin) return null;
    if (!isVercelPreviewHost(url.host)) return null;
    if (!isWolfCentralPreviewPathname(url.pathname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function wolfCentralPreviewLoginReturnTo(
  previewOrigin: string,
  nextPath?: string | null,
): string {
  const origin = previewOrigin.replace(/\/$/, "");
  const base = `${origin}${WOLF_CENTRAL_PREVIEW_ENTRY_PATH}`;
  if (!nextPath?.trim()) return base;
  const url = new URL(base);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

/** Map public Preview WOLF paths onto internaldashboard implementation paths. */
export function mapWolfCentralPreviewPathToInternal(pathname: string): string {
  const normalized = normalizePreviewPathname(pathname);
  const prefix = WOLF_CENTRAL_PREVIEW_ENTRY_PATH;
  if (normalized === prefix) return "/internaldashboard";
  if (normalized.startsWith(`${prefix}/`)) {
    const rest = normalized.slice(prefix.length);
    if (rest === "/dashboard" || rest.startsWith("/dashboard/")) {
      return `/internaldashboard${rest.replace(/^\/dashboard/, "") || ""}`;
    }
    return `/internaldashboard${rest}`;
  }
  return "/internaldashboard";
}

export function isBrowserWolfCentralPreviewPath(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.hostname.endsWith(".vercel.app")) return false;
  return isWolfCentralPreviewPathname(window.location.pathname);
}
