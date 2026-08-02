import type { NextRequest, NextResponse } from "next/server";

import { platformSessionCookieDomain, resolveUnit311CookieHost } from "@/lib/app-domains";
import {
  PLATFORM_SESSION_COOKIE,
  PLATFORM_SESSION_MAX_AGE_SECONDS,
} from "@/lib/platform-session-token";

export { PLATFORM_SESSION_COOKIE, PLATFORM_SESSION_MAX_AGE_SECONDS };

/**
 * Set after an explicit /portals login — required to enter the briefing page.
 * Name bumped from `abhi_portals_gate` so stale 7-day gates cannot skip login.
 */
export const ABHI_PORTALS_GATE_COOKIE = "abhi_portals_access";
const ABHI_PORTALS_GATE_COOKIE_LEGACY = "abhi_portals_gate";

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

/** Portals gate is browser-session scoped — closing the browser requires login again. */
export function getAbhiPortalsGateCookieOptions(request?: NextRequest | Request) {
  const { maxAge: _maxAge, ...options } = getPlatformSessionCookieOptions(request);
  return options;
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
  response.cookies.set(
    ABHI_PORTALS_GATE_COOKIE,
    "1",
    getAbhiPortalsGateCookieOptions(request),
  );
}

export function clearAbhiPortalsGateCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  const options = getPlatformSessionCookieOptions(request);
  const secure =
    Boolean(options.secure) ||
    (typeof process !== "undefined" && process.env.NODE_ENV === "production");
  const expired = {
    ...options,
    secure,
    maxAge: 0,
    expires: new Date(0),
  };
  response.cookies.set(ABHI_PORTALS_GATE_COOKIE, "", expired);
  // Drop legacy long-lived gates from earlier builds.
  response.cookies.set(ABHI_PORTALS_GATE_COOKIE_LEGACY, "", expired);
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
