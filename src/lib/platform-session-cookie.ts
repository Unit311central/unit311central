import type { NextRequest, NextResponse } from "next/server";

import { platformSessionCookieDomain, resolveUnit311CookieHost } from "@/lib/app-domains";
import {
  PLATFORM_SESSION_COOKIE,
  PLATFORM_SESSION_MAX_AGE_SECONDS,
} from "@/lib/platform-session-token";

export { PLATFORM_SESSION_COOKIE, PLATFORM_SESSION_MAX_AGE_SECONDS };

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
