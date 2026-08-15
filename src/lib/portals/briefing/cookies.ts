import type { NextRequest, NextResponse } from "next/server";

import {
  PORTALS_BRIEFING_GATE_COOKIE,
  PORTALS_BRIEFING_VIEW_COOKIE,
} from "@/lib/portals/briefing/cookie-names";
import {
  getAbhiPortalsGateCookieOptions,
  getAbhiPortalsViewCookieOptions,
  getPlatformSessionCookieOptions,
} from "@/lib/platform-session-cookie";

export {
  PORTALS_BRIEFING_GATE_COOKIE,
  PORTALS_BRIEFING_VIEW_COOKIE,
  ABHI_PORTALS_GATE_COOKIE,
  ABHI_PORTALS_VIEW_COOKIE,
  readPortalsBriefingGateCookie,
  readPortalsBriefingViewCookie,
} from "@/lib/portals/briefing/cookie-names";

export function applyPortalsBriefingGateCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  response.cookies.set(
    PORTALS_BRIEFING_GATE_COOKIE,
    "1",
    getAbhiPortalsGateCookieOptions(request),
  );
}

export function applyPortalsBriefingViewCookie(
  response: NextResponse,
  request?: NextRequest | Request,
) {
  response.cookies.set(
    PORTALS_BRIEFING_VIEW_COOKIE,
    "1",
    getAbhiPortalsViewCookieOptions(request),
  );
}

export function clearPortalsBriefingCookies(
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

  response.cookies.set(PORTALS_BRIEFING_GATE_COOKIE, "", expired);
  response.cookies.set(PORTALS_BRIEFING_VIEW_COOKIE, "", expired);
  for (const legacy of ["abhi_portals_entry", "abhi_portals_gate", "abhi_portals_access"]) {
    response.cookies.set(legacy, "", expired);
  }
  response.cookies.set("abhi_portals_view", "", expired);
}
