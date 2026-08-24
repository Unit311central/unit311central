import assert from "node:assert/strict";
import test from "node:test";

import { RESERVED_UNIT311_SUBDOMAINS, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import {
  INTERFACE_WORX_PRODUCTION_DOMAIN,
  INTERFACE_WORX_SLUG,
  INTERFACE_WORX_WEBSITE_HOST,
  INTERFACE_WORX_WEBSITE_URL,
  interfaceWorxWebsiteImplPath,
  isInterfaceWorxSlug,
  isInterfaceWorxWebsiteHost,
} from "@/lib/interface-worx-surface";

test("iw-website is reserved and not a workspace slug", () => {
  assert.ok(RESERVED_UNIT311_SUBDOMAINS.has("iw-website"));
  assert.equal(parseClientPlatformSubdomainSafe(INTERFACE_WORX_WEBSITE_HOST), null);
});

test("interfaceworx remains a customer workspace slug", () => {
  assert.equal(parseClientPlatformSubdomainSafe("interfaceworx.unit311central.com"), "interfaceworx");
  assert.ok(isInterfaceWorxSlug(INTERFACE_WORX_SLUG));
});

test("interface worx website host detection", () => {
  assert.ok(isInterfaceWorxWebsiteHost(INTERFACE_WORX_WEBSITE_HOST));
  assert.ok(isInterfaceWorxWebsiteHost(INTERFACE_WORX_PRODUCTION_DOMAIN));
  assert.ok(isInterfaceWorxWebsiteHost("iw-website.localhost"));
  assert.ok(isInterfaceWorxWebsiteHost("interfaceworx.localhost"));
  assert.equal(isInterfaceWorxWebsiteHost("interfaceworx.unit311central.com"), false);
  assert.equal(isInterfaceWorxWebsiteHost("unit311central.com"), false);
  assert.equal(isInterfaceWorxWebsiteHost("www.interfaceworx.com"), false);
  assert.equal(isInterfaceWorxWebsiteHost("acme.unit311central.com"), false);
  assert.equal(isInterfaceWorxWebsiteHost("onwardair.unit311central.com"), false);
});

test("interface worx apex and draft hosts route to public website surface only", () => {
  const websiteHosts = [INTERFACE_WORX_PRODUCTION_DOMAIN, INTERFACE_WORX_WEBSITE_HOST];
  const nonWebsiteHosts = [
    "interfaceworx.unit311central.com",
    "unit311central.com",
    "internal.unit311central.com",
    "demo.unit311central.com",
    "acme.unit311central.com",
    "northstar.unit311central.com",
  ];

  for (const host of websiteHosts) {
    assert.ok(isInterfaceWorxWebsiteHost(host), `${host} must be Interface Worx website`);
    assert.equal(
      parseClientPlatformSubdomainSafe(host),
      null,
      `${host} must not be a workspace slug`,
    );
  }

  for (const host of nonWebsiteHosts) {
    assert.equal(
      isInterfaceWorxWebsiteHost(host),
      false,
      `${host} must not be Interface Worx website`,
    );
  }
});

test("interface worx website impl paths", () => {
  assert.equal(interfaceWorxWebsiteImplPath("/"), "/sites/interface-worx");
  assert.equal(interfaceWorxWebsiteImplPath("/about"), "/sites/interface-worx/about");
  assert.equal(interfaceWorxWebsiteImplPath("/contact"), "/sites/interface-worx/contact");
});

test("draft website URL uses iw-website host", () => {
  assert.equal(INTERFACE_WORX_WEBSITE_URL, `https://${INTERFACE_WORX_WEBSITE_HOST}`);
});
