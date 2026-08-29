/**
 * Corporate Information — product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Formalises the agreed Corporate Information taxonomy against the EXISTING implementation:
 * one dashboard view + five leaf views that open CorporateInformationWorkspace tabs.
 * Verification-only — does not change routing, views, provisioning, data, or other modules.
 *
 *   1 Core Module · 6 Core Features · 5 Core Sub-features · 0 Custom
 *
 * Run: npm run prove:corporate-information-taxonomy
 */
import assert from "node:assert/strict";

import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import {
  CORPORATE_INFORMATION_ABHI_COMPANY_LABEL,
  CORPORATE_INFORMATION_CORE_FEATURES,
  CORPORATE_INFORMATION_CUSTOM_FEATURES,
  CORPORATE_INFORMATION_CUSTOM_SUB_FEATURES,
  CORPORATE_INFORMATION_EXCLUDED_VIEW_IDS,
  CORPORATE_INFORMATION_MODULE_ID,
  CORPORATE_INFORMATION_MODULE_LABEL,
  corporateInformationCoreFeatureCount,
  corporateInformationCoreSubFeatureCount,
} from "@/lib/corporate-information/corporate-information-taxonomy";
import { demoCatalogueEnablement } from "@/lib/platform-workspaces/demo-provisioning";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import { buildAbhiNavSections } from "@/lib/internal-role-views";
import {
  corporateTabToLegacyView,
  getInternalNavHref,
  internalSurveyNavSections,
  legacyCorporateViewToTab,
  type InternalNavSection,
} from "@/lib/internal-operations-data";
import { buildCentralCorporateInformationNavSection } from "@/lib/platform-workspaces/central-product-nav";
import {
  getWorkspaceModuleEntry,
  subModuleKey,
  WORKSPACE_CORE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import { SAEC_ENABLED_MODULES, saecEnabledSubModules } from "@/lib/platform-workspaces/saec-provisioning";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { SAEC_SLUG } from "@/lib/saec-surface";

// ---------------------------------------------------------------------------
// 1. Core Module
// ---------------------------------------------------------------------------
assert.equal(CORPORATE_INFORMATION_MODULE_ID, "corporate-information");
assert.equal(CORPORATE_INFORMATION_MODULE_LABEL, "Corporate Information");
assert.equal(
  getCanonicalModule(CORPORATE_INFORMATION_MODULE_ID)?.label,
  CORPORATE_INFORMATION_MODULE_LABEL,
);
assert.ok(getWorkspaceModuleEntry(CORPORATE_INFORMATION_MODULE_ID));

// ---------------------------------------------------------------------------
// 2. Six Core Features · five Core Sub-features · zero Custom
// ---------------------------------------------------------------------------
assert.equal(corporateInformationCoreFeatureCount(), 6);
assert.equal(corporateInformationCoreSubFeatureCount(), 5);
assert.equal(CORPORATE_INFORMATION_CUSTOM_FEATURES.length, 0);
assert.equal(CORPORATE_INFORMATION_CUSTOM_SUB_FEATURES.length, 0);

const dashboardFeature = CORPORATE_INFORMATION_CORE_FEATURES[0];
assert.equal(dashboardFeature.label, "Dashboard");
assert.equal(dashboardFeature.viewId, "corporate-dashboard");
assert.equal(dashboardFeature.subFeature, undefined, "Dashboard has no Core Sub-feature");

const subFeatures = CORPORATE_INFORMATION_CORE_FEATURES.filter((feature) => feature.subFeature);
assert.equal(subFeatures.length, 5);
assert.deepEqual(
  subFeatures.map((feature) => feature.subFeature!.label),
  [
    "Company Profile / Legal Entity Records",
    "Office Directory & Locations",
    "Corporate Banking Register",
    "Advisor / Firm Register",
    "Contract Register",
  ],
);

// ---------------------------------------------------------------------------
// 3. Central product nav matches taxonomy (view IDs preserved)
// ---------------------------------------------------------------------------
const central = buildCentralCorporateInformationNavSection();
assert.equal(central.label, CORPORATE_INFORMATION_MODULE_LABEL);
assert.deepEqual(
  central.items.map((item) => item.label),
  CORPORATE_INFORMATION_CORE_FEATURES.map((feature) => feature.label),
);
assert.deepEqual(
  central.items.map((item) => item.view),
  CORPORATE_INFORMATION_CORE_FEATURES.map((feature) => feature.viewId),
);

for (const excluded of CORPORATE_INFORMATION_EXCLUDED_VIEW_IDS) {
  const json = JSON.stringify(central);
  assert.ok(!json.includes(`"view":"${excluded}"`), `Corporate Information must not include ${excluded}`);
}

// ---------------------------------------------------------------------------
// 4. Catalogue submodule keys align with Core Features (provisioning unchanged)
// ---------------------------------------------------------------------------
const catalogueSubs = getWorkspaceModuleEntry(CORPORATE_INFORMATION_MODULE_ID)?.subModules ?? [];
assert.equal(catalogueSubs.length, 6, "six catalogue submodules = six Core Features");
for (const feature of CORPORATE_INFORMATION_CORE_FEATURES) {
  const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
  assert.ok(sub, `catalogue submodule for ${feature.viewId}`);
  assert.equal(
    sub!.label,
    feature.label,
    `catalogue label for ${feature.viewId} uses product taxonomy label`,
  );
}

// ---------------------------------------------------------------------------
// 5. Legacy view/tab mapping preserved
// ---------------------------------------------------------------------------
for (const feature of subFeatures) {
  const tab = feature.subFeature!.tab;
  assert.equal(legacyCorporateViewToTab(feature.viewId), tab);
  assert.equal(corporateTabToLegacyView(tab as Parameters<typeof corporateTabToLegacyView>[0]), feature.viewId);
  const href = getInternalNavHref(feature.viewId, "/");
  assert.ok(href.includes(`view=${feature.viewId}`), `${feature.viewId} route preserved`);
}

assert.ok(
  getInternalNavHref("corporate-information", "/", { tab: "contracts" }).includes("tab=contracts"),
  "legacy corporate-information tab route preserved",
);
assert.ok(
  getInternalNavHref("corporate-dashboard", "/").includes("view=corporate-dashboard"),
  "corporate-dashboard route preserved",
);

// ---------------------------------------------------------------------------
// 6. Six customer workspaces — structure when module is enabled (no force-enable)
// ---------------------------------------------------------------------------
type WorkspaceCase = {
  name: string;
  slug: string;
  workspaceType: "Demo" | "Customer";
  enablement?: ReturnType<typeof resolveWorkspaceNavEnablement>;
  abhi?: boolean;
};

function corporateSection(
  sections: readonly InternalNavSection[],
): InternalNavSection | undefined {
  return sections.find(
    (section) => section.kind === "workspace" && section.label === CORPORATE_INFORMATION_MODULE_LABEL,
  );
}

function assertCorporateTaxonomyNav(
  section: InternalNavSection | undefined,
  workspaceName: string,
  options?: { allowAbhiCompanyLabel?: boolean },
): void {
  assert.ok(section, `${workspaceName}: Corporate Information section must exist when enabled`);
  assert.equal(section!.items.length, 6, `${workspaceName}: six Core Features`);

  for (let index = 0; index < CORPORATE_INFORMATION_CORE_FEATURES.length; index++) {
    const feature = CORPORATE_INFORMATION_CORE_FEATURES[index]!;
    const item = section!.items[index]!;
    const expectedLabel =
      options?.allowAbhiCompanyLabel && feature.abhiNavLabel ? feature.abhiNavLabel : feature.label;
    assert.equal(item.label, expectedLabel, `${workspaceName}: ${feature.label} nav label`);
    assert.equal(item.view, feature.viewId, `${workspaceName}: ${feature.viewId} view id preserved`);
    assert.equal((item.children ?? []).length, 0, `${workspaceName}: ${feature.label} is a leaf (no nav children)`);
  }

  const json = JSON.stringify(section);
  for (const excluded of CORPORATE_INFORMATION_EXCLUDED_VIEW_IDS) {
    assert.ok(!json.includes(`"view":"${excluded}"`), `${workspaceName}: must not expose ${excluded}`);
  }
}

const fullCustomerEnablement = {
  enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
  enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
};

const workspaceCases: WorkspaceCase[] = [
  {
    name: "NORTHSTAR",
    slug: DEMO_WORKSPACE_SLUG,
    workspaceType: "Demo",
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      workspaceType: "Demo",
      enabledModules: demoCatalogueEnablement().enabledModules,
      enabledSubModules: demoCatalogueEnablement().enabledSubModules,
    }),
  },
  {
    name: "ABHI",
    slug: ABHI_SLUG,
    workspaceType: "Customer",
    abhi: true,
  },
  {
    name: "OMNITRANSIT",
    slug: SAEC_SLUG,
    workspaceType: "Customer",
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
    workspaceType: "Customer",
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: AMANAH_SLUG,
      workspaceType: "Customer",
      ...fullCustomerEnablement,
    }),
  },
  {
    name: "INTERFACEWORX",
    slug: INTERFACE_WORX_SLUG,
    workspaceType: "Customer",
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: INTERFACE_WORX_SLUG,
      workspaceType: "Customer",
      ...fullCustomerEnablement,
    }),
  },
  {
    name: "GREENDESERT",
    slug: GREENDESERT_SLUG,
    workspaceType: "Customer",
    enablement: resolveWorkspaceNavEnablement({
      workspaceSlug: GREENDESERT_SLUG,
      workspaceType: "Customer",
      ...fullCustomerEnablement,
    }),
  },
];

for (const workspace of workspaceCases) {
  const sections = workspace.abhi
    ? buildAbhiNavSections(internalSurveyNavSections)
    : buildWorkspaceProductNavSections({
        workspaceSlug: workspace.slug,
        workspaceType: workspace.workspaceType,
        enablement: workspace.enablement!,
      });

  assertCorporateTaxonomyNav(corporateSection(sections), workspace.name, {
    allowAbhiCompanyLabel: workspace.abhi,
  });

  if (!workspace.abhi && workspace.enablement) {
    assert.ok(
      workspace.enablement.enabledModules.includes(CORPORATE_INFORMATION_MODULE_ID),
      `${workspace.name}: corporate-information module enabled in fixture`,
    );
    for (const feature of CORPORATE_INFORMATION_CORE_FEATURES) {
      const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
      assert.ok(sub);
      assert.ok(
        workspace.enablement.enabledSubModules.includes(
          subModuleKey(CORPORATE_INFORMATION_MODULE_ID, sub!.id),
        ),
        `${workspace.name}: submodule ${sub!.id} enabled in fixture`,
      );
    }
  }
}

// ABHI product taxonomy: Company Information Core Feature; ABHI nav may say Company Details.
assert.equal(CORPORATE_INFORMATION_ABHI_COMPANY_LABEL, "Company Details");
const abhiCompanyFeature = CORPORATE_INFORMATION_CORE_FEATURES.find(
  (feature) => feature.label === "Company Information",
);
assert.ok(abhiCompanyFeature);
assert.equal(abhiCompanyFeature!.viewId, "corporate-company-details");

console.log(
  "prove:corporate-information-taxonomy: OK — 1 Core Module, 6 Core Features, 5 Core Sub-features, 0 Custom; view IDs, routes, and tabs preserved across six workspaces.",
);
