/**
 * Workspace provisioning wizard rebuild — catalogue, isolation guards, MAM fixture.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_FOUNDER_BOOKING_TIMEZONE,
  FOUNDER_BOOKING_TIMEZONES,
} from "@/lib/founder-booking/timezones";
import {
  WORKSPACE_MODULE_CATALOGUE,
  WORKSPACE_MODULE_IDS,
  allCatalogueModuleSelections,
  allCatalogueProvisioningModuleKeys,
  countSelectedCatalogueModules,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  getWorkspaceProvisioningCountries,
  getWorkspaceProvisioningCurrencies,
  WORKSPACE_PROVISIONING_TIMEZONES,
} from "@/lib/platform-workspaces/workspace-provisioning-catalogues";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import { setWorkspaceAdminRepositoryForTests } from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import { createWorkspaceAdminRecord } from "@/lib/platform-workspaces/workspace-admin-service";
import { workspaceCreateFixture } from "@/lib/platform-workspaces/workspace-create-test-fixture";
import { buildWorkspaceProvisionTargets } from "@/lib/platform-workspaces/user-provisioning-adapter";

const wizardSource = readFileSync(
  path.join(process.cwd(), "src/components/platform-workspaces/NewWorkspaceWizard.tsx"),
  "utf8",
);

assert.equal(WORKSPACE_MODULE_CATALOGUE.length, 22);
assert.equal(WORKSPACE_MODULE_IDS.length, 22);
assert.equal(countSelectedCatalogueModules(allCatalogueModuleSelections().enabledModules), 22);

assert.deepEqual(
  WORKSPACE_PROVISIONING_TIMEZONES.map((entry) => entry.id),
  FOUNDER_BOOKING_TIMEZONES.map((entry) => entry.id),
  "Provisioning wizard must reuse Sales / Onboarding Discovery timezone catalogue",
);

const countries = getWorkspaceProvisioningCountries();
assert.ok(countries.length > 100, "Country dropdown must use complete ISO region catalogue");
assert.ok(countries.includes("United Kingdom"));
assert.ok(countries.includes("United States"));

const currencies = getWorkspaceProvisioningCurrencies();
assert.ok(currencies.length > 100, "Currency dropdown must use complete ISO 4217 catalogue");
assert.equal(currencies[0], "USD");
assert.equal(currencies[1], "GBP");

assert.ok(!/Demo Workspace|"Demo"\s*\]/i.test(wizardSource), "Demo workspace choice must be removed");
assert.ok(!/Employee CSV|CLIENT_CSV_TEMPLATE|EMPLOYEE_CSV_TEMPLATE/.test(wizardSource));
assert.ok(/WizardSelect/.test(wizardSource), "Wizard must use dropdown selects for country/timezone/currency");
assert.match(wizardSource, /WORKSPACE_MODULE_IDS\.length/);

const mamKeys = resolveProvisioningModuleKeys(
  ["home", "business-central", "financials", "settings"],
  allCatalogueModuleSelections().enabledSubModules.filter((key) =>
    ["home:", "business-central:", "financials:", "settings:"].some((prefix) => key.startsWith(prefix)),
  ),
);
assert.ok(mamKeys.length > 0);
assert.ok(
  mamKeys.every((key) => allCatalogueProvisioningModuleKeys().includes(key)),
  "Resolved module keys must stay within authoritative catalogue",
);

async function runMamMemoryFixture() {
  process.env.WORKSPACE_ADMIN_REPOSITORY = "memory";
  setWorkspaceAdminRepositoryForTests(createMemoryWorkspaceAdminRepository());

  try {
    const created = await createWorkspaceAdminRecord(
      workspaceCreateFixture({
        type: "Customer",
        name: "MAM",
        slug: "mam",
        companyName: "MAM",
        customerHostname: "mam",
        country: "United Kingdom",
        timezone: DEFAULT_FOUNDER_BOOKING_TIMEZONE,
        currency: "USD",
        employees: [],
        clients: [],
        enabledModules: ["home", "business-central", "financials", "settings"],
        initialAdministrator: {
          firstName: "MAM",
          lastName: "Admin",
          email: "admin@mam.example.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
        },
      }),
      "mam-provisioning-rebuild-test",
    );

    assert.equal(created.slug, "mam");
    assert.equal(created.customerHostname, "mam");
    assert.equal(created.pendingEmployees.length, 0);
    assert.equal(created.pendingClients.length, 0);
    assert.equal(created.enabledModules.length, 4);
    assert.equal(countSelectedCatalogueModules(created.enabledModules), 4);
    assert.equal(created.primaryUrl, "https://mam.unit311central.com");
    assert.equal(created.provisioning.overallStatus, "complete");

    const employeeTargets = buildWorkspaceProvisionTargets({
      workspaceId: created.workspaceId,
      workspaceSlug: created.slug,
      companyName: created.companyName,
      contactName: created.contact.name,
      contactEmail: created.contact.email,
      employees: [],
    });
    assert.equal(employeeTargets.length, 0);
  } finally {
    delete process.env.WORKSPACE_ADMIN_REPOSITORY;
    setWorkspaceAdminRepositoryForTests(null);
  }
}

(async () => {
  await runMamMemoryFixture();
  console.log("ok  workspace provisioning rebuild checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
