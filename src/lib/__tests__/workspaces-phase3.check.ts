/**
 * Phase 3 — generic workspace provisioning (no customer-specific hard-coding).
 */
import assert from "node:assert/strict";

import { slugifyOrganisationName } from "@/lib/organisation-slug";
import { subModuleKey } from "@/lib/platform-workspaces/module-catalogue";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import { setWorkspaceAdminRepositoryForTests } from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import {
  createWorkspaceAdminRecord,
  provisionWorkspaceAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-service";
import { canonicalizeWorkspaceHostSubdomain } from "@/lib/platform-workspaces/workspace-host-alias-service";
import {
  deriveCustomerHostnameFromLabel,
  deriveDefaultCustomerHostname,
  isValidCustomerHostname,
  resolveCustomerHostname,
  workspacePrimaryUrlForWorkspace,
} from "@/lib/platform-workspaces/workspace-hostname";
import { isWorkspaceProvisioningComplete } from "@/lib/platform-workspaces/workspace-provisioning-orchestrator";
import { buildWorkspaceProvisionTargets } from "@/lib/platform-workspaces/user-provisioning-adapter";
import { parseClientPlatformSubdomainSafe } from "@/lib/app-domains";

const HOSTNAME_CASES = [
  {
    label: "multi-word company with Ltd suffix",
    name: "Acme Manufacturing Ltd",
    slug: "acme-manufacturing-ltd",
    expectedHostname: "acmemanufacturingltd",
  },
  {
    label: "two-word brand without legal suffix",
    name: "North Star Analytics",
    slug: "north-star-analytics",
    expectedHostname: "northstaranalytics",
  },
  {
    label: "short slug differs from name-derived hostname",
    name: "Global Logistics Partners",
    slug: "glp",
    expectedHostname: "globallogisticspartners",
  },
  {
    label: "hyphenated slug derived from spaced name",
    name: "Blue Ocean Tech",
    slug: "blue-ocean-tech",
    expectedHostname: "blueoceantech",
  },
  {
    label: "apostrophe and punctuation in company name",
    name: "O'Brien & Sons",
    slug: "obrien-and-sons",
    expectedHostname: "obriensons",
  },
] as const;

for (const testCase of HOSTNAME_CASES) {
  assert.equal(
    deriveCustomerHostnameFromLabel(testCase.name),
    testCase.expectedHostname,
    `${testCase.label}: hostname from name`,
  );
  assert.equal(
    deriveDefaultCustomerHostname({
      workspaceName: testCase.name,
      workspaceSlug: testCase.slug,
    }),
    testCase.expectedHostname,
    `${testCase.label}: default hostname prefers name`,
  );
  assert.equal(
    resolveCustomerHostname(testCase.slug, null, testCase.name),
    testCase.expectedHostname,
    `${testCase.label}: resolve without override`,
  );
  assert.equal(
    workspacePrimaryUrlForWorkspace(testCase.slug, null, testCase.name),
    `https://${testCase.expectedHostname}.unit311central.com`,
    `${testCase.label}: primary URL`,
  );
  assert.notEqual(
    testCase.slug,
    testCase.expectedHostname,
    `${testCase.label}: slug and hostname should differ when slug contains hyphens`,
  );
}

assert.equal(
  deriveDefaultCustomerHostname({ workspaceSlug: "acme-mfg" }),
  "acmemfg",
  "slug-only fallback when name is absent",
);

assert.equal(
  resolveCustomerHostname("acme-mfg", "customhost", "Acme Manufacturing Ltd"),
  "customhost",
  "explicit hostname override wins",
);

assert.ok(isValidCustomerHostname("acmemanufacturingltd"));
assert.equal(isValidCustomerHostname("internal"), false);
assert.equal(isValidCustomerHostname(""), false);

assert.equal(
  canonicalizeWorkspaceHostSubdomain("acmemanufacturingltd", "acme-manufacturing-ltd"),
  "acme-manufacturing-ltd",
  "host subdomain resolves to canonical slug via DB alias",
);

assert.equal(
  canonicalizeWorkspaceHostSubdomain("acme-manufacturing-ltd", null),
  "acme-manufacturing-ltd",
  "host subdomain without alias keeps literal slug",
);

assert.equal(
  canonicalizeWorkspaceHostSubdomain("onward", null),
  "onwardair",
  "platform code alias still canonicalizes",
);

const acmeHost = "acmemanufacturingltd.unit311central.com";
assert.equal(
  parseClientPlatformSubdomainSafe(acmeHost),
  "acmemanufacturingltd",
  "customer host parses to compact subdomain",
);

const provisionTargets = buildWorkspaceProvisionTargets({
  workspaceId: "ws-test",
  workspaceSlug: "acme-manufacturing-ltd",
  companyName: "Acme Manufacturing Ltd",
  contactName: "Alex Owner",
  contactEmail: "owner@acme.example.com",
  employees: [
    {
      email: "staff@acme.example.com",
      firstName: "Sam",
      lastName: "Staff",
      role: "member",
    },
  ],
});

assert.equal(provisionTargets.length, 2);
assert.equal(provisionTargets[0]?.email, "owner@acme.example.com");
assert.equal(provisionTargets[0]?.isOwner, true);
assert.equal(provisionTargets[1]?.email, "staff@acme.example.com");

async function runGenericProvisioningMemoryTests() {
  process.env.WORKSPACE_ADMIN_REPOSITORY = "memory";
  setWorkspaceAdminRepositoryForTests(createMemoryWorkspaceAdminRepository());

  try {
    for (const testCase of HOSTNAME_CASES.slice(0, 2)) {
      const slug = `${testCase.slug}-${Date.now()}`;
      const created = await createWorkspaceAdminRecord(
        {
          type: "Customer",
          name: testCase.name,
          slug,
          companyName: testCase.name,
          contactName: "Primary Owner",
          contactEmail: `owner+${slug}@example.com`,
          country: "United Kingdom",
          timezone: "Europe/London",
          currency: "GBP",
          description: `Generic provisioning test: ${testCase.label}`,
          enabledModules: ["home", "settings"],
          enabledSubModules: [subModuleKey("settings", "settings")],
          branding: {
            displayName: testCase.name,
            logoUrl: null,
            primaryColour: "#0b2d63",
            secondaryColour: "#2563eb",
          },
          employees: [],
          clients: [],
        },
        "phase3-generic-test",
      );

      assert.equal(created.slug, slug);
      assert.equal(created.customerHostname, testCase.expectedHostname);
      assert.equal(created.primaryUrl, `https://${testCase.expectedHostname}.unit311central.com`);
      assert.equal(created.provisioning.overallStatus, "complete");
      assert.ok(isWorkspaceProvisioningComplete(created.provisioning));

      const reprovisioned = await provisionWorkspaceAdminRecord(created.workspaceId);
      assert.equal(reprovisioned.provisioning.overallStatus, "complete");
    }

    const customHostname = `acme-host-${Date.now()}`;
    const customSlug = `acme-mfg-${Date.now()}`;
    const custom = await createWorkspaceAdminRecord(
      {
        type: "Customer",
        name: "Acme Manufacturing Ltd",
        slug: customSlug,
        customerHostname: customHostname,
        companyName: "Acme Manufacturing Ltd",
        contactName: "Alex Owner",
        contactEmail: "owner@acme.example.com",
        country: "United Kingdom",
        timezone: "Europe/London",
        currency: "GBP",
        description: "Custom hostname override",
        enabledModules: ["home"],
        enabledSubModules: [],
        branding: {
          displayName: "Acme Manufacturing",
          logoUrl: null,
          primaryColour: "#0b2d63",
          secondaryColour: "#2563eb",
        },
        employees: [],
        clients: [],
      },
      "phase3-generic-test",
    );

    assert.equal(custom.customerHostname, customHostname);
    assert.equal(custom.primaryUrl, `https://${customHostname}.unit311central.com`);
    assert.notEqual(custom.slug, custom.customerHostname);
    assert.equal(slugifyOrganisationName("Acme Manufacturing Ltd"), "acme-manufacturing-ltd");
  } finally {
    delete process.env.WORKSPACE_ADMIN_REPOSITORY;
    setWorkspaceAdminRepositoryForTests(null);
  }
}

(async () => {
  await runGenericProvisioningMemoryTests();
  console.log("ok  workspaces phase 3 generic checks passed\n");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
