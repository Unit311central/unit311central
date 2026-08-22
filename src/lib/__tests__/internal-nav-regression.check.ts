/**
 * Regression guard: Internal Central must never be filtered by wizard enablement metadata.
 */
import assert from "node:assert/strict";

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import type { InternalNavSection } from "@/lib/internal-operations-data";
import {
  resolveWorkspaceNavBaseSections,
  usesInternalPlatformNav,
} from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";

function sectionLabels(sections: readonly InternalNavSection[]): string[] {
  return sections.flatMap((section) =>
    section.kind === "pin"
      ? section.items.map((item) => item.label)
      : section.label
        ? [section.label]
        : [],
  );
}

const internalBaseLabels = sectionLabels(internalSurveyNavSections);

const LIMITED_INTERNAL_ENABLEMENT = {
  enabledModules: [
    "home",
    "executive-assistant",
    "business-central",
    "financials",
    "settings",
  ],
  enabledSubModules: [] as string[],
};

assert.equal(usesInternalPlatformNav("unit311", "Internal"), true);
assert.equal(usesInternalPlatformNav("unit311", null), true);
assert.equal(usesInternalPlatformNav(null, "Internal"), true);
assert.equal(usesInternalPlatformNav("demo", "Demo"), false);
assert.equal(usesInternalPlatformNav("interfaceworx", "Customer"), false);

const internalNav = resolveWorkspaceNavBaseSections({
  workspaceSlug: "unit311",
  workspaceType: "Internal",
  enablement: LIMITED_INTERNAL_ENABLEMENT,
});

assert.deepEqual(
  sectionLabels(internalNav),
  internalBaseLabels,
  "Internal Central must resolve to full internalSurveyNavSections",
);

assert.ok(
  internalBaseLabels.length >= 16,
  "Internal base navigation must include the full platform module set",
);

const requiredInternalSections = [
  "Business Central",
  "Sales Management",
  "Finances",
  "Human Resources",
  "Corporate Information",
  "Technology Management",
  "Business Productivity",
  "Support Desk",
  "Operations",
  "Training",
  "QMS",
  "Tools",
  "External Client Access",
  "Settings",
];

for (const label of requiredInternalSections) {
  assert.ok(
    internalBaseLabels.includes(label),
    `Internal Central navigation must include ${label}`,
  );
}

const canonicalFallback = resolveWorkspaceNavEnablement({
  workspaceSlug: "unit311",
  workspaceType: "Internal",
  enabledModules: LIMITED_INTERNAL_ENABLEMENT.enabledModules,
  enabledSubModules: LIMITED_INTERNAL_ENABLEMENT.enabledSubModules,
});

assert.equal(
  canonicalFallback.enabledModules.length,
  5,
  "sanity: limited metadata still models the old regression input",
);

assert.notDeepEqual(
  sectionLabels(internalNav),
  ["HOME", "EXECUTIVE ASSISTANT", "Business Central", "Finances", "Settings"],
  "Internal Central must not collapse to the 5-module canonical fallback",
);

console.log("ok  internal-nav-regression checks passed\n");
