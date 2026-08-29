/**
 * Business Central taxonomy — structure, provisioning, and ABHI terminology.
 * Run: npm run prove:business-central-taxonomy
 */
import assert from "node:assert/strict";

import { ABHI_SLUG } from "@/lib/abhi-surface";
import {
  BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY,
  filterBusinessCentralProvisioningSubModules,
  workspaceExcludesBusinessCentralGrantManagement,
} from "@/lib/platform-workspaces/business-central-provisioning";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import {
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  WORKSPACE_CORE_MODULE_IDS,
} from "@/lib/platform-workspaces/module-catalogue";
import { saecEnabledSubModules } from "@/lib/platform-workspaces/saec-provisioning";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { buildAbhiNavSections } from "@/lib/internal-role-views";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { viewsForWorkspaceEnablement } from "@/lib/workspace-enabled-views";

const bcNav = buildCentralBusinessCentralNavSection();
const bcLabels = bcNav.items.map((item) => item.label);

assert.deepEqual(bcLabels, [
  "Dashboard",
  "Client Management",
  "Management",
  "Grant Management",
  "Information Repository",
]);

const clientMgmt = bcNav.items.find((item) => item.label === "Client Management");
assert.ok(clientMgmt?.children?.length === 2);
assert.deepEqual(
  clientMgmt?.children?.map((child) => child.label),
  ["Client Dashboard", "Client Directory"],
);

const management = bcNav.items.find((item) => item.label === "Management");
assert.deepEqual(management?.children?.map((child) => child.label), [
  "Management Dashboard",
  "Meetings",
  "Function Packs",
  "Actions & Decisions",
]);

const bcSubs = getWorkspaceModuleEntry("business-central")?.subModules ?? [];
assert.equal(bcSubs.length, 9);
assert.ok(!bcSubs.some((sub) => sub.viewId === "member-intelligence"));

assert.equal(defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS).length, 163);

assert.equal(workspaceExcludesBusinessCentralGrantManagement(ABHI_SLUG), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement(SAEC_SLUG), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement("omnitransit"), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement("interfaceworx"), false);

const abhiFiltered = filterBusinessCentralProvisioningSubModules(
  ABHI_SLUG,
  defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
);
assert.ok(!abhiFiltered.includes(BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY));

const saecSubs = saecEnabledSubModules();
assert.ok(!saecSubs.includes(BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY));

const abhiEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: ABHI_SLUG,
  workspaceType: "Customer",
  enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
  enabledSubModules: abhiFiltered,
});
const abhiViews = viewsForWorkspaceEnablement(
  abhiEnablement.enabledModules,
  abhiEnablement.enabledSubModules,
);
assert.ok(!abhiViews.includes("grants"));

const saecEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: SAEC_SLUG,
  workspaceType: "Customer",
  enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
  enabledSubModules: saecSubs,
});
const saecNav = buildWorkspaceProductNavSections({
  workspaceSlug: SAEC_SLUG,
  workspaceType: "Customer",
  enablement: saecEnablement,
});
const saecBc = saecNav.find((section) => section.label === "Business Central");
assert.ok(saecBc);
assert.equal(
  saecBc!.items.some((item) => item.view === "grants"),
  false,
  "OmniTransit must not show Grant Management",
);

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
  enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
});
const demoNav = buildWorkspaceProductNavSections({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enablement: demoEnablement,
});
const demoBc = demoNav.find((section) => section.label === "Business Central");
assert.ok(demoBc?.items.some((item) => item.label === "Grant Management"));

const iwEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "interfaceworx",
  workspaceType: "Customer",
  enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
  enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
});
const iwNav = buildWorkspaceProductNavSections({
  workspaceSlug: "interfaceworx",
  workspaceType: "Customer",
  enablement: iwEnablement,
});
const iwBc = iwNav.find((section) => section.label === "Business Central");
assert.ok(iwBc?.items.some((item) => item.label === "Client Management"));

const abhiNav = buildAbhiNavSections(internalSurveyNavSections);
const abhiBc = abhiNav.find((section) => section.label === "Business Central");
assert.ok(abhiBc);
const abhiBcJson = JSON.stringify(abhiBc);
assert.ok(abhiBcJson.includes("Member Management"));
assert.ok(abhiBcJson.includes("Member Dashboard"));
assert.ok(abhiBcJson.includes("Member Directory"));
assert.ok(!abhiBcJson.includes("Grant Management"));
assert.ok(!abhiBcJson.includes('"view":"grants"'));

console.log("prove:business-central-taxonomy: OK");
