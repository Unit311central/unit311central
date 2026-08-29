/**
 * Intelligence Core Module taxonomy — six customer workspaces.
 * Run: npm run prove:intelligence-taxonomy
 */
import assert from "node:assert/strict";

import { AMANAH_SLUG } from "@/lib/amanah-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import { resolveIntelligenceNavLabel } from "@/lib/intelligence/intelligence-nav-labels";
import { getRegisteredIntelligencePackBySlug } from "@/lib/intelligence/registry";
import { isIntelligenceOperationsView } from "@/lib/intelligence/views";
import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";
import { buildAbhiNavSections } from "@/lib/internal-role-views";
import type { InternalNavSection } from "@/lib/internal-operations-data";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import {
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  WORKSPACE_CORE_MODULE_IDS,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { SAEC_SLUG } from "@/lib/saec-surface";

bootstrapIntelligenceWorkspacePacks();

const STANDARD_CORE_FEATURES = [
  "Dashboard",
  "Company Intelligence",
  "Client Intelligence",
  "Market Intelligence",
] as const;

const WORKSPACE_EXPECTATIONS = [
  { slug: DEMO_WORKSPACE_SLUG, label: "NORTHSTAR INTELLIGENCE", workspaceType: "Demo" },
  { slug: SAEC_SLUG, label: "OMNITRANSIT INTELLIGENCE", workspaceType: "Customer" },
  { slug: AMANAH_SLUG, label: "AMANAH INTELLIGENCE", workspaceType: "Customer" },
  { slug: INTERFACE_WORX_SLUG, label: "INTERFACEWORX INTELLIGENCE", workspaceType: "Customer" },
  { slug: GREENDESERT_SLUG, label: "GREENDESERT INTELLIGENCE", workspaceType: "Customer" },
] as const;

function intelligenceSectionForSlug(slug: string, workspaceType: string): InternalNavSection | undefined {
  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: slug,
    workspaceType,
    enabledModules: [...WORKSPACE_CORE_MODULE_IDS],
    enabledSubModules: defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS),
  });
  const sections = buildWorkspaceProductNavSections({
    workspaceSlug: slug,
    workspaceType,
    enablement,
  });
  return sections.find(
    (section) => section.kind === "workspace" && section.label?.endsWith(" INTELLIGENCE"),
  );
}

function flatNavLabels(section: InternalNavSection | undefined): string[] {
  if (!section || section.kind !== "workspace") return [];
  return section.items.flatMap((item) => {
    if (item.children?.length) {
      return [item.label, ...item.children.map((child) => child.label)];
    }
    return [item.label];
  });
}

assert.equal(isIntelligenceOperationsView("intelligence-dashboard"), true);

for (const workspace of WORKSPACE_EXPECTATIONS) {
  assert.equal(resolveIntelligenceNavLabel(workspace.slug), workspace.label);

  const section = intelligenceSectionForSlug(workspace.slug, workspace.workspaceType);
  assert.ok(section, `${workspace.label} nav section must exist`);
  assert.equal(section!.label, workspace.label);

  const labels = flatNavLabels(section);
  for (const feature of STANDARD_CORE_FEATURES) {
    assert.ok(labels.includes(feature), `${workspace.label} must include ${feature}`);
  }
  assert.ok(!labels.includes("Member Intelligence"), `${workspace.label} must not show Member Intelligence`);
  assert.ok(!labels.includes("Regulatory Intelligence"), `${workspace.label} must not show Regulatory Intelligence`);

  const pack = getRegisteredIntelligencePackBySlug(workspace.slug);
  assert.ok(pack, `Intelligence pack must register for ${workspace.slug}`);
  assert.equal(pack!.label, workspace.label);
  assert.ok(pack!.domains.some((domain) => domain.id === "dashboard"), `${workspace.slug} pack needs dashboard domain`);

  const json = JSON.stringify(section);
  for (const forbidden of ["__customer__", "customer-intelligence", "demo-intelligence", "saec-intelligence"]) {
    assert.ok(!json.includes(forbidden), `${workspace.label} nav must not expose ${forbidden}`);
  }
}

const abhiNav = buildAbhiNavSections(internalSurveyNavSections);
const abhiIntel = abhiNav.find((section) => section.label === "ABHI INTELLIGENCE");
assert.ok(abhiIntel, "ABHI must expose ABHI INTELLIGENCE section");
assert.equal(resolveIntelligenceNavLabel(ABHI_SLUG), "ABHI INTELLIGENCE");

const abhiLabels = flatNavLabels(abhiIntel);
assert.ok(abhiLabels.includes("Dashboard"));
assert.ok(abhiLabels.includes("Company Intelligence"));
assert.ok(abhiLabels.includes("Member Intelligence"));
assert.ok(!abhiLabels.includes("Client Intelligence"));
assert.ok(abhiLabels.includes("Market Intelligence"));
assert.ok(abhiLabels.includes("Regulatory Intelligence"));
assert.ok(abhiLabels.includes("Regulatory Updates"));
assert.ok(abhiLabels.includes("Impact Assessments"));
assert.ok(abhiLabels.includes("Member Alerts"));

const abhiPack = getRegisteredIntelligencePackBySlug(ABHI_SLUG);
assert.ok(abhiPack);
assert.ok(abhiPack!.domains.some((domain) => domain.id === "member"));
assert.ok(abhiPack!.domains.some((domain) => domain.id === "regulatory"));

assert.equal(defaultEnabledSubModules(WORKSPACE_CORE_MODULE_IDS).length, 163);

const intelligenceSubs = getWorkspaceModuleEntry("intelligence")?.subModules ?? [];
assert.ok(intelligenceSubs.some((sub) => sub.viewId === "intelligence-dashboard"));
assert.ok(intelligenceSubs.some((sub) => sub.viewId === "member-intelligence"));
assert.ok(intelligenceSubs.some((sub) => sub.viewId === "regulatory-dashboard"));

const bcLabels = buildCentralBusinessCentralNavSection().items.map((item) => item.label);
assert.deepEqual(bcLabels, [
  "Dashboard",
  "Client Management",
  "Management",
  "Grant Management",
  "Information Repository",
]);

console.log("prove:intelligence-taxonomy: OK");
