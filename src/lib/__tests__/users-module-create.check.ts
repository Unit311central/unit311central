/**
 * Central Users module — customer workspace create flow and Location field.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { mapUserRoleToWorkspaceRole } from "@/lib/workspace-tenant-users-service";

assert.equal(mapUserRoleToWorkspaceRole("Admin"), "admin");
assert.equal(mapUserRoleToWorkspaceRole("Manager"), "manager");
assert.equal(mapUserRoleToWorkspaceRole("Exec"), "exec");
assert.equal(mapUserRoleToWorkspaceRole("Board"), "board");
assert.equal(mapUserRoleToWorkspaceRole("Associate"), "member");

const apiRoute = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/users/route.ts"),
  "utf8",
);

assert.match(
  apiRoute,
  /requireUsersModuleAdministratorSession\(\)/,
  "POST /api/users must use requireUsersModuleAdministratorSession()",
);

assert.match(
  apiRoute,
  /createWorkspaceTenantUser\(/,
  "POST /api/users must call createWorkspaceTenantUser for customer workspaces",
);

assert.doesNotMatch(
  apiRoute,
  /not available for this workspace yet/,
  "POST /api/users must not return 501 for customer workspaces",
);

const wizard = fs.readFileSync(
  path.join(process.cwd(), "src/components/testflighthub/AddUserAccessWizard.tsx"),
  "utf8",
);

assert.match(wizard, /<FieldLabel>Location<\/FieldLabel>/, "Add user wizard must label field Location");
assert.match(
  wizard,
  /placeholder="e\.g\. Barcelona, Spain"/,
  "Add user wizard must use location placeholder",
);
assert.doesNotMatch(
  wizard,
  /USER_REGION_OPTIONS/,
  "Add user wizard must not use hard-coded region options",
);

console.log("ok  users-module-create checks passed\n");
