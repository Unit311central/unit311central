/**
 * Marketing & Events — product taxonomy (Core Module → Core Features).
 *
 * Formalises the agreed Marketing & Events taxonomy against the EXISTING implementation.
 * Verification-only — does not change routing, views, provisioning, data, or other modules.
 *
 * Standard: 1 Core Module · 7 Core Features · 0 Core Sub-features · 0 Custom
 * ABHI: five standard Core Features + four Custom Features under the same module
 *
 * Run: npm run prove:marketing-events-taxonomy
 */
import assert from "node:assert/strict";

import { ABHI_SLUG } from "@/lib/abhi-surface";
import { ABHI_MARKETING_NAV_SECTION } from "@/lib/abhi/nav";
import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  AUDITED_CORE_MODULE_IDS,
  buildCoreProductTaxonomy,
  buildCustomProductTaxonomy,
  buildWorkspaceArchitectureTaxonomy,
} from "@/lib/architecture-taxonomy";
import type { ArchitectureTaxonomyNode } from "@/lib/architecture-taxonomy-types";
import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import { buildAbhiNavSections } from "@/lib/internal-role-views";
import {
  getInternalNavHref,
  internalSurveyNavSections,
  type InternalNavItem,
  type InternalNavSection,
} from "@/lib/internal-operations-data";
import {
  ABHI_MARKETING_CORE_FEATURE_VIEW_IDS,
  ABHI_MARKETING_CUSTOM_FEATURES,
  MARKETING_EVENTS_ABHI_MAILING_LIST_LABEL,
  MARKETING_EVENTS_CORE_FEATURES,
  MARKETING_EVENTS_CUSTOM_FEATURES,
  MARKETING_EVENTS_CUSTOM_SUB_FEATURES,
  MARKETING_EVENTS_EXCLUDED_VIEW_IDS,
  MARKETING_EVENTS_MODULE_ID,
  MARKETING_EVENTS_MODULE_LABEL,
  isAbhiMarketingCustomFeatureView,
  marketingEventsCoreFeatureCount,
  marketingEventsCoreSubFeatureCount,
} from "@/lib/marketing-events/marketing-events-taxonomy";
import { demoCatalogueEnablement } from "@/lib/platform-workspaces/demo-provisioning";
import { buildCentralMarketingEventsNavSection } from "@/lib/platform-workspaces/central-product-nav";
import {
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  subModuleKey,
  WORKSPACE_CORE_MODULE_IDS,
} from "@/lib/platform-workspaces/module-catalogue";
import { SAEC_ENABLED_MODULES, saecEnabledSubModules } from "@/lib/platform-workspaces/saec-provisioning";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { SAEC_SLUG } from "@/lib/saec-surface";

function child(node: ArchitectureTaxonomyNode, label: string): ArchitectureTaxonomyNode {
  const found = (node.children ?? []).find((entry) => entry.label === label);
  assert.ok(found, `expected child "${label}" under "${node.label}"`);
  return found!;
}

function labels(node: ArchitectureTaxonomyNode): string[] {
  return (node.children ?? []).map((entry) => entry.label);
}

function marketingSection(
  sections: readonly InternalNavSection[],
): InternalNavSection | undefined {
  return sections.find(
    (section) =>
      section.kind === "workspace" && section.label === MARKETING_EVENTS_MODULE_LABEL,
  );
}

// ---------------------------------------------------------------------------
// 1. Core Module
// ---------------------------------------------------------------------------
assert.equal(MARKETING_EVENTS_MODULE_ID, "marketing-events");
assert.equal(MARKETING_EVENTS_MODULE_LABEL, "Marketing & Events");
assert.equal(getCanonicalModule(MARKETING_EVENTS_MODULE_ID)?.label, MARKETING_EVENTS_MODULE_LABEL);
assert.ok(getWorkspaceModuleEntry(MARKETING_EVENTS_MODULE_ID));

// ---------------------------------------------------------------------------
// 2. Seven Core Features · zero Core Sub-features · zero standard Custom
// ---------------------------------------------------------------------------
assert.equal(marketingEventsCoreFeatureCount(), 7);
assert.equal(marketingEventsCoreSubFeatureCount(), 0);
assert.equal(MARKETING_EVENTS_CUSTOM_FEATURES.length, 0);
assert.equal(MARKETING_EVENTS_CUSTOM_SUB_FEATURES.length, 0);
assert.equal(ABHI_MARKETING_CUSTOM_FEATURES.length, 4);

// ---------------------------------------------------------------------------
// 3. Central product nav matches taxonomy (view IDs preserved)
// ---------------------------------------------------------------------------
const central = buildCentralMarketingEventsNavSection();
assert.equal(central.label, MARKETING_EVENTS_MODULE_LABEL);
assert.deepEqual(
  central.items.map((item) => item.label),
  MARKETING_EVENTS_CORE_FEATURES.map((feature) => feature.label),
);
assert.deepEqual(
  central.items.map((item) => item.view),
  MARKETING_EVENTS_CORE_FEATURES.map((feature) => feature.viewId),
);
for (const item of central.items) {
  assert.equal((item.children ?? []).length, 0, `${item.label} has no nav children`);
}

for (const excluded of MARKETING_EVENTS_EXCLUDED_VIEW_IDS) {
  const json = JSON.stringify(central);
  assert.ok(!json.includes(`"view":"${excluded}"`), `central nav must not include ${excluded}`);
}

// ---------------------------------------------------------------------------
// 4. Catalogue submodule keys align with Core Features (provisioning unchanged)
// ---------------------------------------------------------------------------
const catalogueSubs = getWorkspaceModuleEntry(MARKETING_EVENTS_MODULE_ID)?.subModules ?? [];
assert.equal(catalogueSubs.length, 7, "seven catalogue submodules = seven Core Features");
for (const feature of MARKETING_EVENTS_CORE_FEATURES) {
  const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
  assert.ok(sub, `catalogue submodule for ${feature.viewId}`);
  assert.equal(sub!.label, feature.label);
}

for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.ok(
    !catalogueSubs.some((sub) => sub.viewId === custom.viewId),
    `${custom.viewId} must not be a catalogue submodule`,
  );
}

// ---------------------------------------------------------------------------
// 5. Routes preserved
// ---------------------------------------------------------------------------
for (const feature of MARKETING_EVENTS_CORE_FEATURES) {
  const href = getInternalNavHref(feature.viewId, "/");
  assert.ok(href.includes(`view=${feature.viewId}`), `${feature.viewId} route preserved`);
}

// ---------------------------------------------------------------------------
// 6. ABHI Marketing & Events — five standard + four custom (same module)
// ---------------------------------------------------------------------------
assert.deepEqual(
  ABHI_MARKETING_NAV_SECTION.items.map((item) => item.view),
  [
    "marketing-newsletter",
    "social",
    "marketing-events",
    "marketing-abhi-events",
    "marketing-event-management",
    "marketing-working-groups",
    "marketing-us-accelerator",
    "marketing-me-accelerator",
    "marketing-mailing-list",
  ],
);

for (const viewId of ABHI_MARKETING_CORE_FEATURE_VIEW_IDS) {
  assert.ok(
    MARKETING_EVENTS_CORE_FEATURES.some((feature) => feature.viewId === viewId),
    `${viewId} is a standard Core Feature`,
  );
  assert.ok(!isAbhiMarketingCustomFeatureView(viewId), `${viewId} is not custom`);
}

for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.ok(isAbhiMarketingCustomFeatureView(custom.viewId), `${custom.viewId} is custom`);
}

const mailingListFeature = MARKETING_EVENTS_CORE_FEATURES.find(
  (feature) => feature.viewId === "marketing-mailing-list",
);
assert.ok(mailingListFeature);
assert.equal(mailingListFeature!.label, "Mailing List");
assert.equal(mailingListFeature!.abhiNavLabel, MARKETING_EVENTS_ABHI_MAILING_LIST_LABEL);

const abhiMailingListNav = ABHI_MARKETING_NAV_SECTION.items.find(
  (item) => item.view === "marketing-mailing-list",
);
assert.equal(abhiMailingListNav?.label, MARKETING_EVENTS_ABHI_MAILING_LIST_LABEL);

// ---------------------------------------------------------------------------
// 7. Six customer workspaces — standard nav when module enabled
// ---------------------------------------------------------------------------
type WorkspaceCase = {
  name: string;
  slug: string;
  workspaceType: "Demo" | "Customer";
  enablement?: ReturnType<typeof resolveWorkspaceNavEnablement>;
  abhi?: boolean;
};

function assertStandardMarketingTaxonomyNav(
  section: InternalNavSection | undefined,
  workspaceName: string,
): void {
  assert.ok(section, `${workspaceName}: Marketing & Events section must exist when enabled`);
  assert.equal(section!.items.length, 7, `${workspaceName}: seven Core Features`);

  for (let index = 0; index < MARKETING_EVENTS_CORE_FEATURES.length; index++) {
    const feature = MARKETING_EVENTS_CORE_FEATURES[index]!;
    const item: InternalNavItem = section!.items[index]!;
    assert.equal(item.label, feature.label, `${workspaceName}: ${feature.label} nav label`);
    assert.equal(item.view, feature.viewId, `${workspaceName}: ${feature.viewId} view id preserved`);
    assert.equal((item.children ?? []).length, 0, `${workspaceName}: ${feature.label} is a leaf`);
  }

  const json = JSON.stringify(section);
  for (const excluded of MARKETING_EVENTS_EXCLUDED_VIEW_IDS) {
    assert.ok(!json.includes(`"view":"${excluded}"`), `${workspaceName}: must not expose ${excluded}`);
  }
  for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
    assert.ok(
      !json.includes(`"view":"${custom.viewId}"`),
      `${workspaceName}: must not expose ABHI custom ${custom.viewId}`,
    );
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

  const section = marketingSection(sections);
  if (workspace.abhi) {
    assert.ok(section, "ABHI: Marketing & Events section must exist");
    assert.equal(section!.items.length, 9, "ABHI: nine nav items (five standard + four custom)");
    assert.ok(
      !section!.items.some((item) => item.view === "marketing-training"),
      "ABHI: marketing-training excluded",
    );
    assert.ok(
      !section!.items.some((item) => item.view === "oa-marketing-dashboard"),
      "ABHI: no Dashboard",
    );
    assert.ok(
      !section!.items.some((item) => item.view === "portfolio-stories"),
      "ABHI: no Client Stories",
    );
  } else {
    assertStandardMarketingTaxonomyNav(section, workspace.name);
    if (workspace.enablement) {
      assert.ok(
        workspace.enablement.enabledModules.includes(MARKETING_EVENTS_MODULE_ID),
        `${workspace.name}: marketing-events module enabled in fixture`,
      );
      for (const feature of MARKETING_EVENTS_CORE_FEATURES) {
        const sub = catalogueSubs.find((entry) => entry.viewId === feature.viewId);
        assert.ok(sub);
        assert.ok(
          workspace.enablement.enabledSubModules.includes(
            subModuleKey(MARKETING_EVENTS_MODULE_ID, sub!.id),
          ),
          `${workspace.name}: submodule ${sub!.id} enabled in fixture`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Living Architecture — Marketing & Events AUDITED; ABHI custom features
// ---------------------------------------------------------------------------
assert.ok(AUDITED_CORE_MODULE_IDS.has(MARKETING_EVENTS_MODULE_ID));

const core = buildCoreProductTaxonomy();
const coreModules = child(core, "CORE MODULES");
const marketing = child(coreModules, MARKETING_EVENTS_MODULE_LABEL);
assert.equal(marketing.audited, true);
assert.deepEqual(
  labels(marketing),
  MARKETING_EVENTS_CORE_FEATURES.map((feature) => feature.label),
);
for (const feature of MARKETING_EVENTS_CORE_FEATURES) {
  assert.equal(
    (child(marketing, feature.label).children ?? []).length,
    0,
    `${feature.label} has no Core Sub-features in standard product`,
  );
}
for (const custom of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.ok(
    !labels(marketing).includes(custom.label),
    `Core Product must not include ABHI custom ${custom.label}`,
  );
}

const custom = buildCustomProductTaxonomy();
const abhiCustom = child(child(custom, "CUSTOM FEATURES"), "ABHI");
assert.ok(child(abhiCustom, "Regulatory Intelligence"), "ABHI custom Regulatory Intelligence");
for (const feature of ABHI_MARKETING_CUSTOM_FEATURES) {
  const node = child(abhiCustom, feature.label);
  assert.equal(node.kind, "custom");
  assert.equal(node.level, "feature");
  assert.equal((node.children ?? []).length, 0, `${feature.label} has no sub-features`);
}

const workspaces = buildWorkspaceArchitectureTaxonomy("all");
const abhiWs = child(workspaces, "ABHI");
const abhiMarketing = child(child(abhiWs, "CORE MODULES"), MARKETING_EVENTS_MODULE_LABEL);
assert.deepEqual(labels(abhiMarketing), [
  "Digital Newsletter",
  "Social",
  "External Events",
  "ABHI Events",
  "Event Management",
  "ABHI Working Groups",
  "ABHI US Accelerator",
  "ABHI Middle East Accelerator",
  "Mailing List",
]);
for (const customLabel of ABHI_MARKETING_CUSTOM_FEATURES.map((entry) => entry.label)) {
  assert.equal(child(abhiMarketing, customLabel).kind, "custom");
}
for (const coreLabel of [
  "Digital Newsletter",
  "Social",
  "External Events",
  "Event Management",
  "Mailing List",
]) {
  assert.equal(child(abhiMarketing, coreLabel).kind, "core");
}

const abhiCustomGroup = child(abhiWs, "CUSTOM");
for (const feature of ABHI_MARKETING_CUSTOM_FEATURES) {
  assert.ok(child(abhiCustomGroup, feature.label), `ABHI CUSTOM includes ${feature.label}`);
}

const northstar = child(workspaces, "Northstar");
const northstarMarketing = child(child(northstar, "CORE MODULES"), MARKETING_EVENTS_MODULE_LABEL);
assert.deepEqual(
  labels(northstarMarketing),
  MARKETING_EVENTS_CORE_FEATURES.map((feature) => feature.label),
);
assert.equal((child(northstar, "CUSTOM").children ?? []).length, 0);

console.log(
  "prove:marketing-events-taxonomy: OK — 1 Core Module, 7 Core Features, 0 Core Sub-features, 0 standard Custom; ABHI four Custom Features under Marketing & Events preserved.",
);
