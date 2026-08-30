/**
 * Fundraising — product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Formalises the agreed Fundraising taxonomy against the EXISTING implementation.
 * Verification-only — does not change routing, views, provisioning, data, or other modules.
 *
 *   1 Core Module · 8 Core Features · 5 Core Sub-features · 0 Custom
 *
 * Run: npm run prove:fundraising-taxonomy
 */
import assert from "node:assert/strict";

import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import { demoCatalogueEnablement } from "@/lib/platform-workspaces/demo-provisioning";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import {
  FUNDRAISING_CORE_FEATURES,
  FUNDRAISING_CUSTOM_FEATURES,
  FUNDRAISING_CUSTOM_SUB_FEATURES,
  FUNDRAISING_EXCLUDED_TALANTON_VIEW_IDS,
  FUNDRAISING_MODULE_ID,
  FUNDRAISING_MODULE_LABEL,
  fundraisingCoreFeatureCount,
  fundraisingCoreSubFeatureCount,
} from "@/lib/fundraising/fundraising-taxonomy";
import { getAbhiNavSections } from "@/lib/internal-role-views";
import {
  getInternalNavHref,
  type InternalNavSection,
} from "@/lib/internal-operations-data";
import { buildCentralFundraisingNavSection } from "@/lib/platform-workspaces/central-product-nav";
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

// Talanton Funds / Portfolio view ids — must stay outside standard Fundraising taxonomy.
const TALANTON_FUNDRAISING_EXCLUDED_VIEWS = [
  "funds-dashboard",
  "funds-impact",
  "funds-momentum",
  "funds-stewards",
  "funds-investors",
  "funds-commitments",
  "funds-performance",
  "portfolio-dashboard",
  "portfolio-directory",
  "portfolio-portal-overview",
] as const;

// ---------------------------------------------------------------------------
// 1. Core Module
// ---------------------------------------------------------------------------
assert.equal(FUNDRAISING_MODULE_ID, "fundraising");
assert.equal(FUNDRAISING_MODULE_LABEL, "Fundraising");
assert.equal(getCanonicalModule(FUNDRAISING_MODULE_ID)?.label, FUNDRAISING_MODULE_LABEL);
assert.ok(getWorkspaceModuleEntry(FUNDRAISING_MODULE_ID));

// ---------------------------------------------------------------------------
// 2. Eight Core Features · five Core Sub-features · zero Custom
// ---------------------------------------------------------------------------
assert.equal(fundraisingCoreFeatureCount(), 8);
assert.equal(fundraisingCoreSubFeatureCount(), 5);
assert.equal(FUNDRAISING_CUSTOM_FEATURES.length, 0);
assert.equal(FUNDRAISING_CUSTOM_SUB_FEATURES.length, 0);

assert.deepEqual(
  FUNDRAISING_CORE_FEATURES.map((feature) => feature.label),
  [
    "Dashboard",
    "Investors",
    "Cap Table Management",
    "Pipeline",
    "Meetings",
    "Pitch Decks",
    "Data Rooms",
    "Grant Management",
  ],
);

const leafFeatures = FUNDRAISING_CORE_FEATURES.filter((feature) => !feature.subFeatures?.length);
assert.equal(leafFeatures.length, 7, "seven Core Features have zero Core Sub-features");
for (const feature of leafFeatures) {
  assert.equal(feature.subFeatures, undefined, `${feature.label} must not have sub-features`);
}

const grantManagement = FUNDRAISING_CORE_FEATURES.find((feature) => feature.label === "Grant Management");
assert.ok(grantManagement);
assert.equal(grantManagement!.viewId, "grants");
assert.deepEqual(
  grantManagement!.subFeatures!.map((sub) => sub.label),
  [
    "KPI Summary",
    "Pipeline by Status",
    "Funding by Programme",
    "Submissions vs Approvals",
    "Grant Applications",
  ],
);

// ---------------------------------------------------------------------------
// 3. Central product nav matches taxonomy (view IDs preserved)
// ---------------------------------------------------------------------------
const central = buildCentralFundraisingNavSection();
assert.equal(central.label, FUNDRAISING_MODULE_LABEL);
assert.deepEqual(
  central.items.map((item) => item.label),
  FUNDRAISING_CORE_FEATURES.map((feature) => feature.label),
);
assert.deepEqual(
  central.items.map((item) => item.view),
  FUNDRAISING_CORE_FEATURES.map((feature) => feature.viewId),
);

// ---------------------------------------------------------------------------
// 4. Catalogue submodule keys align with Core Features (provisioning unchanged)
// ---------------------------------------------------------------------------
const catalogueSubs = getWorkspaceModuleEntry(FUNDRAISING_MODULE_ID)?.subModules ?? [];
assert.equal(catalogueSubs.length, 8, "eight catalogue submodules = eight Core Features");
for (const feature of FUNDRAISING_CORE_FEATURES) {
  const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
  assert.ok(sub, `catalogue submodule for ${feature.viewId}`);
  assert.equal(sub!.label, feature.label);
  assert.deepEqual(sub!.moduleKeys, ["fundraising"], `${feature.viewId} must map to fundraising module keys`);
}

const grantsSub = catalogueSubs.find((entry) => entry.viewId === "grants");
assert.ok(grantsSub, "grants catalogue submodule must exist");
assert.deepEqual(grantsSub!.moduleKeys, ["fundraising"]);
assert.ok(!grantsSub!.moduleKeys.includes("projects"), "grants must not classify under projects");

// ---------------------------------------------------------------------------
// 5. Routes and view IDs preserved
// ---------------------------------------------------------------------------
for (const feature of FUNDRAISING_CORE_FEATURES) {
  const href = getInternalNavHref(feature.viewId, "/");
  assert.ok(href.includes(`view=${feature.viewId}`), `${feature.viewId} route preserved`);
}

// ---------------------------------------------------------------------------
// 6. Talanton Funds / Portfolio remain outside standard Fundraising taxonomy
// ---------------------------------------------------------------------------
for (const viewId of FUNDRAISING_EXCLUDED_TALANTON_VIEW_IDS) {
  assert.ok(
    !(FUNDRAISING_CORE_FEATURES as readonly { viewId: string }[]).some(
      (feature) => feature.viewId === viewId,
    ),
    `Talanton view ${viewId} must not be a Fundraising Core Feature`,
  );
  assert.ok(
    (TALANTON_FUNDRAISING_EXCLUDED_VIEWS as readonly string[]).includes(viewId),
    `Talanton view ${viewId} must remain Talanton-specific`,
  );
}

// ---------------------------------------------------------------------------
// 7. Six customer workspaces — structure when Fundraising is enabled (no force-enable)
// ---------------------------------------------------------------------------
type WorkspaceCase = {
  name: string;
  slug: string;
  workspaceType: "Demo" | "Customer";
  enablement?: ReturnType<typeof resolveWorkspaceNavEnablement>;
  abhi?: boolean;
  expectFundraisingNav?: boolean;
};

function fundraisingSection(
  sections: readonly InternalNavSection[],
): InternalNavSection | undefined {
  return sections.find(
    (section) => section.kind === "workspace" && section.label === FUNDRAISING_MODULE_LABEL,
  );
}

function assertFundraisingTaxonomyNav(
  section: InternalNavSection | undefined,
  workspaceName: string,
): void {
  assert.ok(section, `${workspaceName}: Fundraising section must exist when enabled`);
  assert.equal(section!.items.length, 8, `${workspaceName}: eight Core Features`);

  for (let index = 0; index < FUNDRAISING_CORE_FEATURES.length; index++) {
    const feature = FUNDRAISING_CORE_FEATURES[index]!;
    const item = section!.items[index]!;
    assert.equal(item.label, feature.label, `${workspaceName}: ${feature.label} nav label`);
    assert.equal(item.view, feature.viewId, `${workspaceName}: ${feature.viewId} view id preserved`);
    assert.equal((item.children ?? []).length, 0, `${workspaceName}: ${feature.label} is a leaf`);
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
    expectFundraisingNav: true,
  },
  {
    name: "ABHI",
    slug: ABHI_SLUG,
    workspaceType: "Customer",
    abhi: true,
    expectFundraisingNav: false,
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
    expectFundraisingNav: true,
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
    expectFundraisingNav: true,
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
    expectFundraisingNav: true,
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
    expectFundraisingNav: true,
  },
];

for (const workspace of workspaceCases) {
  const sections = workspace.abhi
    ? getAbhiNavSections()
    : buildWorkspaceProductNavSections({
        workspaceSlug: workspace.slug,
        workspaceType: workspace.workspaceType,
        enablement: workspace.enablement!,
      });

  const section = fundraisingSection(sections);
  if (workspace.expectFundraisingNav) {
    assertFundraisingTaxonomyNav(section, workspace.name);
    for (const feature of FUNDRAISING_CORE_FEATURES) {
      const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
      assert.ok(sub);
      assert.ok(
        workspace.enablement!.enabledSubModules.includes(
          subModuleKey(FUNDRAISING_MODULE_ID, sub!.id),
        ),
        `${workspace.name}: submodule ${sub!.id} enabled in fixture`,
      );
    }
  } else {
    assert.equal(section, undefined, `${workspace.name}: must not expose Fundraising navigation`);
  }
}

console.log(
  "prove:fundraising-taxonomy: OK — 1 Core Module, 8 Core Features, 5 Core Sub-features, 0 Custom; view IDs, routes, and Grant Management under Fundraising preserved across six workspaces.",
);
