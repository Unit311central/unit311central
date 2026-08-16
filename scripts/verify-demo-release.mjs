/**
 * Verify Demo release surface wiring (no network deploy required).
 * Checks code constants and that reserved host/slug stay aligned.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const appDomains = read("src/lib/app-domains.ts");
assert.match(appDomains, /DEMO_SITE_HOST/);
assert.match(appDomains, /DEMO_WORKSPACE_SLUG\s*=\s*"demo"/);
assert.match(appDomains, /"demo"/);

const middleware = read("src/middleware.ts");
assert.match(middleware, /isDemoDomainHost/);
assert.match(middleware, /x-unit311-demo/);

const authz = read("src/lib/workspace-authorization.ts");
assert.match(authz, /internal_demo/);
assert.match(authz, /primaryIsDemo/);
assert.match(authz, /not_a_member/);

const surface = read("src/lib/runtime-surface.ts");
assert.match(surface, /resolveRuntimeSurface/);
assert.match(surface, /isModuleVisibleOnSurface/);

const migration097 = read("supabase/migrations/097_demo_workspace.sql");
assert.match(migration097, /slug = 'demo'/);

const migration119 = read("supabase/migrations/119_dual_demo_workspace_tenancy.sql");
assert.match(migration119, /Unit311 Central Demo/);
assert.match(migration119, /ensure_demo_workspace/);
assert.match(migration119, /ensure_workspace_foundation/);
assert.match(migration119, /demo@unit311central\.com/);
assert.doesNotMatch(migration119, /12345678\$/); // plaintext password must not appear

const allowlist = read("src/app/api/internal/apply-unit311central-pending-migrations/route.ts");
assert.match(allowlist, /097_demo_workspace\.sql/);
assert.match(allowlist, /119_dual_demo_workspace_tenancy\.sql/);

const provisioning = read("src/lib/workspace-provisioning-service.ts");
assert.match(provisioning, /ensureDemoWorkspace/);

const releaseDoc = read("docs/DEMO_RELEASE_MODEL.md");
assert.match(releaseDoc, /demo\.unit311central\.com/);
assert.match(releaseDoc, /Unit311 Central Demo/);
assert.match(releaseDoc, /demo@unit311central\.com/);
assert.match(releaseDoc, /shared application/);
assert.match(releaseDoc, /workspace_id/);
assert.match(releaseDoc, /demo:enterprise:seed/);

const fixtures = JSON.parse(read("src/lib/demo-enterprise/fixtures.generated.json"));
assert.equal(fixtures.wise?.connected, true);
assert.match(String(fixtures.company?.legalName ?? ""), /Northstar/);
assert.ok(Array.isArray(fixtures.offices) && fixtures.offices.length >= 3);

const bankProvider = read("src/lib/treasury/bank-provider-server.ts");
assert.match(bankProvider, /shouldUseDemoWiseSimulator|isDemoWiseWorkspaceSlug/);
assert.match(read("src/lib/treasury/providers/demo-wise-simulator.ts"), /getDemoWiseConnectionStatus/);

console.log("verify-demo-release: OK");
