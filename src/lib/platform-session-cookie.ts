import type { NextRequest, NextResponse } from "next/server";

import { platformSessionCookieDomain, resolveUnit311CookieHost } from "@/lib/app-domains";
import {
  PLATFORM_SESSION_COOKIE,
  PLATFORM_SESSION_MAX_AGE_SECONDS,
} from "@/lib/platform-session-token";

export { PLATFORM_SESSION_COOKIE, PLATFORM_SESSION_MAX_AGE_SECONDS };

import {
  PORTALS_BRIEFING_GATE_COOKIE,
  PORTALS_BRIEFING_VIEW_COOKIE,
} from "@/lib/portals/briefing/cookie-names";

/** @deprecated Use PORTALS_BRIEFING_GATE_COOKIE */
export const ABHI_PORTALS_GATE_COOKIE = PORTALS_BRIEFING_GATE_COOKIE;

/** @deprecated Use PORTALS_BRIEFING_VIEW_COOKIE */
export const ABHI_PORTALS_VIEW_COOKIE = PORTALS_BRIEFING_VIEW_COOKIE;

/**
 * One-time entry ticket set only by an explicit /overview login.
 * Prevents a leftover Domain=.unit311central.com JWT from skipping the invite login.
 */
export const OA_OVERVIEW_ENTRY_COOKIE = "oa_overview_entry";

/** Short-lived cookie that keeps an open /overview tab working after entry is consumed. */
export const OA_OVERVIEW_VIEW_COOKIE = "oa_overview_view";

/** View cookie lifetime — long enough for a demo, not a permanent skip-login pass. */
const ABHI_PORTALS_VIEW_MAX_AGE_SECONDS = 60 * 60 * 2;
const OA_OVERVIEW_VIEW_MAX_AGE_SECONDS = 60 * 60 * 2;

/** Shared session cookie options for apex ↔ internal.* (and future workspace hosts). */
export function getPlatformSessionCookieOptions(request?: NextRequest | Request) {
  const host = resolveUnit311CookieHost(request ?? null);
  const domain = platformSessionCookieDomain(host);

  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PLATFORM_SESSION_MAX_AGE_SECONDS,
    ...(domain ? { domain } : {}),
  };
}

/** Portals entry ticket is browser-session scoped. */
export function getAbhiPortalsGateCookieOptions(request?: NextRequest | Request) {
  const { maxAge: _maxAge, ...options } = getPlatformSessionCookieOptions(request);
  return options;
}

export function getAbhiPortalsViewCookieOptions(request?: NextRequest | Request) {
  return {
    ...getPlatformSessionCookieOptions(request),
    maxAge: ABHI_PORTALS_VIEW_MAX_AGE_SECONDS,
  };
}

export function getOverviewEntryGateCookieOptions(request?: NextRequest | Request) {
  const { maxAge: _maxAge, ...options } = getPlatformSessionCookieOptions(request);
  return options;
}

export function getOverviewViewCookieOptions(request?: NextRequest | Request) {
  return {
    ...getPlatformSessionCookieOptions(request),
    maxAge: OA_OVERVIEW_VIEW_MAX_AGE_SECONDS,
  };
}

/**
 * Set exactly one session Set-Cookie (shared Domain on unit311 hosts).
 * Do not emit a second clear/overwrite for the same cookie name — Next.js and
 * some proxies collapse same-name Set-Cookie headers and can drop the session.
 */
export function applyPlatformSessionCookie(
  response: NextResponse,
  token: string,
  request?: NextRequest | Request,
) {
  response.cookies.set(
    PLATFORM_SESSION_COOKIE,
    token,
    getPlatformSessionCookieOptions(request),
  );
}

export function applyAbhiPortalsGateCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  const { applyPortalsBriefingGateCookie } =
    require("@/lib/portals/briefing/cookies") as typeof import("@/lib/portals/briefing/cookies");
  applyPortalsBriefingGateCookie(response, request);
}

export function applyAbhiPortalsViewCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  const { applyPortalsBriefingViewCookie } =
    require("@/lib/portals/briefing/cookies") as typeof import("@/lib/portals/briefing/cookies");
  applyPortalsBriefingViewCookie(response, request);
}

function expiredCookieOptions(request?: NextRequest | Request) {
  const options = getPlatformSessionCookieOptions(request);
  const secure =
    Boolean(options.secure) ||
    (typeof process !== "undefined" && process.env.NODE_ENV === "production");
  return {
    ...options,
    secure,
    maxAge: 0,
    expires: new Date(0),
  };
}

export function clearAbhiPortalsGateCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  const { clearPortalsBriefingCookies } =
    require("@/lib/portals/briefing/cookies") as typeof import("@/lib/portals/briefing/cookies");
  clearPortalsBriefingCookies(response, request);
}

export function applyOverviewEntryGateCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  response.cookies.set(
    OA_OVERVIEW_ENTRY_COOKIE,
    "1",
    getOverviewEntryGateCookieOptions(request),
  );
}

export function applyOverviewViewCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  response.cookies.set(
    OA_OVERVIEW_VIEW_COOKIE,
    "1",
    getOverviewViewCookieOptions(request),
  );
}

export function clearOverviewGateCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  const expired = expiredCookieOptions(request);
  response.cookies.set(OA_OVERVIEW_ENTRY_COOKIE, "", expired);
  response.cookies.set(OA_OVERVIEW_VIEW_COOKIE, "", expired);
}

/** Clear the shared platform session cookie (logout). */
export function clearPlatformSessionCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  const options = getPlatformSessionCookieOptions(request);
  const secure =
    Boolean(options.secure) ||
    (typeof process !== "undefined" && process.env.NODE_ENV === "production");
  const expired = new Date(0).toUTCString();

  // Explicit Set-Cookie headers — reliable on middleware redirects (Vercel).
  // Clear both host-only and Domain=.unit311central.com variants; browsers
  // treat them as distinct cookies.
  const base = `${PLATFORM_SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=${expired}; HttpOnly; SameSite=Lax${
    secure ? "; Secure" : ""
  }`;
  response.headers.append("Set-Cookie", base);
  if (options.domain) {
    response.headers.append("Set-Cookie", `${base}; Domain=${options.domain}`);
  } else {
    // Fallback domain clear for unit311 family hosts when request host is missing.
    response.headers.append("Set-Cookie", `${base}; Domain=.unit311central.com`);
  }

  // Keep cookies API in sync for non-redirect responses.
  response.cookies.set(PLATFORM_SESSION_COOKIE, "", {
    ...options,
    secure,
    maxAge: 0,
    expires: new Date(0),
  });
}
