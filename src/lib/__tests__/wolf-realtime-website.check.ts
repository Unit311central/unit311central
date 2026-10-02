import assert from "node:assert/strict";
import test from "node:test";

import { RESERVED_UNIT311_SUBDOMAINS, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import {
  WOLF_REALTIME_WEBSITE_HOST,
  WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN,
  WOLF_REALTIME_WEBSITE_URL,
  isWolfRealtimeWebsiteHost,
  wolfRealtimeWebsiteImplPath,
} from "@/lib/wolf-realtime-website-surface";

test("wolf-website is reserved and not a workspace slug", () => {
  assert.ok(RESERVED_UNIT311_SUBDOMAINS.has("wolf-website"));
  assert.equal(parseClientPlatformSubdomainSafe(WOLF_REALTIME_WEBSITE_HOST), null);
});

test("wolf realtime website host detection", () => {
  assert.ok(isWolfRealtimeWebsiteHost(WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN));
  assert.ok(isWolfRealtimeWebsiteHost(`www.${WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN}`));
  assert.ok(isWolfRealtimeWebsiteHost(WOLF_REALTIME_WEBSITE_HOST));
  assert.ok(isWolfRealtimeWebsiteHost("wolfrealtime.localhost"));
  assert.equal(isWolfRealtimeWebsiteHost("wolf.unit311central.com"), false);
  assert.equal(isWolfRealtimeWebsiteHost("unit311central.com"), false);
});

test("wolf realtime website impl paths", () => {
  assert.equal(wolfRealtimeWebsiteImplPath("/"), "/sites/wolf-realtime");
  assert.equal(wolfRealtimeWebsiteImplPath("/about"), "/sites/wolf-realtime");
});

test("production website URL", () => {
  assert.equal(WOLF_REALTIME_WEBSITE_URL, `https://${WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN}`);
});

console.log("wolf-realtime-website.check.ts — all assertions passed.");
