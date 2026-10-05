/**
 * Stage 1 — Employee ↔ Platform User identity foundation.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  HrEmployeePlatformUserLinkError,
  normalizePlatformUserId,
  validateEmployeePlatformUserLink,
} from "@/lib/hr-employee-platform-user-link";

const workspaceA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const userId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

assert.equal(normalizePlatformUserId(userId), userId);
assert.equal(normalizePlatformUserId("not-a-uuid"), null);
assert.equal(normalizePlatformUserId(""), null);

assert.doesNotThrow(() =>
  validateEmployeePlatformUserLink({
    employeeWorkspaceId: workspaceA,
    platformUserId: userId,
    platformUserPrimaryWorkspaceId: workspaceA,
    platformUserMembershipWorkspaceIds: [],
  }),
);

assert.doesNotThrow(() =>
  validateEmployeePlatformUserLink({
    employeeWorkspaceId: workspaceA,
    platformUserId: userId,
    platformUserPrimaryWorkspaceId: workspaceB,
    platformUserMembershipWorkspaceIds: [workspaceA],
  }),
);

assert.throws(
  () =>
    validateEmployeePlatformUserLink({
      employeeWorkspaceId: workspaceA,
      platformUserId: userId,
      platformUserPrimaryWorkspaceId: workspaceB,
      platformUserMembershipWorkspaceIds: [workspaceB],
    }),
  (error: unknown) => {
    assert.ok(error instanceof HrEmployeePlatformUserLinkError);
    assert.equal(error.status, 409);
    return true;
  },
);

assert.throws(
  () =>
    validateEmployeePlatformUserLink({
      employeeWorkspaceId: workspaceA,
      platformUserId: userId,
      platformUserPrimaryWorkspaceId: workspaceA,
      platformUserMembershipWorkspaceIds: [],
      conflictingEmployeeId: "hr-other",
      employeeId: "hr-self",
    }),
  (error: unknown) => {
    assert.ok(error instanceof HrEmployeePlatformUserLinkError);
    assert.equal(error.status, 409);
    return true;
  },
);

const hrServicePath = path.join(process.cwd(), "src/lib/hr-employees-service.ts");
const hrService = fs.readFileSync(hrServicePath, "utf8");
assert.match(
  hrService,
  /export async function createHrEmployee\(/,
  "createHrEmployee must exist",
);
assert.doesNotMatch(
  hrService,
  /createHrEmployee[\s\S]*createWorkspaceTenantUser/,
  "createHrEmployee must not create tenant platform users",
);
assert.doesNotMatch(
  hrService,
  /createHrEmployee[\s\S]*from\("platform_users"\)\.insert/,
  "createHrEmployee must not insert platform_users",
);
assert.match(hrService, /linkHrEmployeeToPlatformUser/, "link helper exported");
assert.match(hrService, /unlinkHrEmployeePlatformUser/, "unlink helper exported");

const tenantUsersPath = path.join(process.cwd(), "src/lib/workspace-tenant-users-service.ts");
const tenantUsers = fs.readFileSync(tenantUsersPath, "utf8");
assert.doesNotMatch(
  tenantUsers,
  /from\("internal_operators"\)/,
  "tenant user flow must not mirror into internal_operators (Stage 2)",
);

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/219_hr_employee_platform_user_link.sql",
);
assert.ok(fs.existsSync(migrationPath), "219 migration must exist");
const migration = fs.readFileSync(migrationPath, "utf8");
assert.match(migration, /on delete set null/i, "FK must preserve employee on user delete");
assert.match(
  migration,
  /hr_employees_workspace_platform_user_uidx/,
  "unique per workspace link index required",
);

console.log("ok  hr-employee-platform-user-link checks passed\n");
