import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { isMamHost } from "@/lib/mam/mam-surface";
import {
  MAM_CASA_IMAGE,
  MAM_HERO_IMAGE,
  MAM_HERO_VIDEO,
  MAM_MANUFACTURING_HERO_IMAGE,
  MAM_PROCESS_IMAGE,
  MAM_WEBSITE_LOGO_SRC,
  MAM_WEBSITE_CANONICAL_ORIGIN,
  MAM_WEBSITE_HOSTS,
  mamWebsiteImplPath,
  isMamPublicWebsitePath,
  isMamWebsiteHost,
} from "@/lib/mam/mam-website";

const MAM_IMAGE_PATHS = [
  MAM_HERO_IMAGE,
  MAM_MANUFACTURING_HERO_IMAGE,
  MAM_PROCESS_IMAGE,
  MAM_CASA_IMAGE,
  MAM_WEBSITE_LOGO_SRC,
] as const;

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

test("draft public hostname and canonical origin", () => {
  assert.equal(MAM_WEBSITE_CANONICAL_ORIGIN, "https://mam-ma.vercel.app");
  assert.ok(isMamWebsiteHost("mam-ma.vercel.app"));
  assert.equal(isMamWebsiteHost("mam.vercel.app"), false);
  assert.equal(isMamWebsiteHost("mam.ma"), false);
});

test("mam marketing image assets exist in public/", () => {
  for (const webPath of MAM_IMAGE_PATHS) {
    assert.match(webPath, /^\/images\/mam\//);
    assert.ok(!webPath.startsWith("http"), `${webPath} must be a local path`);
    const diskPath = join(process.cwd(), "public", webPath.replace(/^\//, ""));
    assert.ok(existsSync(diskPath), `missing ${diskPath}`);
  }
});

test("mam hero background video exists in public/", () => {
  const diskPath = join(process.cwd(), "public", MAM_HERO_VIDEO.replace(/^\//, ""));
  assert.ok(existsSync(diskPath), `missing ${diskPath}`);
});

console.log("ok  mam-website checks passed\n");
