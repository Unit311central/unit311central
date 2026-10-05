/**
 * Stage 2 — workspace identity isolation (static architecture checks).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const tenantUsers = read("src/lib/workspace-tenant-users-service.ts");
assert.doesNotMatch(
  tenantUsers,
  /from\("internal_operators"\)/,
  "tenant user CRUD must not touch internal_operators",
);

const usersRoute = read("src/app/api/users/route.ts");
assert.doesNotMatch(
  usersRoute,
  /listInternalOperators\(\)/,
  "GET /api/users must not list global internal_operators",
);
assert.match(usersRoute, /listWorkspaceTenantUsers\(/, "GET /api/users uses workspace membership");

const messagingOps = read("src/app/api/messaging/operators/route.ts");
assert.doesNotMatch(
  messagingOps,
  /listInternalOperators\(\)/,
  "messaging operators must be workspace scoped",
);
assert.match(
  messagingOps,
  /listActiveMessagingOperatorsForWorkspace/,
  "messaging operators helper required",
);

const demoUsers = read("src/lib/demo/demo-users-service.ts");
assert.doesNotMatch(
  demoUsers,
  /listInternalOperators/,
  "demo user list must not merge global operators",
);

const platformUsers = read("src/lib/platform-users-service.ts");
const listTenantFn =
  platformUsers.match(/export async function listWorkspaceTenantUsers[\s\S]*?\n}\n/)?.[0] ?? "";
assert.ok(listTenantFn.length > 0, "listWorkspaceTenantUsers must exist");
assert.doesNotMatch(
  listTenantFn,
  /from\("internal_operators"\)/,
  "listWorkspaceTenantUsers must not join internal_operators",
);
assert.doesNotMatch(
  listTenantFn,
  /from\("platform_users"\)[\s\S]*\.eq\("workspace_id", workspaceId\)/,
  "listWorkspaceTenantUsers must not filter platform_users by primary workspace_id",
);

const internalAuth = read("src/lib/internal-admin-auth.ts");
assert.match(
  internalAuth,
  /isUnit311GlobalAdminUsername/,
  "platform admin bypass for users module",
);
assert.match(
  internalAuth,
  /\.eq\("user_id", userId\)/,
  "tenant users admin gate uses session membership",
);

const hrService = read("src/lib/hr-employees-service.ts");
assert.match(hrService, /linkHrEmployeeToPlatformUser/, "HR link preserved");

const supportClaims = read("src/lib/support-claims.ts");
assert.doesNotMatch(
  supportClaims,
  /listInternalOperators\(\)/,
  "support assignee lookup must be workspace scoped",
);

const crmEnquiries = read("src/lib/crm-enquiries-messaging.ts");
assert.doesNotMatch(
  crmEnquiries,
  /listInternalOperators\(\)/,
  "CRM enquiries channel must be workspace scoped",
);

console.log("ok  workspace-isolation-stage2 checks passed\n");
