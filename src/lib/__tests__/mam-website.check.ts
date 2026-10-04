import assert from "node:assert/strict";
import test from "node:test";

import { parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { isMamHost } from "@/lib/mam/mam-surface";
import {
  MAM_WEBSITE_CANONICAL_ORIGIN,
  MAM_WEBSITE_HOSTS,
  mamWebsiteImplPath,
  isMamPublicWebsitePath,
  isMamWebsiteHost,
} from "@/lib/mam/mam-website";

test("mam workspace host is not the public marketing website", () => {
  assert.ok(isMamHost("mam.unit311central.com"));
  assert.equal(isMamWebsiteHost("mam.unit311central.com"), false);
  assert.equal(parseClientPlatformSubdomainSafe("mam.unit311central.com"), "mam");
});

test("mam public website host detection", () => {
  for (const host of MAM_WEBSITE_HOSTS) {
    assert.ok(isMamWebsiteHost(host), `${host} must be MAM website`);
    assert.equal(parseClientPlatformSubdomainSafe(host), null, `${host} must not be workspace slug`);
  }
  assert.equal(isMamWebsiteHost("unit311central.com"), false);
  assert.equal(isMamWebsiteHost("mam.unit311central.com"), false);
});

test("mam website impl paths", () => {
  assert.equal(mamWebsiteImplPath("/"), "/sites/mam");
  assert.equal(mamWebsiteImplPath("/manufacturing"), "/sites/mam/manufacturing");
  assert.equal(mamWebsiteImplPath("/capabilities"), "/sites/mam/capabilities");
  assert.equal(mamWebsiteImplPath("/industries"), "/sites/mam/industries");
  assert.equal(mamWebsiteImplPath("/about"), "/sites/mam/about");
  assert.equal(mamWebsiteImplPath("/contact"), "/sites/mam/contact");
});

test("mam public paths allowlist", () => {
  assert.ok(isMamPublicWebsitePath("/"));
  assert.ok(isMamPublicWebsitePath("/contact"));
  assert.equal(isMamPublicWebsitePath("/login"), false);
});

test("canonical origin is configured", () => {
  assert.equal(MAM_WEBSITE_CANONICAL_ORIGIN, "https://mam.vercel.app");
});

console.log("ok  mam-website checks passed\n");
