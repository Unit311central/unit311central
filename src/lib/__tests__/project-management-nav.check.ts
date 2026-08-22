/**
 * Track A — Project Management nav standardisation (Demo + ABHI extract).
 */
import assert from "node:assert/strict";

import { ABHI_LOCKED_WORKSPACE_SECTION_ORDER } from "@/lib/abhi-nav-order";
import { buildAbhiNavSections } from "@/lib/internal-role-views";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import {
  PROJECT_MANAGEMENT_MODULE_LABEL,
  buildProjectManagementNavSection,
  stripProjectsFromBusinessCentral,
} from "@/lib/project-management-nav";

function sectionLabels(sections: readonly { label?: string | null }[]): string[] {
  return sections.map((section) => String(section.label ?? ""));
}

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
});
const demoNav = resolveWorkspaceNavBaseSections({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enablement: demoEnablement,
});
assert.ok(
  demoNav.some((section) => section.label === PROJECT_MANAGEMENT_MODULE_LABEL),
  "demo nav must expose top-level Project Management",
);
assert.ok(
  !demoNav.some(
    (section) =>
      section.label === "Business Central" &&
      section.items.some((item) => item.label === "Projects"),
  ),
  "demo Business Central must not nest Projects",
);

const abhiNav = buildAbhiNavSections(internalSurveyNavSections);
assert.ok(
  abhiNav.some((section) => section.label === PROJECT_MANAGEMENT_MODULE_LABEL),
  "ABHI nav must expose top-level Project Management",
);
assert.ok(
  !abhiNav.some(
    (section) =>
      section.label === "Business Central" &&
      section.items.some((item) => item.label === "Projects"),
  ),
  "ABHI Business Central must not nest Projects",
);
assert.ok(
  ABHI_LOCKED_WORKSPACE_SECTION_ORDER.includes(PROJECT_MANAGEMENT_MODULE_LABEL),
  "ABHI factory order must list Project Management",
);

const bc = internalSurveyNavSections.find((section) => section.label === "Business Central");
assert.ok(bc, "fixture Business Central section required");
const stripped = stripProjectsFromBusinessCentral(bc);
assert.ok(
  !stripped.items.some((item) => item.label === "Projects"),
  "stripProjectsFromBusinessCentral removes nested Projects",
);

const pm = buildProjectManagementNavSection();
assert.equal(pm.label, PROJECT_MANAGEMENT_MODULE_LABEL);
assert.ok(pm.items.some((item) => item.view === "projects-dashboard"));

console.log("ok  project-management-nav checks passed\n");
