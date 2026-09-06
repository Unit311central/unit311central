/**
 * WOLF Central post-login redirect regression checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-post-login.check.ts
 */
import assert from "node:assert/strict";

import {
  INTERNAL_SITE_URL,
  resolveBrowserRedirectPathForHost,
  workspacePostLoginUrl,
} from "@/lib/app-domains";
import { WOLF_CENTRAL_ORIGIN } from "@/lib/wolf/wolf-surface";

assert.equal(
  workspacePostLoginUrl("https://wolf-central.unit311central.com", "dashboard"),
  `${WOLF_CENTRAL_ORIGIN}/dashboard`,
);

assert.equal(
  workspacePostLoginUrl("https://wolf.unit311central.com", "dashboard"),
  `${WOLF_CENTRAL_ORIGIN}/dashboard`,
);

assert.equal(
  resolveBrowserRedirectPathForHost(
    INTERNAL_SITE_URL,
    "wolf.unit311central.com",
    { userType: "internal" },
  ),
  `${WOLF_CENTRAL_ORIGIN}/dashboard`,
);

assert.equal(
  resolveBrowserRedirectPathForHost(
    `${INTERNAL_SITE_URL}/`,
    "wolf.unit311central.com",
    { userType: "internal" },
  ),
  `${WOLF_CENTRAL_ORIGIN}/dashboard`,
);

assert.equal(
  resolveBrowserRedirectPathForHost("/dashboard", "wolf.unit311central.com", {
    userType: "internal",
  }),
  `${WOLF_CENTRAL_ORIGIN}/dashboard`,
);

console.log("wolf-post-login.check.ts — all assertions passed.");
