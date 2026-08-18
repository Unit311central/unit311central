/**
 * Central capabilities placeholder shells — navigation + permission smoke.
 * Run: npm run prove:central-capabilities
 */
import assert from "node:assert/strict";

import { injectDemoNavSections } from "@/lib/demo/nav";
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

console.log("prove:central-capabilities: OK");
