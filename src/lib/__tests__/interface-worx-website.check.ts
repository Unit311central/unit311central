import assert from "node:assert/strict";
import test from "node:test";

import { RESERVED_UNIT311_SUBDOMAINS, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import {
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
  assert.ok(isInterfaceWorxWebsiteHost("iw-website.localhost"));
  assert.equal(isInterfaceWorxWebsiteHost("interfaceworx.unit311central.com"), false);
});

test("interface worx website impl paths", () => {
  assert.equal(interfaceWorxWebsiteImplPath("/"), "/sites/interface-worx");
  assert.equal(interfaceWorxWebsiteImplPath("/about"), "/sites/interface-worx/about");
  assert.equal(interfaceWorxWebsiteImplPath("/contact"), "/sites/interface-worx/contact");
});

test("draft website URL uses iw-website host", () => {
  assert.equal(INTERFACE_WORX_WEBSITE_URL, `https://${INTERFACE_WORX_WEBSITE_HOST}`);
});
