import assert from "node:assert/strict";

import { ABHI_MEMBER_PORTAL_ROUTES } from "@/lib/abhi/member-portal-routes";
import { ONWARDAIR_CLIENT_PORTAL_ROUTES } from "@/lib/onwardair/client-portal-routes";
import { TALANTON_COMPANY_PORTAL_ROUTES } from "@/lib/talanton/company-portal-routes";
import {
  canonicalizePortalRedirect,
  getPortalPackBySlug,
  isPortalWorkspaceSlug,
  isPortalsBriefingAllowedUsername,
  listPortalWorkspacePacks,
  matchPortalPathnameForSlug,
  portalImplBaseForSlug,
} from "@/lib/portals/registry";
import { abhiPortalPack } from "@/lib/portals/workspace-packs/abhi";
import { onwardAirPortalPack } from "@/lib/portals/workspace-packs/onwardair";
import { talantonPortalPack } from "@/lib/portals/workspace-packs/talanton";

assert.equal(listPortalWorkspacePacks().length, 3);

assert.equal(getPortalPackBySlug("abhi")?.slug, "abhi");
assert.equal(getPortalPackBySlug("onward")?.slug, "onwardair");
assert.equal(getPortalPackBySlug("talanton")?.slug, "talantonimpact");

assert.equal(isPortalWorkspaceSlug("unit311"), false);
assert.equal(isPortalWorkspaceSlug("demo"), false);
assert.equal(isPortalWorkspaceSlug("abhi"), true);
assert.equal(isPortalWorkspaceSlug("onwardair"), true);
assert.equal(isPortalWorkspaceSlug("talantonimpact"), true);

assert.equal(portalImplBaseForSlug("abhi"), "/member-portal");
assert.equal(portalImplBaseForSlug("onwardair"), "/client-portal");
assert.equal(portalImplBaseForSlug("talantonimpact"), "/portfolio-portal");

const abhiCentrak = matchPortalPathnameForSlug("abhi", "/centrak/funding");
assert.ok(abhiCentrak);
assert.equal(abhiCentrak?.route.path, "centrak");
assert.equal(abhiCentrak?.rest, "/funding");

const oaOverview = matchPortalPathnameForSlug("onwardair", "/overview");
assert.ok(oaOverview);
assert.equal(oaOverview?.route.portalKind, "overview");

assert.equal(canonicalizePortalRedirect("/centrak"), "/centrak");
assert.equal(canonicalizePortalRedirect("/ethicalapparelafrica"), "/ethicalapparelafrica");
assert.equal(canonicalizePortalRedirect("/dashboard"), null);

assert.equal(abhiPortalPack.routes.length, ABHI_MEMBER_PORTAL_ROUTES.length);
assert.equal(onwardAirPortalPack.routes.length, ONWARDAIR_CLIENT_PORTAL_ROUTES.length);
assert.equal(talantonPortalPack.routes.length, TALANTON_COMPANY_PORTAL_ROUTES.length);

assert.equal(abhiPortalPack.accessPolicy.externalOnly, true);
assert.equal(abhiPortalPack.accessPolicy.allowStaffPreview, false);
assert.equal(talantonPortalPack.accessPolicy.allowStaffPreview, true);

assert.equal(isPortalsBriefingAllowedUsername("demo@abhi.org.uk", "abhi"), true);
assert.equal(isPortalsBriefingAllowedUsername("demo@abhi.org.uk", "onwardair"), false);

console.log("portals/registry.check.ts: all assertions passed");
