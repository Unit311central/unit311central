/**
 * ABHI demo@ / admin@ — workspace-scoped admin APIs (Users, integrations).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { usesWorkspaceTenantUserManagement } from "@/lib/customer-workspace-surface";
import {
  ABHI_DEMO_PLATFORM_USERNAME,
  ABHI_PORTALS_ADMIN_USERNAME,
} from "@/lib/abhi/portals-auth";

assert.equal(
  usesWorkspaceTenantUserManagement("abhi", ABHI_DEMO_PLATFORM_USERNAME),
  true,
);
assert.equal(
  usesWorkspaceTenantUserManagement("abhi", ABHI_PORTALS_ADMIN_USERNAME),
  true,
);
assert.equal(
  usesWorkspaceTenantUserManagement("abhi", "staff@abhi.org.uk"),
  false,
);
assert.equal(
  usesWorkspaceTenantUserManagement("talantonimpact", ABHI_PORTALS_ADMIN_USERNAME),
  false,
);

const authPath = path.join(process.cwd(), "src/lib/internal-admin-auth.ts");
const authSource = fs.readFileSync(authPath, "utf8");
assert.match(
  authSource,
  /isAbhiSlug\(workspace\.slug\) &&\s*\n?\s*isAbhiPortalsAllowedUsername\(session\.username\)/,
  "Users module must allow ABHI portals demo/admin without global internal Admin",
);
assert.match(
  authSource,
  /isAbhiSlug\(workspaceAuth\.workspace\.slug\) &&\s*\n?\s*isAbhiPortalsAllowedUsername\(workspaceAuth\.session\.username\)/,
  "Workspace admin APIs must allow ABHI portals demo/admin on abhi host",
);

console.log("ok  abhi-platform-access checks passed\n");
