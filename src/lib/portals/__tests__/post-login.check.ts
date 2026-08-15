import assert from "node:assert/strict";

import {
  resolveAnyPortalPostLoginUrl,
  resolveAnyPortalSessionRedirect,
  resolvePortalSessionRedirect,
} from "@/lib/portals/post-login";

const abhiSession = resolvePortalSessionRedirect({
  workspaceSlug: "abhi",
  redirectPath: "/centrak",
  nextRaw: null,
  username: "demo@centrak.com",
});
assert.equal(abhiSession, "/centrak");

const talantonSession = resolvePortalSessionRedirect({
  workspaceSlug: "talantonimpact",
  redirectPath: "/ethicalapparelafrica",
  nextRaw: "/ethicalapparelafrica/reports",
  username: "demo@ethicalapparelafrica.com",
});
assert.equal(talantonSession, "/ethicalapparelafrica");

const onwardSession = resolvePortalSessionRedirect({
  workspaceSlug: "onwardair",
  redirectPath: "/overview",
  nextRaw: "/overview",
  username: "overview@onwardair.tech",
});
assert.equal(onwardSession, "/overview");

const anySession = resolveAnyPortalSessionRedirect({
  redirectPath: "/board",
  nextRaw: null,
  username: "board@abhi.org.uk",
});
assert.equal(anySession, "/board");

const postLogin = resolveAnyPortalPostLoginUrl({
  redirectPath: "/centrak",
  nextRaw: null,
  username: "demo@centrak.com",
});
assert.ok(postLogin?.includes("abhi.unit311central.com/centrak"));

const internalDashboard = resolveAnyPortalPostLoginUrl({
  redirectPath: "/dashboard",
  nextRaw: null,
  username: "not-a-portal-user@example.com",
});
assert.equal(internalDashboard, null);

console.log("portals/post-login.check.ts: all assertions passed");
