import assert from "node:assert/strict";

import {
  canonicalizePortalRedirect,
  isPortalWorkspaceSlug,
  matchPortalPathnameForSlug,
  portalImplBaseForSlug,
} from "@/lib/portals/middleware-edge";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

assert.equal(isPortalWorkspaceSlug("wolf"), true);
assert.equal(isPortalWorkspaceSlug(WOLF_CENTRAL_SLUG), true);
assert.equal(isPortalWorkspaceSlug("unit311"), false);

assert.equal(portalImplBaseForSlug("wolf"), "/wolf-client-portal");
assert.equal(portalImplBaseForSlug(WOLF_CENTRAL_SLUG), "/wolf-client-portal");

const pailexRoot = matchPortalPathnameForSlug("wolf", "/pailex");
assert.ok(pailexRoot);
assert.equal(pailexRoot?.route.path, "pailex");
assert.equal(pailexRoot?.rest, "");

const pailexLogin = matchPortalPathnameForSlug("wolf", "/pailex/login");
assert.ok(pailexLogin);
assert.equal(pailexLogin?.route.path, "pailex");
assert.equal(pailexLogin?.rest, "/login");

const pailexFiles = matchPortalPathnameForSlug("wolf", "/pailex/files");
assert.ok(pailexFiles);
assert.equal(pailexFiles?.route.path, "pailex");
assert.equal(pailexFiles?.rest, "/files");

assert.equal(canonicalizePortalRedirect("/pailex"), "/pailex");
assert.equal(canonicalizePortalRedirect("/pailex/files"), "/pailex");
assert.equal(canonicalizePortalRedirect("/dashboard"), null);

console.log("portals/middleware-edge-wolf.check.ts: all assertions passed");
