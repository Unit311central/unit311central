/**
 * Workspace provisioning final scope — validation, hostname, and memory provisioning checks.
 */
import assert from "node:assert/strict";

import {
  validateInitialWorkspaceAdministrator,
  validateLoginPageTitle,
  parseDataUrlImage,
} from "@/lib/platform-workspaces/provisioning-validation";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import { setWorkspaceAdminRepositoryForTests } from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import {
  createWorkspaceAdminRecord,
  provisionWorkspaceAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { workspaceCreateFixture } from "@/lib/platform-workspaces/workspace-create-test-fixture";
import {
  deriveDefaultCustomerHostname,
  deriveCustomerHostnameFromLabel,
} from "@/lib/platform-workspaces/workspace-hostname";
import { isWorkspaceProvisioningComplete } from "@/lib/platform-workspaces/workspace-provisioning-orchestrator";

assert.equal(deriveCustomerHostnameFromLabel("Interface Worx"), "interfaceworx");
assert.equal(
  deriveDefaultCustomerHostname({ workspaceSlug: "interface-worx", workspaceName: "Interface Worx" }),
  "interfaceworx",
);

assert.equal(validateLoginPageTitle(""), "Login page title is required.");
assert.equal(validateLoginPageTitle("Acme Login"), null);

const invalidAdmin = validateInitialWorkspaceAdministrator({
  firstName: "",
  lastName: "Admin",
  email: "bad-email",
  password: "short",
  confirmPassword: "other",
});
assert.equal(invalidAdmin.ok, false);

const validAdmin = validateInitialWorkspaceAdministrator({
  firstName: "Alex",
  lastName: "Admin",
  email: "admin@example.com",
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!",
});
assert.equal(validAdmin.ok, true);

const tinyPng = parseDataUrlImage(
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
);
assert.ok(tinyPng?.bytes.length);

async function runMemoryProvisioningChecks() {
  process.env.WORKSPACE_ADMIN_REPOSITORY = "memory";
  setWorkspaceAdminRepositoryForTests(createMemoryWorkspaceAdminRepository());

  try {
    const slug = `final-scope-${Date.now()}`;
    const created = await createWorkspaceAdminRecord(
      workspaceCreateFixture({
        name: "Interface Worx",
        slug,
        companyName: "Interface Worx",
        customerHostname: "interfaceworx",
        loginPage: {
          title: "Interface Worx",
          logoDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          backgroundDataUrl: null,
        },
        initialAdministrator: {
          firstName: "Taylor",
          lastName: "Admin",
          email: `admin+${slug}@example.com`,
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
        },
      }),
      "final-scope-test",
    );

    assert.equal(created.customerHostname, "interfaceworx");
    assert.equal(created.loginPage.title, "Interface Worx");
    assert.equal(created.initialAdministrator?.email, `admin+${slug}@example.com`);
    assert.equal(created.provisioning.loginPageStatus, "complete");
    assert.equal(created.provisioning.initialAdminStatus, "complete");
    assert.ok(isWorkspaceProvisioningComplete(created.provisioning));

    const reprovisioned = await provisionWorkspaceAdminRecord(created.workspaceId);
    assert.equal(reprovisioned.provisioning.overallStatus, "complete");
    assert.equal(reprovisioned.initialAdministrator?.email, created.initialAdministrator?.email);
  } finally {
    delete process.env.WORKSPACE_ADMIN_REPOSITORY;
    setWorkspaceAdminRepositoryForTests(null);
  }
}

(async () => {
  await runMemoryProvisioningChecks();
  console.log("ok  workspace provisioning final scope checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
