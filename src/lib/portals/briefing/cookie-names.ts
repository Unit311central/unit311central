import type { NextRequest } from "next/server";

/** One-time entry ticket after explicit portals briefing login. */
export const PORTALS_BRIEFING_GATE_COOKIE = "portals_briefing_entry";

/** Short-lived tab cookie after entry ticket is consumed. */
export const PORTALS_BRIEFING_VIEW_COOKIE = "portals_briefing_view";

/** @deprecated Use PORTALS_BRIEFING_GATE_COOKIE */
export const ABHI_PORTALS_GATE_COOKIE = PORTALS_BRIEFING_GATE_COOKIE;

/** @deprecated Use PORTALS_BRIEFING_VIEW_COOKIE */
export const ABHI_PORTALS_VIEW_COOKIE = PORTALS_BRIEFING_VIEW_COOKIE;

const LEGACY_GATE_COOKIES = [
  "abhi_portals_entry",
  "abhi_portals_gate",
  "abhi_portals_access",
] as const;

const LEGACY_VIEW_COOKIES = ["abhi_portals_view"] as const;

export function readPortalsBriefingGateCookie(request: NextRequest): boolean {
  const jar = request.cookies;
  if (jar.get(PORTALS_BRIEFING_GATE_COOKIE)?.value === "1") return true;
  for (const legacy of LEGACY_GATE_COOKIES) {
    if (jar.get(legacy)?.value === "1") return true;
  }
  return false;
}

export function readPortalsBriefingViewCookie(request: NextRequest): boolean {
  const jar = request.cookies;
  if (jar.get(PORTALS_BRIEFING_VIEW_COOKIE)?.value === "1") return true;
  for (const legacy of LEGACY_VIEW_COOKIES) {
    if (jar.get(legacy)?.value === "1") return true;
  }
  return false;
}
