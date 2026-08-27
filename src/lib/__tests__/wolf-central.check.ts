/**
 * WOLF Central isolation and catalogue regression checks.
 *
 * Run: npx tsx src/lib/__tests__/wolf-central.check.ts
 */
import assert from "node:assert/strict";

import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import {
  WORKSPACE_CORE_MODULE_COUNT,
  WORKSPACE_CORE_MODULE_IDS,
  WORKSPACE_MODULE_CATALOGUE,
  WORKSPACE_MODULE_IDS,
  getWorkspaceModuleEntry,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  wolfCentralEnabledModules,
  wolfCentralEnabledSubModules,
} from "@/lib/wolf/wolf-central-provisioning";
import {
  WOLF_CENTRAL_HOST_ALIAS,
  WOLF_CENTRAL_SLUG,
  canonicalizeWolfCentralSlug,
  isWolfCentralSlug,
} from "@/lib/wolf/wolf-surface";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { DEMO_ENABLED_MODULES } from "@/lib/platform-workspaces/demo-provisioning";
import { SAEC_ENABLED_MODULES } from "@/lib/platform-workspaces/saec-provisioning";
import { computeWolfEstateMetrics } from "@/lib/wolf/central/estate-metrics";
import { WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";
import { canonicalizeWorkspaceHostSubdomain } from "@/lib/platform-workspaces/workspace-host-alias-service";

assert.equal(WORKSPACE_MODULE_CATALOGUE.length, 27);
assert.equal(WORKSPACE_CORE_MODULE_COUNT, 22);
assert.ok(WORKSPACE_MODULE_IDS.includes("wolf-animals"));
assert.ok(WORKSPACE_MODULE_IDS.includes("wolf-fleet"));
assert.ok(!WORKSPACE_CORE_MODULE_IDS.includes("wolf-animals"));

assert.equal(canonicalizeWolfCentralSlug("wolf"), WOLF_CENTRAL_SLUG);
assert.equal(canonicalizeWolfCentralSlug(WOLF_CENTRAL_SLUG), WOLF_CENTRAL_SLUG);
assert.ok(isWolfCentralSlug(WOLF_CENTRAL_HOST_ALIAS));
assert.ok(!isCustomerWorkspaceSlug(WOLF_CENTRAL_SLUG));
assert.ok(!isCustomerWorkspaceSlug(WOLF_CENTRAL_HOST_ALIAS));

assert.equal(
  canonicalizeWorkspaceHostSubdomain(WOLF_CENTRAL_HOST_ALIAS, null),
  WOLF_CENTRAL_SLUG,
);

const wolfNav = resolveWorkspaceNavBaseSections({ workspaceSlug: WOLF_CENTRAL_SLUG });
assert.ok(wolfNav.some((section) => section.label === "Safari Parks"));
assert.ok(wolfNav.some((section) => section.label === "Settings"));
assert.ok(!wolfNav.some((section) => section.label === "Business Central"));

const wolfModules = wolfCentralEnabledModules();
assert.ok(wolfModules.includes("wolf-animals"));
assert.ok(wolfModules.includes("wolf-fleet"));
assert.ok(!wolfModules.includes("business-central"));

for (const moduleId of wolfModules) {
  assert.ok(
    moduleId === "home" ||
      moduleId === "settings" ||
      moduleId.startsWith("wolf-"),
    `Unexpected WOLF Central module: ${moduleId}`,
  );
}

assert.ok(!DEMO_ENABLED_MODULES.includes("wolf-animals"));
assert.ok(!SAEC_ENABLED_MODULES.includes("wolf-animals"));

for (const wolfModuleId of [
  "wolf-animals",
  "wolf-containment",
  "wolf-environment",
  "wolf-drone-operations",
  "wolf-fleet",
]) {
  const entry = getWorkspaceModuleEntry(wolfModuleId);
  assert.ok(entry, `Missing catalogue entry for ${wolfModuleId}`);
}

const metrics = computeWolfEstateMetrics(
  WOLF_DEMO_RESERVE_SEEDS.map((seed, index) => ({
    id: seed.slug,
    ...seed,
  })),
);
assert.equal(metrics.reserveCount, 3);
assert.equal(metrics.totalAircraft, 12);
assert.equal(metrics.largeDrones, 6);
assert.equal(metrics.smallDrones, 6);
assert.equal(metrics.docks, 6);

console.log("wolf-central.check.ts — all assertions passed.");
