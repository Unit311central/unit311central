/**
 * Operator entitlements resolution — Admin super-role and currency/nav platform fixes.
 * Run: node --import tsx src/lib/__tests__/platform-demo-fixes.check.ts
 */
import assert from "node:assert/strict";

import { DEFAULT_REPORTING_CURRENCY } from "@/lib/financial-reporting-currency";
import { FINANCIAL_REPORTING_CURRENCY } from "@/lib/accounting/overview-service";
import {
  isSuperOperatorRole,
  resolveEffectiveAllowedViews,
  resolveOperatorEntitlementsFromOperatorRow,
} from "@/lib/operator-entitlements-resolve";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import {
  buildWorkspaceProductNavSections,
  repairWorkspaceSubmoduleKeys,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { subModuleKey, defaultEnabledModules } from "@/lib/platform-workspaces/module-catalogue";

assert.equal(DEFAULT_REPORTING_CURRENCY, "USD");
assert.equal(FINANCIAL_REPORTING_CURRENCY, "USD");

assert.equal(isSuperOperatorRole(["Admin"]), true);
assert.equal(
  resolveEffectiveAllowedViews(["Admin"], ["Corporate"], ["home"]),
  null,
  "Admin must be unrestricted",
);

const managerViews = resolveEffectiveAllowedViews(["Manager"], ["Finance"], null);
assert.ok(managerViews?.includes("financials"), "Finance department Manager gets financials");

const staleAdmin = resolveOperatorEntitlementsFromOperatorRow({
  role: "Admin",
  roles: ["Admin"],
  department: "Corporate",
  departments: ["Corporate"],
  allowed_views: ["home", "clients"],
});
assert.equal(staleAdmin.allowedViews, null, "Stored partial grants must not restrict Admin");

const bcLabels = buildCentralBusinessCentralNavSection().items.map((item) => item.label);
assert.deepEqual(bcLabels, [
  "Dashboard",
  "Clients",
  "Management",
  "Grants",
]);
const management = buildCentralBusinessCentralNavSection().items.find(
  (item) => item.label === "Management",
);
assert.ok(management?.children?.length === 4, "Management must nest four sidebar subviews");
assert.ok(!bcLabels.includes("Projects"), "BC catalogue must not nest Projects");

const repaired = repairWorkspaceSubmoduleKeys(["business-central"], []);
assert.ok(
  repaired.some((key) => key === subModuleKey("business-central", "clients-dashboard")),
  "Repair must restore missing BC submodule keys",
);

const clientsOnly = repairWorkspaceSubmoduleKeys(
  ["business-central"],
  [subModuleKey("business-central", "clients")],
);
assert.ok(
  clientsOnly.includes(subModuleKey("business-central", "clients-dashboard")),
  "Repair must pair Client Directory with Clients Dashboard",
);

const demoLikeEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "acme-corp",
  workspaceType: "Customer",
  enabledModules: ["business-central"],
  enabledSubModules: [subModuleKey("business-central", "clients")],
});
const demoLikeNav = buildWorkspaceProductNavSections({
  workspaceSlug: "acme-corp",
  workspaceType: "Customer",
  enablement: demoLikeEnablement,
});
const clientsChildren =
  demoLikeNav
    .find((section) => section.label === "Business Central")
    ?.items.find((item) => item.label === "Clients")
    ?.children?.map((child) => child.label) ?? [];
assert.deepEqual(clientsChildren, ["Dashboard", "Client Directory"]);

console.log("ok  platform-demo-fixes checks passed\n");
