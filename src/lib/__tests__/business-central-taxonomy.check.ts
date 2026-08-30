/**
 * Business Central taxonomy — structure, provisioning, and ABHI terminology.
 * Run: npm run prove:business-central-taxonomy
 */
import assert from "node:assert/strict";

import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import {
  BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY,
  filterBusinessCentralProvisioningSubModules,
  workspaceExcludesBusinessCentralGrantManagement,
} from "@/lib/platform-workspaces/business-central-provisioning";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import { demoCatalogueEnablement } from "@/lib/platform-workspaces/demo-provisioning";
import {
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  WORKSPACE_CORE_MODULE_IDS,
} from "@/lib/platform-workspaces/module-catalogue";
import { saecEnabledSubModules, SAEC_ENABLED_MODULES } from "@/lib/platform-workspaces/saec-provisioning";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { buildAbhiNavSections } from "@/lib/internal-role-views";
import {
  internalSurveyNavSections,
  type InternalNavSection,
} from "@/lib/internal-operations-data";
const TARGET_BC_FEATURES = [
  "Dashboard",
  "Client Management",
  "Management",
  "Information Repository",
] as const;

const bcNav = buildCentralBusinessCentralNavSection();
const bcLabels = bcNav.items.map((item) => item.label);

assert.deepEqual(bcLabels, [...TARGET_BC_FEATURES]);
assert.ok(!bcLabels.includes("Grant Management"), "Grant Management is not a Business Central Core Feature");
assert.ok(!bcNav.items.some((item) => item.view === "grants"), "grants view must not appear in central BC nav");

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
assert.equal(bcSubs.length, 8);
assert.ok(!bcSubs.some((sub) => sub.viewId === "member-intelligence"));
assert.ok(!bcSubs.some((sub) => sub.viewId === "grants"), "grants must not be a BC catalogue submodule");

assert.equal(defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS).length, 163);

assert.equal(workspaceExcludesBusinessCentralGrantManagement(ABHI_SLUG), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement(SAEC_SLUG), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement("omnitransit"), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement(INTERFACE_WORX_SLUG), true);
assert.equal(workspaceExcludesBusinessCentralGrantManagement(DEMO_WORKSPACE_SLUG), true);

const filteredSubs = filterBusinessCentralProvisioningSubModules(
  DEMO_WORKSPACE_SLUG,
  [...defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS), BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY],
);
assert.ok(!filteredSubs.includes(BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY));

function businessCentralSection(
  sections: readonly InternalNavSection[],
): InternalNavSection | undefined {
  return sections.find((section) => section.label === "Business Central");
}

function assertNoGrantManagementInBc(
  section: InternalNavSection | undefined,
  workspaceName: string,
  options?: { expectStandardLabels?: boolean },
): void {
  assert.ok(section, `${workspaceName}: Business Central section must exist`);
  const json = JSON.stringify(section);
  assert.ok(!json.includes("Grant Management"), `${workspaceName}: Grant Management must not appear in BC nav`);
  assert.ok(!json.includes('"view":"grants"'), `${workspaceName}: grants view must not appear in BC nav`);
  if (options?.expectStandardLabels !== false) {
    const labels = section!.items.map((item) => item.label);
    assert.deepEqual(labels, [...TARGET_BC_FEATURES], `${workspaceName}: BC Core Features`);
  }
}

const workspaceCases = [
  {
    name: "NORTHSTAR",
    slug: DEMO_WORKSPACE_SLUG,
    workspaceType: "Demo" as const,
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      workspaceType: "Demo",
      ...demoCatalogueEnablement(),
    }),
  },
  {
    name: "ABHI",
    slug: ABHI_SLUG,
    workspaceType: "Customer" as const,
    abhi: true,
  },
  {
    name: "OMNITRANSIT",
    slug: SAEC_SLUG,
    workspaceType: "Customer" as const,
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: SAEC_SLUG,
      workspaceType: "Customer",
      enabledModules: [...SAEC_ENABLED_MODULES],
      enabledSubModules: saecEnabledSubModules(),
    }),
  },
  {
    name: "AMANAH",
    slug: AMANAH_SLUG,
    workspaceType: "Customer" as const,
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: AMANAH_SLUG,
      workspaceType: "Customer",
      enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
      enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
    }),
  },
  {
    name: "INTERFACEWORX",
    slug: INTERFACE_WORX_SLUG,
    workspaceType: "Customer" as const,
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: INTERFACE_WORX_SLUG,
      workspaceType: "Customer",
      enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
      enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
    }),
  },
  {
    name: "GREENDESERT",
    slug: GREENDESERT_SLUG,
    workspaceType: "Customer" as const,
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: GREENDESERT_SLUG,
      workspaceType: "Customer",
      enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
      enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
    }),
  },
  {
    name: "INTERNAL",
    slug: "internal",
    workspaceType: "internal" as const,
    internal: true,
  },
];

for (const workspace of workspaceCases) {
  const sections = workspace.abhi
    ? buildAbhiNavSections(internalSurveyNavSections)
    : workspace.internal
      ? internalSurveyNavSections
      : buildWorkspaceProductNavSections({
          workspaceSlug: workspace.slug,
          workspaceType: workspace.workspaceType,
          enablement: workspace.enablement!,
        });

  assertNoGrantManagementInBc(businessCentralSection(sections), workspace.name, {
    expectStandardLabels: !workspace.abhi,
  });

  if (!workspace.abhi && !workspace.internal && workspace.enablement) {
    assert.ok(
      !workspace.enablement.enabledSubModules.includes(BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY),
      `${workspace.name}: business-central:grants must remain stripped`,
    );
    assert.ok(
      workspace.enablement.enabledSubModules.includes("fundraising:grants"),
      `${workspace.name}: grants must be enabled via Fundraising submodule`,
    );
  }
}

const abhiNav = buildAbhiNavSections(internalSurveyNavSections);
const abhiBc = abhiNav.find((section) => section.label === "Business Central");
assert.ok(abhiBc);
const abhiBcJson = JSON.stringify(abhiBc);
assert.ok(abhiBcJson.includes("Member Management"));
assert.ok(abhiBcJson.includes("Member Dashboard"));
assert.ok(abhiBcJson.includes("Member Directory"));
assert.ok(!abhiBcJson.includes("Grant Management"));
assert.ok(!abhiBcJson.includes('"view":"grants"'));

const saecNav = buildWorkspaceProductNavSections({
  workspaceSlug: SAEC_SLUG,
  workspaceType: "Customer",
  enablement: resolveWorkspaceNavEnablement({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
    enabledSubModules: saecEnabledSubModules(),
  }),
});
assertNoGrantManagementInBc(businessCentralSection(saecNav), "OMNITRANSIT (saec subs)");

console.log("prove:business-central-taxonomy: OK");
