import assert from "node:assert/strict";

import {
  canAccessIntelligenceDomain,
  IntelligenceAccessDeniedError,
  requireIntelligenceAccess,
} from "@/lib/intelligence/access";
import { describeIntelligenceEaRegistration } from "@/lib/intelligence/ea-bridge";
import {
  assertIntelligenceWorkspaceScope,
  assertRecordsBelongToWorkspace,
  bindIntelligenceRecordsToWorkspace,
  createIntelligenceScopedContext,
  IntelligenceWorkspaceIsolationError,
} from "@/lib/intelligence/isolation";
import {
  clearIntelligenceRegistryForTests,
  getIntelligenceDomain,
  getIntelligencePackById,
  getIntelligencePackBySlug,
  isIntelligenceWorkspaceSlug,
  listIntelligenceDomainsForWorkspace,
  listIntelligencePacks,
  matchIntelligenceDomainByView,
  registerIntelligencePack,
} from "@/lib/intelligence/registry";
import type { IntelligenceRecord, IntelligenceWorkspacePackRegistration } from "@/lib/intelligence/types";

const MOCK_PACK: IntelligenceWorkspacePackRegistration = {
  id: "mock-intelligence",
  slug: "mockworkspace",
  label: "Mock Intelligence",
  hostSurface: "internal",
  slugAliases: ["mock"],
  domains: [
    {
      id: "signals",
      label: "Signals",
      description: "Test domain",
      navViews: ["mock-intelligence-dashboard"],
      defaultSeverity: "medium",
      providerId: "mock.signals",
    },
    {
      id: "briefing",
      label: "Briefing",
      navViews: ["mock-intelligence-briefing"],
    },
  ],
  accessPolicy: {
    defaultAllowedRoleViews: ["admin", "operator"],
    defaultAllowedHostSurfaces: ["internal", "demo"],
    denyExternal: true,
    domains: {
      briefing: {
        adminOnlyWrite: true,
      },
    },
  },
  providers: [
    { domainId: "signals", async searchRecords() { return { records: [], total: 0 }; } },
    { domainId: "briefing", async searchRecords() { return { records: [], total: 0 }; } },
  ],
};

function sampleRecord(workspaceSlug: string): IntelligenceRecord {
  return {
    id: "rec-1",
    workspaceSlug,
    domainId: "signals",
    title: "Test signal",
    summary: "Fixture record for isolation checks.",
    severity: "low",
    categories: [],
    tags: [],
  };
}

clearIntelligenceRegistryForTests();
assert.equal(listIntelligencePacks().length, 0);
// Avoid isIntelligenceWorkspaceSlug here — it bootstraps production packs via getIntelligencePackBySlug.
assert.equal(getIntelligencePackById("mock-intelligence"), null);

registerIntelligencePack(MOCK_PACK);

assert.equal(listIntelligencePacks().length, 1);
assert.equal(getIntelligencePackBySlug("mockworkspace")?.id, "mock-intelligence");
assert.equal(getIntelligencePackBySlug("mock")?.slug, "mockworkspace");
assert.equal(isIntelligenceWorkspaceSlug("mock"), true);
assert.equal(listIntelligenceDomainsForWorkspace("mockworkspace").length, 2);
assert.equal(getIntelligenceDomain("mockworkspace", "signals")?.label, "Signals");
assert.equal(
  matchIntelligenceDomainByView("mockworkspace", "mock-intelligence-dashboard")?.id,
  "signals",
);
assert.equal(matchIntelligenceDomainByView("mockworkspace", "unknown-view"), null);

const ctx = createIntelligenceScopedContext("mockworkspace", "signals");
assertIntelligenceWorkspaceScope(ctx, "mockworkspace");

assert.throws(
  () => assertIntelligenceWorkspaceScope(ctx, "otherworkspace"),
  IntelligenceWorkspaceIsolationError,
);

const bound = bindIntelligenceRecordsToWorkspace([sampleRecord("")], "mockworkspace");
assert.equal(bound[0]?.workspaceSlug, "mockworkspace");
assertRecordsBelongToWorkspace(bound, "mockworkspace");

assert.throws(
  () => assertRecordsBelongToWorkspace([sampleRecord("otherworkspace")], "mockworkspace"),
  IntelligenceWorkspaceIsolationError,
);

const pack = getIntelligencePackBySlug("mockworkspace");
assert.ok(pack);

assert.equal(
  canAccessIntelligenceDomain(pack, {
    workspaceSlug: "mockworkspace",
    domainId: "signals",
    roleView: "admin",
    hostSurface: "internal",
    isExternal: false,
  }),
  true,
);

assert.equal(
  canAccessIntelligenceDomain(pack, {
    workspaceSlug: "mockworkspace",
    domainId: "signals",
    roleView: "guest",
    hostSurface: "internal",
    isExternal: false,
  }),
  false,
);

assert.equal(
  canAccessIntelligenceDomain(pack, {
    workspaceSlug: "mockworkspace",
    domainId: "signals",
    roleView: "admin",
    hostSurface: "internal",
    isExternal: true,
  }),
  false,
);

assert.throws(
  () =>
    requireIntelligenceAccess(pack, {
      workspaceSlug: "mockworkspace",
      domainId: "briefing",
      roleView: "admin",
      hostSurface: "internal",
      isExternal: false,
      operation: "write",
      isAdmin: false,
    }),
  IntelligenceAccessDeniedError,
);

assert.doesNotThrow(() =>
  requireIntelligenceAccess(pack, {
    workspaceSlug: "mockworkspace",
    domainId: "briefing",
    roleView: "admin",
    hostSurface: "internal",
    isExternal: false,
    operation: "write",
    isAdmin: true,
  }),
);

const eaMeta = describeIntelligenceEaRegistration("mock-intelligence", "mockworkspace", [
  "signals",
  "briefing",
]);
assert.equal(eaMeta.packId, "mock-intelligence");
assert.equal(eaMeta.domainIds.length, 2);
assert.equal(eaMeta.toolNames.length, 0);
assert.equal(eaMeta.hasDailyBriefAdapter, false);

clearIntelligenceRegistryForTests();
assert.equal(listIntelligencePacks().length, 0);

console.log("intelligence/registry.check.ts: all assertions passed");
