/**
 * Central capabilities placeholder shells — navigation + permission smoke.
 * Run: npm run prove:central-capabilities
 */
import assert from "node:assert/strict";

import {
  canAccessManagementWorkspace,
  getVisibleContentStudioFunctions,
  getVisibleManagementFunctionPacks,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import { isInternalOperationsView } from "@/lib/internal-operations-data";

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

console.log("prove:central-capabilities: OK");
