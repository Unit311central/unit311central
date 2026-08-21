/**
 * Demo / Internal auth return_to routing — regression guards for ops-shell login hand-offs.
 */
import assert from "node:assert/strict";

import {
  DEMO_SITE_URL,
  INTERNAL_SITE_URL,
  clampAbsolutePostLoginRedirect,
  opsShellLoginUrl,
  resolveBrowserRedirectPathForHost,
  resolveDemoPostLoginUrl,
  resolveValidatedLoginReturnOrigin,
  workspaceLoginUrl,
} from "@/lib/app-domains";

assert.equal(
  resolveValidatedLoginReturnOrigin("https://demo.unit311central.com"),
  DEMO_SITE_URL,
  "demo origin must validate",
);

assert.equal(
  opsShellLoginUrl("https://demo.unit311central.com"),
  `${DEMO_SITE_URL}/login`,
  "demo logout must land on demo login",
);

assert.equal(
  workspaceLoginUrl("https://demo.unit311central.com"),
  `${DEMO_SITE_URL}/login`,
  "workspaceLoginUrl must prefer demo on-host login",
);

assert.equal(
  workspaceLoginUrl("https://internal.unit311central.com"),
  `${INTERNAL_SITE_URL}/login`,
  "internal logout must stay on internal login",
);

assert.equal(
  resolveDemoPostLoginUrl({
    returnToRaw: "https://demo.unit311central.com",
    nextRaw: null,
    requestHost: "unit311central.com",
  }),
  `${DEMO_SITE_URL}/dashboard`,
  "demo return_to from apex must resolve to demo dashboard",
);

assert.equal(
  resolveDemoPostLoginUrl({
    returnToRaw: null,
    nextRaw: "/dashboard?view=sales-management&tab=pipeline",
    requestHost: "demo.unit311central.com",
  }),
  `${DEMO_SITE_URL}/dashboard?view=sales-management&tab=pipeline`,
  "demo host login must keep demo origin with deep link",
);

const clamped = clampAbsolutePostLoginRedirect(
  `${INTERNAL_SITE_URL}/dashboard`,
  "https://demo.unit311central.com",
);
assert.equal(
  clamped,
  `${DEMO_SITE_URL}/dashboard`,
  "demo context must not follow internal absolute redirect",
);

const internalLogin = resolveBrowserRedirectPathForHost("/dashboard", "unit311central.com", {
  userType: "internal",
});
assert.equal(
  internalLogin,
  `${INTERNAL_SITE_URL}/dashboard`,
  "apex internal login without demo return_to stays on internal",
);

const demoOpsLogin = resolveBrowserRedirectPathForHost("/dashboard", "unit311central.com", {
  userType: "internal",
  opsOrigin: DEMO_SITE_URL,
});
assert.equal(
  demoOpsLogin,
  `${DEMO_SITE_URL}/dashboard`,
  "explicit demo opsOrigin must override internal default",
);

console.log("ok  demo-auth-return-to checks passed\n");
