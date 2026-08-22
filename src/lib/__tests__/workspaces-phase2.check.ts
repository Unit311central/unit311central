/**
 * Phase 2 — Workspaces functional admin foundation.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { INTERNAL_SITE_HOST } from "@/lib/app-domains";
import { injectDemoNavSections } from "@/lib/demo/nav";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  filterInternalNavSectionsForDemoSurface,
} from "@/lib/internal-role-views";
import {
  CLIENT_CSV_TEMPLATE,
  EMPLOYEE_CSV_TEMPLATE,
  validateClientCsv,
  validateEmployeeCsv,
} from "@/lib/platform-workspaces/csv-import";
import {
  WORKSPACE_MODULE_CATALOGUE,
  defaultEnabledModules,
  defaultEnabledSubModules,
  resolveProvisioningModuleKeys,
  subModuleKey,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  archiveWorkspaceAdminRecord,
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
  listWorkspaceAdminRecords,
  updateWorkspaceAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { WORKSPACES_MODULE_LABEL } from "@/lib/workspaces-nav";

function withMockHostname<T>(hostname: string, fn: () => T): T {
  const prior = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { location: { hostname } },
  });
  try {
    return fn();
  } finally {
    if (prior === undefined) {
      // @ts-expect-error test cleanup
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: prior,
      });
    }
  }
}

assert.equal(WORKSPACE_MODULE_CATALOGUE.length, 22);
assert.equal(WORKSPACE_MODULE_CATALOGUE[0]?.label, "HOME");
assert.equal(WORKSPACE_MODULE_CATALOGUE[21]?.label, "SETTINGS");

const defaultModules = defaultEnabledModules();
assert.ok(defaultModules.includes("home"));
assert.ok(defaultModules.includes("financials"));
const defaultSubs = defaultEnabledSubModules(defaultModules);
assert.ok(defaultSubs.some((key) => key.startsWith("business-central:")));

const moduleKeys = resolveProvisioningModuleKeys(
  ["business-central", "financials"],
  [subModuleKey("business-central", "clients"), subModuleKey("financials", "overview")],
);
assert.ok(moduleKeys.includes("clients"));
assert.ok(moduleKeys.includes("financials"));

const employeeValidation = validateEmployeeCsv(EMPLOYEE_CSV_TEMPLATE);
assert.equal(employeeValidation.errors.length, 0);
assert.equal(employeeValidation.rows.length, 2);

const badEmployee = validateEmployeeCsv("email,first_name,last_name\nbad-email,Jane,Smith");
assert.ok(badEmployee.errors.length > 0);

const clientValidation = validateClientCsv(CLIENT_CSV_TEMPLATE);
assert.equal(clientValidation.errors.length, 0);
assert.equal(clientValidation.rows.length, 2);

const internalNav = withMockHostname(INTERNAL_SITE_HOST, () =>
  filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
    allowHostSurfaces: true,
  }),
);
assert.ok(internalNav.some((section) => section.label === WORKSPACES_MODULE_LABEL));

const demoNav = withMockHostname("demo.unit311central.com", () =>
  injectDemoNavSections(
    filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
      allowHostSurfaces: true,
    }),
  ),
);
assert.ok(!demoNav.some((section) => section.label === WORKSPACES_MODULE_LABEL));

async function runPhase2StoreTests() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "workspaces-phase2-"));
  const storeFile = path.join(tempDir, "admin-records.json");
  process.env.WORKSPACE_ADMIN_STORE_FILE = storeFile;

  try {
    const seeded = await listWorkspaceAdminRecords();
    assert.ok(seeded.length >= 3, "seeded workspace list should load");

    const filtered = await listWorkspaceAdminRecords({ query: "onwardair" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.slug, "onwardair");

    const slug = `phase2-test-${Date.now()}`;
    assert.equal(await isWorkspaceSlugAvailable(slug), true);

    const created = await createWorkspaceAdminRecord(
      {
        type: "Customer",
        name: "Phase 2 Test Workspace",
        slug,
        companyName: "Phase 2 Test Ltd",
        contactName: "Ops Lead",
        contactEmail: "ops@phase2.example.com",
        country: "United Kingdom",
        timezone: "Europe/London",
        currency: "GBP",
        description: "Phase 2 acceptance workspace",
        enabledModules: ["home", "business-central", "settings"],
        enabledSubModules: [
          subModuleKey("business-central", "clients"),
          subModuleKey("settings", "general"),
        ],
        branding: {
          displayName: "Phase 2 Test",
          logoUrl: null,
          primaryColour: "#0b2d63",
          secondaryColour: "#2563eb",
        },
        employees: employeeValidation.rows.slice(0, 1),
        clients: clientValidation.rows.slice(0, 1),
      },
      "phase2-test",
    );

    assert.ok(created.workspaceId);
    assert.equal(created.slug, slug);
    assert.equal(created.pendingEmployees.length, 1);
    assert.equal(created.pendingClients.length, 1);
    assert.equal(created.provisioning.workspaceRecordStatus, "complete");

    const listed = await listWorkspaceAdminRecords({ query: slug });
    assert.ok(listed.some((workspace) => workspace.workspaceId === created.workspaceId));

    const updated = await updateWorkspaceAdminRecord(created.workspaceId, {
      description: "Updated by Phase 2 test",
      enabledModules: ["home", "settings"],
      enabledSubModules: [subModuleKey("settings", "general")],
    });
    assert.equal(updated.description, "Updated by Phase 2 test");
    assert.deepEqual(updated.enabledModules, ["home", "settings"]);

    const archived = await archiveWorkspaceAdminRecord(created.workspaceId);
    assert.equal(archived.status, "Archived");

    const duplicateSlug = await isWorkspaceSlugAvailable(slug);
    assert.equal(duplicateSlug, false);
  } finally {
    delete process.env.WORKSPACE_ADMIN_STORE_FILE;
    await rm(tempDir, { recursive: true, force: true });
  }
}

(async () => {
  await runPhase2StoreTests();
  console.log("ok  workspaces phase 2 checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
