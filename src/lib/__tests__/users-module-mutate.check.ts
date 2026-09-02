/**
 * Customer workspace Users module — edit/delete/password-reset tenancy.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routePath = path.join(process.cwd(), "src/app/api/users/[id]/route.ts");
const route = fs.readFileSync(routePath, "utf8");
const servicePath = path.join(process.cwd(), "src/lib/workspace-tenant-users-service.ts");
const service = fs.readFileSync(servicePath, "utf8");

assert.match(
  route,
  /requireUsersModuleAdministratorSession\(\)/,
  "PATCH/DELETE/POST /api/users/[id] must gate with requireUsersModuleAdministratorSession()",
);

assert.match(
  route,
  /isWorkspaceTenantAdministratorSurface\(auth\.workspace\.slug\)[\s\S]*updateWorkspaceTenantUser\(/,
  "PATCH must route customer workspaces to updateWorkspaceTenantUser",
);

assert.match(
  route,
  /isWorkspaceTenantAdministratorSurface\(auth\.workspace\.slug\)[\s\S]*removeWorkspaceTenantUser\(/,
  "DELETE must route customer workspaces to removeWorkspaceTenantUser",
);

assert.match(
  route,
  /isWorkspaceTenantAdministratorSurface\(auth\.workspace\.slug\)[\s\S]*setWorkspaceTenantUserPassword\(/,
  "POST password actions must route customer workspaces to setWorkspaceTenantUserPassword",
);

assert.match(
  route,
  /requireInternalAdministratorWorkspaceSession\(\)[\s\S]*updateInternalOperator\(/,
  "Internal workspaces must still use updateInternalOperator",
);

assert.match(
  route,
  /requireInternalAdministratorWorkspaceSession\(\)[\s\S]*deleteInternalOperator\(/,
  "Internal workspaces must still use deleteInternalOperator",
);

assert.match(
  service,
  /loadWorkspaceTenantUserContext/,
  "tenant user mutations must load workspace membership context",
);

assert.match(
  service,
  /\.eq\("workspace_id", workspaceId\)/,
  "tenant user mutations must scope platform_users by workspace_id",
);

assert.match(
  service,
  /WorkspaceTenantUserError\("User not found in this workspace\.", 404\)/,
  "cross-workspace user ids must return 404",
);

assert.match(
  service,
  /The workspace owner cannot be removed/,
  "workspace owner must be protected from deletion",
);

assert.match(
  service,
  /The workspace owner cannot be deactivated/,
  "workspace owner must be protected from deactivation",
);

console.log("ok  users-module-mutate checks passed\n");
