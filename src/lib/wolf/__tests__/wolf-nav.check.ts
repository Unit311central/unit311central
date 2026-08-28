/**
 * WOLF Central sidebar navigation checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-nav.check.ts
 */
import assert from "node:assert/strict";

import type { InternalNavChildItem, InternalNavItem } from "@/lib/internal-operations-data";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { buildWolfCentralNavSections } from "@/lib/wolf/wolf-nav";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

function collectLabels(
  items: readonly (InternalNavItem | InternalNavChildItem)[],
  out: string[] = [],
): string[] {
  for (const item of items) {
    out.push(item.label);
    if (item.children?.length) collectLabels(item.children, out);
  }
  return out;
}

const wolfNav = buildWolfCentralNavSections();
const allLabels = wolfNav.flatMap((section) => collectLabels(section.items));

assert.ok(!allLabels.some((label) => /coming soon/i.test(label)), "nav must not expose Coming soon items");
assert.equal(wolfNav.length, 8, "expected one pin + seven operational workspace groups");
assert.equal(wolfNav.filter((section) => section.kind === "pin").length, 1);
assert.equal(wolfNav.filter((section) => section.kind === "workspace").length, 7);

const sectionTitles = wolfNav
  .filter((section) => section.kind === "workspace")
  .map((section) => section.label);
assert.deepEqual(sectionTitles, [
  "Safari Parks",
  "Animals",
  "Drone Operations",
  "Containment",
  "Environment",
  "Fleet & Assets",
  "Administration",
]);

const hiddenPrototypeSections = [
  "Inventory",
  "Support",
  "Training",
  "Projects",
  "Leads",
  "Meetings",
  "Directory",
  "Information",
  "Content Studio",
  "Finance",
  "Settings",
];
for (const label of hiddenPrototypeSections) {
  assert.ok(!sectionTitles.includes(label), `prototype section "${label}" must stay hidden`);
}

function collectViews(
  items: readonly (InternalNavItem | InternalNavChildItem)[],
  out: string[] = [],
): string[] {
  for (const item of items) {
    if (item.view) out.push(item.view);
    if (item.children?.length) collectViews(item.children, out);
  }
  return out;
}

const views = wolfNav.flatMap((section) => collectViews(section.items));
assert.deepEqual(
  [...new Set(views)].sort(),
  [
    "appearance",
    "settings",
    "users",
    "wolf-animals",
    "wolf-containment",
    "wolf-drone-operations",
    "wolf-environment",
    "wolf-estate",
    "wolf-fleet",
    "wolf-safari-parks",
  ].sort(),
);

const resolvedWolf = resolveWorkspaceNavBaseSections({ workspaceSlug: WOLF_CENTRAL_SLUG });
assert.equal(resolvedWolf.length, 8);
assert.ok(resolvedWolf.some((section) => section.label === "Administration"));

const saecNav = resolveWorkspaceNavBaseSections({
  workspaceSlug: SAEC_SLUG,
  workspaceType: "customer",
});
assert.ok(!saecNav.some((section) => section.label === "Safari Parks"));
assert.ok(!saecNav.some((section) => section.label === "Administration"));

console.log("wolf-nav.check.ts — all assertions passed.");
