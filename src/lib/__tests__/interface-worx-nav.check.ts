/**
 * InterfaceWorx sidebar cleanup — Tools excludes Testing/Telemetry only on interfaceworx.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { injectQaWorkspaceNav } from "@/lib/qa-workspace/nav";
import { TEST_WORKSPACE_SLUG } from "@/lib/qa-workspace/constants";
import {
  filterInterfaceWorxToolsNavItems,
  INTERFACE_WORX_EXCLUDED_TOOLS_VIEWS,
} from "@/lib/interface-worx-nav";
import { INTERFACE_WORX_SLUG } from "@/lib/interface-worx-surface";
import {
  WORKSPACE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import { buildWorkspaceProductNavSections } from "@/lib/platform-workspaces/workspace-product-nav";

function toolsItemLabels(sections: ReturnType<typeof buildWorkspaceProductNavSections>): string[] {
  const tools = sections.find((section) => section.kind === "workspace" && section.label === "Tools");
  return tools?.items.map((item) => item.label) ?? [];
}

const fullEnablement = {
  enabledModules: [...WORKSPACE_MODULE_IDS],
  enabledSubModules: defaultEnabledSubModules(WORKSPACE_MODULE_IDS),
};

const interfaceworxNav = injectQaWorkspaceNav(
  buildWorkspaceProductNavSections({
    workspaceSlug: INTERFACE_WORX_SLUG,
    workspaceType: "Customer",
    enablement: fullEnablement,
  }),
  INTERFACE_WORX_SLUG,
);

const interfaceworxTools = toolsItemLabels(interfaceworxNav);
assert.ok(!interfaceworxTools.includes("Testing"), "InterfaceWorx Tools must not include Testing");
assert.ok(!interfaceworxTools.includes("Telemetry"), "InterfaceWorx Tools must not include Telemetry");
assert.deepEqual(interfaceworxTools, [
  "Website Management",
  "Integrations",
  "Users",
  "Unit311 Support",
  "QA Tasks",
]);

const testNav = injectQaWorkspaceNav(internalSurveyNavSections, TEST_WORKSPACE_SLUG);
const testTools = testNav.find((section) => section.kind === "workspace" && section.label === "Tools");
assert.ok(testTools, "Test workspace must have Tools section");
const testToolLabels = testTools!.items.map((item) => item.label);
assert.ok(testToolLabels.includes("Testing"), "Test workspace must keep Testing");
assert.ok(testToolLabels.includes("Telemetry"), "Test workspace must keep Telemetry");
assert.ok(testToolLabels.includes("QA Tasks"), "Test workspace must keep QA Tasks");

const filtered = filterInterfaceWorxToolsNavItems(
  (testTools?.items ?? []).filter((item) => item.label !== "QA Tasks"),
);
assert.ok(
  filtered.every((item) => !item.view || !INTERFACE_WORX_EXCLUDED_TOOLS_VIEWS.has(item.view)),
  "filter helper must remove only excluded views",
);

const providerSource = readFileSync("src/components/qa-workspace/QaWorkspaceProvider.tsx", "utf8");
assert.match(providerSource, /<QaModeOverlay/);
assert.ok(!/QaBetaReport/.test(providerSource), "QA Mode must not use beta Report Issue workflow");

console.log("ok  interface-worx-nav checks passed\n");
