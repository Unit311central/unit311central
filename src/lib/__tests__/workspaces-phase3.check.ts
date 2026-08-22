/**
 * Phase 3 — Workspaces actual provisioning foundation.
 */
import assert from "node:assert/strict";

import {
  deriveDefaultCustomerHostname,
  isValidCustomerHostname,
  resolveCustomerHostname,
  workspacePrimaryUrlForWorkspace,
  WORKSPACE_HOSTNAME_EXAMPLES,
} from "@/lib/platform-workspaces/workspace-hostname";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import { setWorkspaceAdminRepositoryForTests } from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import {
  createWorkspaceAdminRecord,
  provisionWorkspaceAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { subModuleKey } from "@/lib/platform-workspaces/module-catalogue";
import { isWorkspaceProvisioningComplete } from "@/lib/platform-workspaces/workspace-provisioning-orchestrator";

assert.equal(WORKSPACE_HOSTNAME_EXAMPLES["interface-worx"], "interfaceworx");
assert.equal(deriveDefaultCustomerHostname("interface-worx"), "interfaceworx");
assert.equal(resolveCustomerHostname("interface-worx"), "interfaceworx");
assert.equal(
  workspacePrimaryUrlForWorkspace("interface-worx", "interfaceworx"),
  "https://interfaceworx.unit311central.com",
);
assert.notEqual(
  workspacePrimaryUrlForWorkspace("interface-worx"),
  "https://interface-worx.unit311central.com",
);
assert.ok(isValidCustomerHostname("interfaceworx"));
assert.equal(isValidCustomerHostname("internal"), false);

async function runPhase3MemoryTests() {
  process.env.WORKSPACE_ADMIN_REPOSITORY = "memory";
  setWorkspaceAdminRepositoryForTests(createMemoryWorkspaceAdminRepository());

  try {
    const slug = `phase3-test-${Date.now()}`;
    const created = await createWorkspaceAdminRecord(
      {
        type: "Customer",
        name: "Interface Worx",
        slug,
        customerHostname: "interfaceworx-test",
        companyName: "Interface Worx Ltd",
        contactName: "Owner",
        contactEmail: "owner@interfaceworx.example.com",
        country: "United Kingdom",
        timezone: "Europe/London",
        currency: "GBP",
        description: "Phase 3 acceptance workspace",
        enabledModules: ["home", "settings"],
        enabledSubModules: [subModuleKey("settings", "settings")],
        branding: {
          displayName: "Interface Worx",
          logoUrl: null,
          primaryColour: "#0b2d63",
          secondaryColour: "#2563eb",
        },
        employees: [],
        clients: [],
      },
      "phase3-test",
    );

    assert.equal(created.slug, slug);
    assert.equal(created.customerHostname, "interfaceworx-test");
    assert.equal(created.primaryUrl, "https://interfaceworx-test.unit311central.com");
    assert.equal(created.provisioning.overallStatus, "complete");
    assert.ok(isWorkspaceProvisioningComplete(created.provisioning));

    const reprovisioned = await provisionWorkspaceAdminRecord(created.workspaceId);
    assert.equal(reprovisioned.provisioning.overallStatus, "complete");
  } finally {
    delete process.env.WORKSPACE_ADMIN_REPOSITORY;
    setWorkspaceAdminRepositoryForTests(null);
  }
}

(async () => {
  await runPhase3MemoryTests();
  console.log("ok  workspaces phase 3 checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
