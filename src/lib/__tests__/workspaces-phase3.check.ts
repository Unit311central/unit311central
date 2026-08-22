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
    label: "multi-word company with hyphenated slug",
    name: "Acme Manufacturing Ltd",
    slug: "acme-manufacturing-ltd",
    expectedHostname: "acme-manufacturing-ltd",
  },
  {
    label: "two-word brand with compact slug",
    name: "North Star Analytics",
    slug: "north-star-analytics",
    expectedHostname: "north-star-analytics",
  },
  {
    label: "short slug differs from company name",
    name: "Global Logistics Partners",
    slug: "glp",
    expectedHostname: "glp",
  },
  {
    label: "hyphenated slug",
    name: "Blue Ocean Tech",
    slug: "blue-ocean-tech",
    expectedHostname: "blue-ocean-tech",
  },
  {
    label: "apostrophe and punctuation in company name",
    name: "O'Brien & Sons",
    slug: "obrien-and-sons",
    expectedHostname: "obrien-and-sons",
  },
] as const;

for (const testCase of HOSTNAME_CASES) {
  assert.equal(
    deriveCustomerHostnameFromLabel(testCase.name),
    testCase.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 64),
    `${testCase.label}: label helper still strips punctuation from names`,
  );
  assert.equal(
    deriveDefaultCustomerHostname({ workspaceSlug: testCase.slug }),
    testCase.expectedHostname,
    `${testCase.label}: default hostname uses slug only`,
  );
  assert.equal(
    resolveCustomerHostname(testCase.slug),
    testCase.expectedHostname,
    `${testCase.label}: resolve without override uses slug`,
  );
  assert.equal(
    workspacePrimaryUrlForWorkspace(testCase.slug),
    `https://${testCase.expectedHostname}.unit311central.com`,
    `${testCase.label}: primary URL`,
  );
}

assert.equal(resolveCustomerHostname("unit311"), "internal");
assert.equal(resolveCustomerHostname("demo"), "demo");
assert.equal(
  workspacePrimaryUrlForWorkspace("unit311"),
  "https://internal.unit311central.com",
  "internal workspace primary URL",
);
assert.equal(
  workspacePrimaryUrlForWorkspace("demo"),
  "https://demo.unit311central.com",
  "demo workspace primary URL",
);

assert.equal(
  deriveDefaultCustomerHostname({ workspaceSlug: "acme-mfg" }),
  "acme-mfg",
  "slug-only default hostname",
);

assert.equal(resolveCustomerHostname("acme-mfg", "customhost"), "customhost", "explicit hostname override wins");

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

const acmeHost = "acme-manufacturing-ltd.unit311central.com";
assert.equal(
  parseClientPlatformSubdomainSafe(acmeHost),
  "acme-manufacturing-ltd",
  "customer host parses to slug subdomain",
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
      assert.equal(created.customerHostname, slug);
      assert.equal(created.primaryUrl, `https://${slug}.unit311central.com`);
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
