/**
 * Central capabilities placeholder shells — navigation + permission smoke.
 * Run: npm run prove:central-capabilities
 */
import assert from "node:assert/strict";

import { injectDemoNavSections } from "@/lib/demo/nav";
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
import {
  canAccessManagementWorkspace,
  getVisibleContentStudioFunctions,
  getVisibleManagementFunctionPacks,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import {
  buildAbhiNavSections,
  buildOnwardAirNavSections,
  getTalantonImpactNavSections,
} from "@/lib/internal-role-views";
import {
  internalSurveyNavSections,
  isInternalOperationsView,
  type InternalNavSection,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";

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

assertSurfaceNav("Demo", injectDemoNavSections(internalSurveyNavSections));
assertSurfaceNav("OnwardAir", buildOnwardAirNavSections(internalSurveyNavSections));
assertSurfaceNav("ABHI", buildAbhiNavSections(internalSurveyNavSections));
assertSurfaceNav("Talanton", getTalantonImpactNavSections());

{
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
    reportingPeriod: "March 2026",
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
    dueDate: "2026-03-20",
    meeting: "Test meeting",
    kind: "action",
    status: "open",
  });
  assert.equal(getManagementState(slug).actions.some((row) => row.id === action.id), true);
  deleteManagementAction(slug, action.id);
}

console.log("prove:central-capabilities: OK");
