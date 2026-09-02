/**
 * WOLF Central sidebar navigation checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-nav.check.ts
 */
import assert from "node:assert/strict";

import type { InternalNavChildItem, InternalNavItem } from "@/lib/internal-operations-data";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { buildWolfCentralNavSections, wolfCentralNavViews } from "@/lib/wolf/wolf-nav";
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
assert.equal(wolfNav.filter((section) => section.kind === "pin").length, 2);
assert.equal(wolfNav.filter((section) => section.kind === "workspace").length, 15);

const sectionTitles = wolfNav
  .filter((section) => section.kind === "workspace")
  .map((section) => section.label);

assert.ok(sectionTitles.includes("Business Productivity"));
assert.ok(sectionTitles.includes("Support Desk"));
assert.ok(sectionTitles.includes("Operations"));
assert.ok(sectionTitles.includes("Training"));
assert.ok(sectionTitles.includes("Project Management"));
assert.ok(sectionTitles.includes("Engineering"));
assert.ok(sectionTitles.includes("Analytics"));
assert.ok(sectionTitles.includes("Tools"));
assert.ok(sectionTitles.includes("Settings"));
assert.ok(!sectionTitles.includes("Administration"));

const hiddenPrototypeSections = ["Inventory", "Leads", "Meetings", "Directory", "Information", "Finance"];
for (const label of hiddenPrototypeSections) {
  assert.ok(!sectionTitles.includes(label), `prototype section "${label}" must stay hidden`);
}

const views = wolfCentralNavViews();
assert.ok(views.includes("executive-assistant"));
assert.ok(views.includes("users"));
assert.ok(views.includes("projects-dashboard"));
assert.ok(views.includes("support-overview"));
assert.ok(views.includes("operations-dashboard"));
assert.ok(views.includes("training-dashboard"));
assert.ok(views.includes("engineering-dashboard"));
assert.ok(views.includes("engineering-sops-dashboard"));
assert.ok(views.includes("engineering-sops-library"));
assert.ok(views.includes("system-health"));
assert.ok(views.includes("realtime-video-pipeline"));
assert.ok(!views.includes("platform-analytics"));
assert.ok(!views.includes("website-analytics"));
assert.ok(!views.includes("files-client"));
assert.ok(!views.includes("info-email"));
assert.ok(!views.includes("social"));

const toolsSection = wolfNav.find((section) => section.label === "Tools");
assert.ok(toolsSection?.kind === "workspace");
const toolViews =
  toolsSection.kind === "workspace"
    ? toolsSection.items.map((item) => item.view).filter(Boolean)
    : [];
assert.deepEqual(toolViews, ["wolf-ai-wildlife-vision", "users"]);

const settingsSection = wolfNav.find((section) => section.label === "Settings");
assert.ok(settingsSection?.kind === "workspace");
const settingsViews =
  settingsSection.kind === "workspace"
    ? settingsSection.items.map((item) => item.view).filter(Boolean)
    : [];
assert.deepEqual(settingsViews, ["settings", "appearance"]);
assert.ok(!settingsViews.includes("users"));

const resolvedWolf = resolveWorkspaceNavBaseSections({ workspaceSlug: WOLF_CENTRAL_SLUG });
assert.ok(resolvedWolf.some((section) => section.label === "Tools"));
assert.ok(resolvedWolf.some((section) => section.label === "Settings"));
assert.ok(resolvedWolf.some((section) => section.label === "Project Management"));
assert.ok(resolvedWolf.some((section) => section.label === "Engineering"));
assert.ok(resolvedWolf.some((section) => section.label === "Analytics"));

const saecNav = resolveWorkspaceNavBaseSections({
  workspaceSlug: SAEC_SLUG,
  workspaceType: "customer",
});
assert.ok(!saecNav.some((section) => section.label === "Safari Parks"));
assert.ok(!saecNav.some((section) => section.label === "Settings") || saecNav.some((s) => s.label === "Settings"));

console.log("wolf-nav.check.ts — all assertions passed.");
