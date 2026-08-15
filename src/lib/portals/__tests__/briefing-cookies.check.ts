import assert from "node:assert/strict";

import {
  PORTALS_BRIEFING_GATE_COOKIE,
  PORTALS_BRIEFING_VIEW_COOKIE,
  ABHI_PORTALS_GATE_COOKIE,
  ABHI_PORTALS_VIEW_COOKIE,
  readPortalsBriefingGateCookie,
  readPortalsBriefingViewCookie,
} from "@/lib/portals/briefing/cookie-names";
import { NextRequest } from "next/server";

function requestWithCookies(cookies: Record<string, string>) {
  const url = "https://abhi.unit311central.com/portals";
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

assert.equal(PORTALS_BRIEFING_GATE_COOKIE, "portals_briefing_entry");
assert.equal(PORTALS_BRIEFING_VIEW_COOKIE, "portals_briefing_view");

assert.equal(readPortalsBriefingGateCookie(requestWithCookies({})), false);
assert.equal(
  readPortalsBriefingGateCookie(
    requestWithCookies({ portals_briefing_entry: "1" }),
  ),
  true,
);
assert.equal(
  readPortalsBriefingGateCookie(
    requestWithCookies({ abhi_portals_entry: "1" }),
  ),
  true,
);
assert.equal(
  readPortalsBriefingGateCookie(
    requestWithCookies({ abhi_portals_gate: "1" }),
  ),
  true,
);

assert.equal(
  readPortalsBriefingViewCookie(
    requestWithCookies({ portals_briefing_view: "1" }),
  ),
  true,
);
assert.equal(
  readPortalsBriefingViewCookie(
    requestWithCookies({ abhi_portals_view: "1" }),
  ),
  true,
);

console.log("portals/briefing-cookies.check.ts: all assertions passed");
