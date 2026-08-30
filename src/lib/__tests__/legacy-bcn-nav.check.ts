/**
 * Legacy BCN (unit311 internal) sidebar cleanup — Tools excludes Testing/Telemetry only.
 */
import assert from "node:assert/strict";

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { injectQaWorkspaceNav } from "@/lib/qa-workspace/nav";
import { TEST_WORKSPACE_SLUG } from "@/lib/qa-workspace/constants";
import {
  filterLegacyBcnToolsNavItems,
  LEGACY_BCN_EXCLUDED_TOOLS_VIEWS,
} from "@/lib/legacy-bcn-nav";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import {
  WORKSPACE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import { buildWorkspaceProductNavSections } from "@/lib/platform-workspaces/workspace-product-nav";

function toolsItemLabels(
  sections: readonly { kind: string; label: string; items?: { label: string }[] }[],
): string[] {
  const tools = sections.find((section) => section.kind === "workspace" && section.label === "Tools");
  return tools?.items?.map((item) => item.label) ?? [];
}

const fullEnablement = {
  enabledModules: [...WORKSPACE_MODULE_IDS],
  enabledSubModules: defaultEnabledSubModules(WORKSPACE_MODULE_IDS),
};

const unit311Nav = resolveWorkspaceNavBaseSections({
  workspaceSlug: INTERNAL_WORKSPACE_SLUG,
  workspaceType: "Internal",
});
const unit311Tools = toolsItemLabels(unit311Nav);
assert.ok(!unit311Tools.includes("Testing"), "unit311 Tools must not include Testing");
assert.ok(!unit311Tools.includes("Telemetry"), "unit311 Tools must not include Telemetry");
assert.ok(unit311Tools.includes("Website Management"), "unit311 Tools must keep Website Management");
assert.ok(unit311Tools.includes("Integrations"), "unit311 Tools must keep Integrations");
assert.ok(unit311Tools.includes("Users"), "unit311 Tools must keep Users");
assert.ok(unit311Tools.includes("Unit311 Support"), "unit311 Tools must keep Unit311 Support");

const testNav = injectQaWorkspaceNav(internalSurveyNavSections, TEST_WORKSPACE_SLUG);
const testTools = toolsItemLabels(testNav);
assert.ok(testTools.includes("Testing"), "Test workspace must keep Testing");
assert.ok(testTools.includes("Telemetry"), "Test workspace must keep Telemetry");

const interfaceworxNav = buildWorkspaceProductNavSections({
  workspaceSlug: INTERFACE_WORX_SLUG,
  workspaceType: "Customer",
  enablement: fullEnablement,
});
const iwTools = toolsItemLabels(interfaceworxNav);
assert.ok(!iwTools.includes("Testing"), "InterfaceWorx Tools must not include Testing");
assert.ok(!iwTools.includes("Telemetry"), "InterfaceWorx Tools must not include Telemetry");

const filtered = filterLegacyBcnToolsNavItems(
  internalSurveyNavSections.find((section) => section.label === "Tools")?.items ?? [],
);
assert.ok(
  filtered.every((item) => !item.view || !LEGACY_BCN_EXCLUDED_TOOLS_VIEWS.has(item.view)),
  "filter helper must remove only excluded views",
);

console.log("ok  legacy-bcn-nav checks passed\n");
