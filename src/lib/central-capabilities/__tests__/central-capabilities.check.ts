/**
 * Central capabilities — navigation, permissions, content studio, and management smoke.
 * Run: npm run prove:central-capabilities
 */
import assert from "node:assert/strict";

import {
  canAccessManagementWorkspace,
  getVisibleContentStudioFunctions,
  getVisibleManagementFunctionPacks,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import {
  deleteManagementAction,
  deleteManagementFunctionPack,
  deleteManagementMeeting,
  getManagementState,
  resolveManagementWorkspaceSlug,
  upsertManagementAction,
  upsertManagementFunctionPack,
  upsertManagementMeeting,
  uploadManagementFunctionPack,
} from "@/lib/central-capabilities/management-store";
import { resolveManagementSection } from "@/lib/central-capabilities/management-nav";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import { CONTENT_STUDIO_FUNCTIONS } from "@/lib/central-capabilities/content-studio-placeholder";
import {
  buildAbhiNavSections,
  buildOnwardAirNavSections,
  getTalantonImpactNavSections,
} from "@/lib/internal-role-views";
import {
  internalSurveyNavSections,
  isInternalOperationsView,
  type InternalNavSection,
  type InternalNavItem,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";

function navIncludesView(
  sections: readonly InternalNavSection[],
  view: InternalOperationsView,
): boolean {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.view === view) return true;
      if (item.children?.some((child) => child.view === view)) return true;
    }
  }
  return false;
}

function sectionItems(sections: readonly InternalNavSection[], label: string): readonly InternalNavItem[] {
  return sections.find((section) => section.label === label)?.items ?? [];
}

function assertSurfaceNav(
  label: string,
  sections: readonly InternalNavSection[],
): void {
  assert.ok(
    navIncludesView(sections, "management"),
    `${label} nav must include Management`,
  );
  assert.ok(
    navIncludesView(sections, "content-studio"),
    `${label} nav must include Content Studio`,
  );
}

{
  assert.equal(isInternalOperationsView("management"), true);
  assert.equal(isInternalOperationsView("content-studio"), true);
}

{
  const executive = managementAccessFromEntitlements({
    roleView: "c-suite",
    roles: ["Exec"],
    departments: ["Finance"],
  });
  assert.equal(canAccessManagementWorkspace(executive), true);
  assert.ok(getVisibleManagementFunctionPacks(executive).length >= 4);
  assert.ok(getVisibleContentStudioFunctions(executive).length >= 8);
  assert.ok(
    getVisibleContentStudioFunctions(executive).includes("fundraising"),
    "executive must see fundraising in Content Studio",
  );
}

{
  const engineer = managementAccessFromEntitlements({
    roleView: "manager",
    roles: ["Associate"],
    departments: ["Design"],
  });
  assert.equal(canAccessManagementWorkspace(engineer), false);
  assert.ok(getVisibleContentStudioFunctions(engineer).length === 0);
}

{
  const admin = managementAccessFromEntitlements({
    roleView: "admin",
    roles: ["Admin"],
    departments: ["Corporate"],
  });
  assert.equal(canAccessManagementWorkspace(admin), true);
  assert.ok(getVisibleManagementFunctionPacks(admin).length >= 4);
  assert.ok(getVisibleContentStudioFunctions(admin).length >= 8);
}

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
});
assertSurfaceNav(
  "Demo",
  resolveWorkspaceNavBaseSections({
    workspaceSlug: "demo",
    workspaceType: "Demo",
    enablement: demoEnablement,
  }),
);
assertSurfaceNav("OnwardAir", buildOnwardAirNavSections(internalSurveyNavSections));
assertSurfaceNav("ABHI", buildAbhiNavSections(internalSurveyNavSections));

{
  const talanton = getTalantonImpactNavSections();
  assertSurfaceNav("Talanton", talanton);
  assert.ok(
    !talanton.some((section) => section.label === "Business Central"),
    "Talanton must not expose Business Central",
  );
  const productivity = sectionItems(talanton, "Business Productivity");
  const labels = productivity.flatMap((item) => [
    item.label,
    ...(item.children?.map((child) => child.label) ?? []),
  ]);
  for (const expected of [
    "Dashboard",
    "Content Studio",
    "Management",
    "Email",
    "Calendar",
    "Messaging",
    "Client Explorer",
    "Whiteboard",
  ]) {
    assert.ok(labels.includes(expected), `Talanton Business Productivity must include ${expected}`);
  }
}

{
  assert.ok(
    CONTENT_STUDIO_FUNCTIONS.some((node) => node.id === "fundraising"),
    "Content Studio catalogue must include Fundraising",
  );
}

{
  assert.equal(resolveManagementSection("function-packs"), "function-packs");
  assert.equal(resolveManagementSection("invalid"), "dashboard");
  assert.equal(resolveManagementWorkspaceSlug("demo.unit311central.com"), "demo");
  const management = buildCentralBusinessCentralNavSection().items.find(
    (item) => item.label === "Management",
  );
  assert.ok(management?.children?.length === 4, "Management must expose four nested sidebar leaves");
  assert.ok(
    management?.children?.some((child) => child.label === "Meetings" && child.query?.section === "meetings"),
    "Meetings must be a nested Management sidebar leaf",
  );
  const slug = resolveManagementWorkspaceSlug("demo.unit311central.com");
  const meeting = upsertManagementMeeting(slug, {
    name: "Test meeting",
    schedule: "Monday 10:00",
    participants: ["CEO"],
    functionPackLabel: "Test cycle",
    packsReady: 1,
    packsTotal: 2,
  });
  assert.equal(getManagementState(slug).meetings.some((row) => row.id === meeting.id), true);
  deleteManagementMeeting(slug, meeting.id);

  const pack = upsertManagementFunctionPack(slug, {
    title: "Test pack",
    ownerRole: "CFO",
    reportingPeriod: "August 2026",
  });
  uploadManagementFunctionPack(slug, pack.id, "cfo-pack.pdf");
  assert.equal(
    getManagementState(slug).functionPacks.find((row) => row.id === pack.id)?.uploadedFileName,
    "cfo-pack.pdf",
  );
  deleteManagementFunctionPack(slug, pack.id);

  const action = upsertManagementAction(slug, {
    title: "Test action",
    owner: "CFO",
    dueDate: "2026-08-20",
    meeting: "Test meeting",
    kind: "action",
    status: "open",
  });
  assert.equal(getManagementState(slug).actions.some((row) => row.id === action.id), true);
  deleteManagementAction(slug, action.id);
}

console.log("prove:central-capabilities: OK");
