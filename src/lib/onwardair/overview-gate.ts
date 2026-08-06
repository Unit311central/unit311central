import type { NextRequest } from "next/server";

import {
  OA_OVERVIEW_ENTRY_COOKIE,
  OA_OVERVIEW_VIEW_COOKIE,
} from "@/lib/platform-session-cookie";

/** Address-bar / bookmark opens must complete the login form even with a valid JWT. */
export function isFreshOverviewDocumentNavigation(request: NextRequest): boolean {
  const fetchMode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  const fetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
  const isDocumentNav = fetchMode === "navigate" || fetchMode === "";
  return isDocumentNav && (fetchSite === "none" || fetchSite === "cross-site");
}

export function readOverviewGateCookies(request: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } }) {
  const entry = request.cookies.get(OA_OVERVIEW_ENTRY_COOKIE)?.value === "1";
  const view = request.cookies.get(OA_OVERVIEW_VIEW_COOKIE)?.value === "1";
  return { entry, view };
}

export function isOverviewPortalAccessAllowed(
  request: NextRequest | { cookies: { get: (name: string) => { value?: string } | undefined } },
  options?: { isFreshEntry?: boolean },
): boolean {
  const { entry, view } = readOverviewGateCookies(request);
  const isFresh =
    options?.isFreshEntry ??
    ("headers" in request ? isFreshOverviewDocumentNavigation(request) : false);
  return isFresh ? entry : entry || view;
}
