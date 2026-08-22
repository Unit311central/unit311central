/**
 * Phase 2 — Workspaces functional admin foundation.
 */
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { INTERNAL_SITE_HOST } from "@/lib/app-domains";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  filterInternalNavSectionsForDemoSurface,
} from "@/lib/internal-role-views";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import {
  CLIENT_CSV_TEMPLATE,
  EMPLOYEE_CSV_TEMPLATE,
  validateClientCsv,
  validateEmployeeCsv,
} from "@/lib/platform-workspaces/csv-import";
import {
  WORKSPACE_MODULE_CATALOGUE,
  WORKSPACE_PROVISIONING_FUNCTION_COUNT,
  defaultEnabledModules,
  defaultEnabledSubModules,
  resolveProvisioningModuleKeys,
  subModuleKey,
} from "@/lib/platform-workspaces/module-catalogue";
import { workspaceCreateFixture } from "@/lib/platform-workspaces/workspace-create-test-fixture";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import {
  setWorkspaceAdminRepositoryForTests,
} from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import {
  archiveWorkspaceAdminRecord,
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
  listWorkspaceAdminRecords,
  resolveWorkspaceAdminRepositoryKind,
  updateWorkspaceAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { WORKSPACES_MODULE_LABEL } from "@/lib/workspaces-nav";

const ADMIN_JSON_STORE_PATH = path.join(
  process.cwd(),
  ".data",
  "platform-workspaces",
  "admin-records.json",
);
const SERVICE_SOURCE_PATH = path.join(
  process.cwd(),
  "src/lib/platform-workspaces/workspace-admin-service.ts",
);

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
assert.equal(WORKSPACE_PROVISIONING_FUNCTION_COUNT, 148);
assert.equal(
  WORKSPACE_MODULE_CATALOGUE.find((m) => m.id === "human-resources")?.subModules.length,
  8,
  "HR must expose all eight central functions",
);
assert.ok(
  WORKSPACE_MODULE_CATALOGUE.find((m) => m.id === "engineering")?.subModules.some(
    (sub) => sub.id === "engineering-sops",
  ),
  "Engineering SOPs must remain optional central capability",
);

const defaultModules = defaultEnabledModules();
assert.ok(defaultModules.includes("home"));
assert.ok(defaultModules.includes("financials"));
const defaultSubs = defaultEnabledSubModules(defaultModules);
assert.ok(defaultSubs.some((key) => key.startsWith("business-central:")));

const moduleKeys = resolveProvisioningModuleKeys(
  ["business-central", "financials"],
  [
    subModuleKey("business-central", "clients"),
    subModuleKey("financials", "financials"),
  ],
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

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
});
const demoBase = resolveWorkspaceNavBaseSections({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enablement: demoEnablement,
});
const demoNav = withMockHostname("demo.unit311central.com", () =>
  filterInternalNavSectionsForDemoSurface(demoBase, {
    allowHostSurfaces: true,
  }),
);
assert.ok(!demoNav.some((section) => section.label === WORKSPACES_MODULE_LABEL));

async function assertJsonStoreNotWritten(beforeMtimeMs: number | null): Promise<void> {
  try {
    const afterStat = await stat(ADMIN_JSON_STORE_PATH);
    if (beforeMtimeMs == null) {
      assert.fail(
        "production Workspaces must not create .data/platform-workspaces/admin-records.json",
      );
    }
    assert.equal(
      afterStat.mtimeMs,
      beforeMtimeMs,
      "production Workspaces must not rewrite .data/platform-workspaces/admin-records.json",
    );
  } catch (error) {
    if (error instanceof assert.AssertionError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    assert.equal(code, "ENOENT", "JSON admin store file must not exist after Workspaces CRUD");
  }
}

async function runPersistenceTests() {
  const serviceSource = await readFile(SERVICE_SOURCE_PATH, "utf8");
  assert.ok(
    !serviceSource.includes("workspace-admin-store"),
    "workspace-admin-service must not import the JSON filesystem store",
  );
  assert.ok(
    !serviceSource.includes("admin-records.json"),
    "workspace-admin-service must not reference admin-records.json",
  );

  process.env.WORKSPACE_ADMIN_REPOSITORY = "memory";
  setWorkspaceAdminRepositoryForTests(createMemoryWorkspaceAdminRepository());

  let jsonStoreMtimeBefore: number | null = null;
  try {
    jsonStoreMtimeBefore = (await stat(ADMIN_JSON_STORE_PATH)).mtimeMs;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }

  try {
    assert.equal(resolveWorkspaceAdminRepositoryKind(), "memory");

    const seeded = await listWorkspaceAdminRecords();
    assert.ok(seeded.length >= 3, "seeded workspace list should load");

    const filtered = await listWorkspaceAdminRecords({ query: "onwardair" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.slug, "onwardair");

    const slug = `phase2-test-${Date.now()}`;
    assert.equal(await isWorkspaceSlugAvailable(slug), true);

    const created = await createWorkspaceAdminRecord(
      workspaceCreateFixture({
        name: "Phase 2 Test Workspace",
        slug,
        companyName: "Phase 2 Test Ltd",
        contactName: "Ops Lead",
        contactEmail: "ops@phase2.example.com",
        description: "Phase 2 acceptance workspace",
        enabledModules: ["home", "business-central", "settings"],
        enabledSubModules: [
          subModuleKey("business-central", "clients"),
          subModuleKey("settings", "settings"),
        ],
        branding: {
          displayName: "Phase 2 Test",
          logoUrl: null,
          primaryColour: "#0b2d63",
          secondaryColour: "#2563eb",
        },
        employees: employeeValidation.rows.slice(0, 1),
        clients: clientValidation.rows.slice(0, 1),
        initialAdministrator: {
          firstName: "Ops",
          lastName: "Lead",
          email: "admin@phase2.example.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
        },
      }),
      "phase2-test",
    );

    assert.ok(created.workspaceId);
    assert.equal(created.slug, slug);
    assert.equal(created.pendingEmployees.length, 1);
    assert.equal(created.pendingClients.length, 1);
    assert.equal(created.provisioning.workspaceRecordStatus, "complete");
    assert.equal(created.provisioning.overallStatus, "complete");
    assert.equal(created.enabledModules.length, 3);
    assert.equal(created.enabledSubModules.length, 2);
    assert.equal(created.branding.displayName, "Phase 2 Test");

    const listed = await listWorkspaceAdminRecords({ query: slug });
    assert.ok(listed.some((workspace) => workspace.workspaceId === created.workspaceId));

    const updated = await updateWorkspaceAdminRecord(created.workspaceId, {
      description: "Updated by Phase 2 test",
      enabledModules: ["home", "settings"],
      enabledSubModules: [subModuleKey("settings", "settings")],
      pendingEmployees: employeeValidation.rows,
      pendingClients: clientValidation.rows,
      branding: { ...created.branding, displayName: "Updated Phase 2 Test" },
    });
    assert.equal(updated.description, "Updated by Phase 2 test");
    assert.deepEqual(updated.enabledModules, ["home", "settings"]);
    assert.equal(updated.pendingEmployees.length, 2);
    assert.equal(updated.pendingClients.length, 2);
    assert.equal(updated.branding.displayName, "Updated Phase 2 Test");

    const archived = await archiveWorkspaceAdminRecord(created.workspaceId);
    assert.equal(archived.status, "Archived");

    const duplicateSlug = await isWorkspaceSlugAvailable(slug);
    assert.equal(duplicateSlug, false);

    await assertJsonStoreNotWritten(jsonStoreMtimeBefore);

    const priorRepository = process.env.WORKSPACE_ADMIN_REPOSITORY;
    process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
    setWorkspaceAdminRepositoryForTests(null);
    assert.equal(resolveWorkspaceAdminRepositoryKind(), "supabase");
    if (priorRepository === undefined) {
      Reflect.deleteProperty(process.env, "WORKSPACE_ADMIN_REPOSITORY");
    } else {
      process.env.WORKSPACE_ADMIN_REPOSITORY = priorRepository;
    }
  } finally {
    delete process.env.WORKSPACE_ADMIN_REPOSITORY;
    setWorkspaceAdminRepositoryForTests(null);
  }
}

(async () => {
  await runPersistenceTests();
  console.log("ok  workspaces phase 2 checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
