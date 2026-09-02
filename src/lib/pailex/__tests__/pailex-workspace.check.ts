/**
 * PAILEX customer workspace isolation and navigation regression checks.
 *
 * Run: npx tsx src/lib/pailex/__tests__/pailex-workspace.check.ts
 */
import assert from "node:assert/strict";

import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { canonicalizeWorkspaceHostSubdomain } from "@/lib/platform-workspaces/workspace-host-alias-service";
import { isCustomerWorkspaceSlug, isWorkspaceTenantAdministratorSurface } from "@/lib/customer-workspace-surface";
import { isViewAllowedForWorkspaceGrants } from "@/lib/workspace-enabled-views";
import { DEMO_ENABLED_MODULES } from "@/lib/platform-workspaces/demo-provisioning";
import { SAEC_ENABLED_MODULES } from "@/lib/platform-workspaces/saec-provisioning";
import { wolfCentralEnabledModules } from "@/lib/wolf/wolf-central-provisioning";
import { buildPailexNavSections, PAILEX_NAV_SECTION_LABELS } from "@/lib/pailex/pailex-nav";
import {
  pailexEnabledModules,
  pailexEnabledSubModules,
} from "@/lib/pailex/pailex-provisioning";
import {
  PAILEX_ADMIN_EMAIL,
  PAILEX_HOST_ALIAS,
  PAILEX_SLUG,
  canonicalizePailexSlug,
  isPailexSlug,
} from "@/lib/pailex/pailex-surface";
import { PAILEX_OPERATIONAL_VIEWS } from "@/lib/pailex/pailex-views";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

assert.equal(PAILEX_ADMIN_EMAIL, "admin@pailex.unit311central.com");

assert.equal(canonicalizePailexSlug("pailex"), PAILEX_SLUG);
assert.equal(canonicalizePailexSlug(PAILEX_HOST_ALIAS), PAILEX_SLUG);
assert.ok(isPailexSlug(PAILEX_SLUG));
assert.ok(!isCustomerWorkspaceSlug(PAILEX_SLUG));
assert.ok(!isCustomerWorkspaceSlug(PAILEX_HOST_ALIAS));
assert.ok(isWorkspaceTenantAdministratorSurface(PAILEX_SLUG));
assert.ok(isWorkspaceTenantAdministratorSurface(PAILEX_HOST_ALIAS));

assert.equal(canonicalizeWorkspaceHostSubdomain(PAILEX_HOST_ALIAS, null), PAILEX_SLUG);

const pailexNav = resolveWorkspaceNavBaseSections({ workspaceSlug: PAILEX_SLUG });
for (const label of PAILEX_NAV_SECTION_LABELS) {
  assert.ok(pailexNav.some((section) => section.label === label), `Missing section: ${label}`);
}
assert.ok(!pailexNav.some((section) => section.label === "Tools"));
assert.ok(!pailexNav.some((section) => section.label === "Business Central"));
assert.ok(!pailexNav.some((section) => section.label === "Finances"));

const wolfNav = resolveWorkspaceNavBaseSections({ workspaceSlug: WOLF_CENTRAL_SLUG });
assert.ok(wolfNav.some((section) => section.label === "Safari Parks"));
assert.ok(!wolfNav.some((section) => section.label === "Support"));

const navViews = buildPailexNavSections().flatMap((section) =>
  section.items.flatMap((item) => [
    item.view,
    ...(item.children?.map((child) => child.view) ?? []),
  ]),
);
for (const view of PAILEX_OPERATIONAL_VIEWS) {
  assert.ok(navViews.includes(view), `PAILEX nav missing view: ${view}`);
}

const pailexModules = pailexEnabledModules();
assert.ok(pailexModules.includes("wolf-animals"));
assert.ok(pailexModules.includes("settings"));
assert.ok(!pailexModules.includes("business-central"));
assert.ok(!pailexModules.includes("financials"));

assert.ok(pailexEnabledSubModules().includes("home:pailex-dashboard"));
assert.ok(pailexEnabledSubModules().includes("wolf-animals:pailex-animals-monitoring"));

assert.ok(!DEMO_ENABLED_MODULES.includes("wolf-animals"));
assert.ok(!SAEC_ENABLED_MODULES.includes("wolf-animals"));
assert.ok(wolfCentralEnabledModules().includes("support-desk"));

for (const view of PAILEX_OPERATIONAL_VIEWS) {
  assert.ok(
    isViewAllowedForWorkspaceGrants(view, [], {
      workspaceSlug: PAILEX_SLUG,
      enabledModules: pailexModules,
      enabledSubModules: pailexEnabledSubModules(),
    }),
    `PAILEX view should be allowed: ${view}`,
  );
}

console.log("pailex-workspace.check.ts — all assertions passed.");
