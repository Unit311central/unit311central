import type { NextRequest } from "next/server";

import {
  OA_OVERVIEW_ENTRY_COOKIE,
  OA_OVERVIEW_VIEW_COOKIE,
} from "@/lib/platform-session-cookie";

/**
 * Flip to `true` only for Screenfly / responsive QA (no login).
 * Can also enable via env `OVERVIEW_PUBLIC_PREVIEW=1` when this flag is false.
 */
export const OVERVIEW_AUTH_BYPASS_FOR_PREVIEW = false;

export function isOverviewAuthBypassEnabled(): boolean {
  if (OVERVIEW_AUTH_BYPASS_FOR_PREVIEW) return true;
  const v = process.env.OVERVIEW_PUBLIC_PREVIEW?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Address-bar / bookmark opens must complete the login form even with a valid JWT. */
export function isFreshOverviewDocumentNavigation(request: NextRequest): boolean {
  const fetchMode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  const fetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
  const isDocumentNav = fetchMode === "navigate" || fetchMode === "";
  const hasFetchMetadata = Boolean(
    request.headers.get("sec-fetch-mode") || request.headers.get("sec-fetch-site"),
  );
  // Some browsers / edge requests omit Sec-Fetch-* — treat as a fresh open (strict invite gate).
  if (!hasFetchMetadata) return isDocumentNav;
  return isDocumentNav && (fetchSite === "none" || fetchSite === "cross-site");
}

export function isOverviewDocumentAccessAllowed(
  request: NextRequest,
): boolean {
  if (isOverviewAuthBypassEnabled()) return true;
  const { entry, view } = readOverviewGateCookies(request);
  if (isFreshOverviewDocumentNavigation(request)) return entry;
  return entry || view;
}

export function isOverviewApiAccessAllowed(
  request: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } },
): boolean {
  if (isOverviewAuthBypassEnabled()) return true;
  const { entry, view } = readOverviewGateCookies(request);
  return entry || view;
}

export function readOverviewGateCookies(request: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } }) {
  const entry = request.cookies.get(OA_OVERVIEW_ENTRY_COOKIE)?.value === "1";
  const view = request.cookies.get(OA_OVERVIEW_VIEW_COOKIE)?.value === "1";
  return { entry, view };
}

export function isOverviewPortalAccessAllowed(
  request: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } },
  options?: { isFreshEntry?: boolean; forDocument?: boolean },
): boolean {
  if ("headers" in request && options?.forDocument !== false) {
    if (options?.isFreshEntry != null) {
      const { entry, view } = readOverviewGateCookies(request);
      return options.isFreshEntry ? entry : entry || view;
    }
    return isOverviewDocumentAccessAllowed(request);
  }
  return isOverviewApiAccessAllowed(request);
}
