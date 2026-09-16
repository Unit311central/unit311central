/**
 * Talanton real admin — workspace-scoped Users module gate (not demo@).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  isWorkspaceTenantAdministratorSurface,
  usesWorkspaceTenantUserManagement,
} from "@/lib/customer-workspace-surface";
import {
  TALANTON_DEMO_PLATFORM_USERNAME,
  TALANTON_PORTALS_ADMIN_USERNAME,
} from "@/lib/talanton/portals-auth";

assert.equal(isWorkspaceTenantAdministratorSurface("talantonimpact"), false);
assert.equal(isWorkspaceTenantAdministratorSurface("interfaceworx"), true);

assert.equal(
  usesWorkspaceTenantUserManagement("talantonimpact", TALANTON_PORTALS_ADMIN_USERNAME),
  true,
);
assert.equal(
  usesWorkspaceTenantUserManagement("talantonimpact", TALANTON_DEMO_PLATFORM_USERNAME),
  false,
);
assert.equal(usesWorkspaceTenantUserManagement("talantonimpact"), false);
assert.equal(usesWorkspaceTenantUserManagement("interfaceworx", "owner@example.com"), true);

const authPath = path.join(process.cwd(), "src/lib/internal-admin-auth.ts");
const authSource = fs.readFileSync(authPath, "utf8");
assert.match(
  authSource,
  /usesWorkspaceTenantUserManagement\(workspace\.slug, session\.username\)/,
  "Users module auth must use usesWorkspaceTenantUserManagement with username",
);

const usersRoutePath = path.join(process.cwd(), "src/app/api/users/route.ts");
const usersRoute = fs.readFileSync(usersRoutePath, "utf8");
assert.doesNotMatch(
  usersRoute,
  /listTalantonTenantUsers/,
  "Talanton user list must come from workspace tenant DB APIs",
);
assert.match(
  usersRoute,
  /usesWorkspaceTenantUserManagement\(auth\.workspace\.slug, auth\.session\.username\)/,
  "GET/POST /api/users must route tenant workspaces via usesWorkspaceTenantUserManagement",
);

const entitlementsPath = path.join(process.cwd(), "src/lib/workspace-tenant-entitlements.ts");
const entitlementsSource = fs.readFileSync(entitlementsPath, "utf8");
assert.match(
  entitlementsSource,
  /usesWorkspaceTenantUserManagement\(workspace\.slug, input\.username\)/,
  "Tenant entitlements must include Talanton admin user management",
);

console.log("ok  talanton-user-management checks passed\n");
