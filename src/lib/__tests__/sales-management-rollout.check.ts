/**
 * Canonical Sales Management rollout — Internal, Demo, WOLF only.
 */
import assert from "node:assert/strict";

import {
  SALES_MANAGEMENT_CANONICAL_WORKSPACE_SLUGS,
  assertSalesManagementTargetClientsWorkspace,
  isSalesManagementCanonicalWorkspace,
} from "@/lib/sales-management-rollout";
import { isTargetClientsRolloutHost } from "@/lib/sales-management-target-clients";
import { buildWolfCentralNavSections, wolfCentralNavViews } from "@/lib/wolf/wolf-nav";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";

assert.deepEqual(SALES_MANAGEMENT_CANONICAL_WORKSPACE_SLUGS, ["unit311", "demo", "wolf-central"]);

assert.equal(isSalesManagementCanonicalWorkspace("unit311"), true);
assert.equal(isSalesManagementCanonicalWorkspace("demo"), true);
assert.equal(isSalesManagementCanonicalWorkspace("wolf-central"), true);
assert.equal(isSalesManagementCanonicalWorkspace("talantonimpact"), false);

assert.doesNotThrow(() => assertSalesManagementTargetClientsWorkspace("demo"));
assert.throws(() => assertSalesManagementTargetClientsWorkspace("abhi"));

assert.equal(isTargetClientsRolloutHost("internal.unit311central.com"), true);
assert.equal(isTargetClientsRolloutHost("demo.unit311central.com"), true);
assert.equal(isTargetClientsRolloutHost("wolf.unit311central.com"), true);
assert.equal(isTargetClientsRolloutHost("demo.localhost"), true);
assert.equal(isTargetClientsRolloutHost("wolf.localhost"), true);
assert.equal(isTargetClientsRolloutHost("talantonimpact.unit311central.com"), false);

const wolfNav = buildWolfCentralNavSections();
const salesSection = wolfNav.find((s) => s.label === SALES_MANAGEMENT_MODULE_LABEL);
assert.ok(salesSection, "WOLF nav must include Sales Management");
const salesGroup = salesSection?.items.find((i) => i.label === "Sales");
const childLabels = salesGroup?.children?.map((c) => c.label) ?? [];
assert.ok(childLabels.includes("Target Clients"), `WOLF Sales nav: ${childLabels.join(", ")}`);
assert.ok(childLabels.indexOf("Target Clients") < childLabels.indexOf("Opportunities"));

assert.ok(wolfCentralNavViews().includes("sales-management"));

console.log("ok  sales-management-rollout.check.ts");
