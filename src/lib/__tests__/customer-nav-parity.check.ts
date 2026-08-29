/**
 * Canonical customer navigation parity — Demo and generic customers must share structure.
 */
import assert from "node:assert/strict";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { getIntelligencePackBySlug } from "@/lib/intelligence/registry";
import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";
import type { InternalNavItem, InternalNavSection } from "@/lib/internal-operations-data";
import {
  WORKSPACE_MODULE_CATALOGUE,
  WORKSPACE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";

function fullCatalogueEnablement() {
  const enabledModules = [...WORKSPACE_MODULE_IDS];
  return {
    enabledModules,
    enabledSubModules: defaultEnabledSubModules(enabledModules),
  };
}

function sectionLabels(sections: readonly InternalNavSection[]): string[] {
  return sections.flatMap((section) =>
    section.kind === "pin"
      ? section.items.map((item) => item.label)
      : section.label
        ? [section.label]
        : [],
  );
}

type NavTree = Record<string, unknown>;

function flattenNavItems(items: readonly InternalNavItem[]): unknown[] {
  return items.map((item) => {
    if (item.children?.length) {
      return { [item.label]: item.children.map((child) => child.label) };
    }
    return item.label;
  });
}

function navTree(sections: readonly InternalNavSection[]): NavTree {
  const tree: NavTree = {};
  for (const section of sections) {
    if (section.kind === "pin") {
      for (const item of section.items) tree[item.label] = [];
      continue;
    }
    if (!section.label) continue;
    tree[section.label] = flattenNavItems(section.items);
  }
  return tree;
}

function buildNavForSlug(slug: string, workspaceType: string, enablement?: ReturnType<typeof fullCatalogueEnablement>) {
  const resolvedEnablement =
    enablement ??
    resolveWorkspaceNavEnablement({
      workspaceSlug: slug,
      workspaceType,
    });
  return buildWorkspaceProductNavSections({
    workspaceSlug: slug,
    workspaceType,
    enablement: resolvedEnablement,
  });
}

function normalizeModuleLabels(labels: string[]): string[] {
  return labels.map((label) =>
    label === "INTELLIGENCE" || label.endsWith(" INTELLIGENCE") ? "Intelligence" : label,
  );
}

const fullEnablement = fullCatalogueEnablement();
const demoNav = buildNavForSlug(DEMO_WORKSPACE_SLUG, "Demo");
const customerNav = buildNavForSlug("interfaceworx", "Customer", fullEnablement);

const demoLabels = sectionLabels(demoNav);
const customerLabels = sectionLabels(customerNav);

assert.deepEqual(
  normalizeModuleLabels(customerLabels),
  normalizeModuleLabels(demoLabels),
  "Demo and customer must expose the same top-level modules when fully enabled",
);

const duplicateLabels = demoLabels.filter(
  (label, index) => demoLabels.indexOf(label) !== index,
);
assert.equal(
  duplicateLabels.length,
  0,
  `Demo must not duplicate modules: ${duplicateLabels.join(", ")}`,
);

// Business Central structure
const bc = buildCentralBusinessCentralNavSection();
const bcLabels = bc.items.map((item) => item.label);
assert.deepEqual(bcLabels, [
  "Dashboard",
  "Client Management",
  "Management",
  "Information Repository",
]);
assert.ok(!bcLabels.includes("Projects"), "Business Central must not include Projects");

const demoBc = navTree(demoNav)["Business Central"];
const customerBc = navTree(customerNav)["Business Central"];
assert.ok(JSON.stringify(demoBc).includes("Information Repository"), "Demo BC must include Information Repository");
assert.ok(!JSON.stringify(demoBc).includes("Grant Management"), "Demo BC must not include Grant Management");
assert.ok(!JSON.stringify(demoBc).includes("Projects"), "Demo BC must not include Projects");
assert.ok(!JSON.stringify(customerBc).includes("Projects"), "Customer BC must not include Projects");

// Fundraising / Board / Corporate Information separation
const demoTree = navTree(demoNav);
const customerTree = navTree(customerNav);

assert.ok(demoTree["Fundraising"], "Demo must include Fundraising");
assert.ok(customerTree["Fundraising"], "Customer must include Fundraising");
assert.ok(JSON.stringify(demoTree["Fundraising"]).includes("Cap Table"), "Cap Table under Fundraising");
assert.ok(!JSON.stringify(demoTree["Corporate Information"]).includes("Cap Table"));
assert.ok(!JSON.stringify(customerTree["Corporate Information"]).includes("Cap Table"));
assert.ok(!JSON.stringify(demoTree["Corporate Information"]).includes("Board Meetings"));
assert.ok(demoTree["Board"], "Demo must include Board");
assert.ok(customerTree["Board"], "Customer must include Board");

// Project Management separation
assert.ok(demoTree["Project Management"], "Demo must include Project Management");
assert.ok(customerTree["Project Management"], "Customer must include Project Management");

// Marketing & Events + Social
assert.ok(demoTree["Marketing & Events"], "Demo must include Marketing & Events");
assert.ok(JSON.stringify(demoTree["Marketing & Events"]).includes("Social"), "Social under Marketing & Events");
assert.ok(!JSON.stringify(demoTree["Business Productivity"]).includes("Social"), "Social not under Business Productivity");

// Intelligence
assert.ok(demoLabels.includes("NORTHSTAR INTELLIGENCE"), "Demo intelligence branding");
assert.ok(customerLabels.includes("INTERFACEWORX INTELLIGENCE"), "Customer intelligence label");
bootstrapIntelligenceWorkspacePacks();
assert.ok(getIntelligencePackBySlug("interfaceworx"), "Generic customer intelligence pack resolves");
assert.ok(getIntelligencePackBySlug(DEMO_WORKSPACE_SLUG), "Demo intelligence pack resolves");

// Engineering
assert.ok(demoTree["Engineering"], "Demo must include Engineering");
assert.ok(customerTree["Engineering"], "Customer must include Engineering");

// Wizard catalogue still has 22 modules
assert.equal(WORKSPACE_MODULE_CATALOGUE.length, 27);
const marketing = WORKSPACE_MODULE_CATALOGUE.find((entry) => entry.id === "marketing-events");
assert.ok(
  marketing?.subModules.some((sub) => sub.viewId === "social"),
  "Catalogue places Social under Marketing & Events",
);
const productivity = WORKSPACE_MODULE_CATALOGUE.find((entry) => entry.id === "business-productivity");
assert.ok(
  !productivity?.subModules.some((sub) => sub.viewId === "social"),
  "Catalogue must not place Social under Business Productivity",
);

// Resolver path matches direct builder for customer slug
const enablement = fullEnablement;
const resolved = resolveWorkspaceNavBaseSections({
  workspaceSlug: "acme-corp",
  workspaceType: "Customer",
  enablement,
});
assert.deepEqual(
  normalizeModuleLabels(sectionLabels(resolved)),
  normalizeModuleLabels(demoLabels),
);

console.log("ok  customer-nav-parity checks passed\n");
