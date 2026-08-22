/**
 * Run: npm run prove:tutorial-coverage
 */
import assert from "node:assert/strict";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  deriveTutorialId,
  findCatalogueEntryByBinding,
  resetCanonicalLabelIndexForTests,
} from "@/lib/guided-tutorials/coverage/canonical-catalogue";
import {
  buildTutorialCoverageManifest,
  formatTutorialCoverageSummary,
  listNeedsMappingEntries,
  reconcileTutorialCoverage,
} from "@/lib/guided-tutorials/coverage/manifest";
import { isCentralPlatformModuleSlug } from "@/lib/guided-tutorials/coverage/central-catalogue-architecture";
import {
  COVERAGE_WORKSPACE_SLUGS,
  extractAllDiscoveredNavLeaves,
  extractDiscoveredNavLeavesForWorkspace,
  runtimeBindingKey,
} from "@/lib/guided-tutorials/coverage/nav-leaves";
import { resolveTutorialForView } from "@/lib/guided-tutorials/client-resolver";
import { formatTutorialUnavailableMessage } from "@/lib/guided-tutorials/resolve-tutorial-core";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import { resetClientWorkspaceViewCacheForTests } from "@/lib/guided-tutorials/client-workspace-views";
import { buildTutorialContext, formatTutorialContextPath } from "@/lib/guided-tutorials/context";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";

function testCanonicalCatalogueFromNavigation() {
  resetClientWorkspaceViewCacheForTests();
  resetCanonicalLabelIndexForTests();
  const discovered = extractAllDiscoveredNavLeaves();
  assert.ok(discovered.length >= 180, `expected canonical functions, got ${discovered.length}`);
  assert.ok(
    discovered.every((leaf) => leaf.viewId && leaf.workspaceSlugs.length > 0),
    "every function must have runtime binding and workspace availability",
  );
}

function testCanonicalContentFunctionCount() {
  resetClientWorkspaceViewCacheForTests();
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();
  assert.ok(
    manifest.stats.contentFunctions >= 175 && manifest.stats.contentFunctions <= 190,
    `content functions: ${manifest.stats.contentFunctions}`,
  );
  assert.ok(manifest.stats.shell >= 10, `shell placeholders: ${manifest.stats.shell}`);
  assert.equal(
    manifest.stats.totalCanonicalFunctions,
    manifest.stats.contentFunctions + manifest.stats.shell,
  );
}

function testPrimaryIdentityIsRuntimeBinding() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();
  const bindings = new Set(manifest.entries.map((entry) => entry.runtime.bindingKey));
  assert.equal(bindings.size, manifest.entries.length, "runtime binding must be unique per catalogue row");
  assert.ok(
    manifest.stats.uniqueTutorialIds > 0 &&
      manifest.stats.uniqueTutorialIds <= manifest.entries.length,
    `unique tutorial IDs: ${manifest.stats.uniqueTutorialIds}`,
  );
  assert.ok(
    manifest.entries.every(
      (entry) =>
        entry.canonical.tutorialId &&
        entry.runtime.bindingKey &&
        entry.availability.workspaceSlugs.length > 0 &&
        entry.mappingConfidence,
    ),
  );
}

function testLiveTutorialsReconcile() {
  resetCanonicalLabelIndexForTests();
  const reconciliation = reconcileTutorialCoverage();
  assert.equal(reconciliation.liveTutorials.length, 12);
  assert.equal(reconciliation.orphanRegistryEntries.length, 0);
  assert.equal(reconciliation.duplicateTutorialIds.length, 0);
  assert.equal(reconciliation.duplicateRuntimeBindings.length, 0);

  const fin = reconciliation.liveTutorials.find((t) => t.tutorialId === "financials.dashboard");
  const comm = reconciliation.liveTutorials.find(
    (t) => t.tutorialId === "sales-management.commissions",
  );
  assert.ok(fin);
  assert.ok(comm);

  const finEntry = findCatalogueEntryByBinding(
    reconciliation.manifest.entries,
    "financials",
  );
  const commEntry = findCatalogueEntryByBinding(
    reconciliation.manifest.entries,
    "sales-management",
    "commissions",
  );
  assert.equal(finEntry?.canonical.tutorialId, "financials.dashboard");
  assert.equal(finEntry?.status, "live");
  assert.equal(finEntry?.presentationTier, "C");
  assert.equal(commEntry?.canonical.tutorialId, "sales-management.commissions");
  assert.equal(commEntry?.status, "live");
  assert.equal(commEntry?.presentationTier, "C");
}

function testRegistryMatchesCanonicalBindings() {
  assert.equal(listTutorialDefinitions().length, 12);
  for (const tutorial of listTutorialDefinitions()) {
    const derived = deriveTutorialId({
      viewId: tutorial.viewId,
      tabKey: tutorial.tabKey,
      functionLabel: tutorial.functionLabel,
    });
    assert.equal(derived, tutorial.tutorialId);
  }
}

function testTabSpecificBindings() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();
  const commissions = findCatalogueEntryByBinding(
    manifest.entries,
    "sales-management",
    "commissions",
  );
  assert.ok(commissions);
  assert.equal(commissions?.runtime.bindingKey, "sales-management:commissions");
  assert.equal(commissions?.canonical.tutorialId, "sales-management.commissions");
  assert.equal(commissions?.canonical.moduleSlug, "sales-management");

  const dashboard = findCatalogueEntryByBinding(manifest.entries, "sales-management", "dashboard");
  assert.ok(dashboard);
  assert.equal(dashboard?.canonical.tutorialId, "sales-management.dashboard");
  assert.equal(dashboard?.status, "live");
}

function testCanonicalProductNaming() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();

  const home = findCatalogueEntryByBinding(manifest.entries, "home");
  assert.ok(home);
  assert.equal(home?.canonical.tutorialId, "home");
  assert.equal(home?.canonical.moduleSlug, "home");
  assert.equal(home?.mappingConfidence, "confirmed");

  const ea = findCatalogueEntryByBinding(manifest.entries, "executive-assistant");
  assert.ok(ea);
  assert.equal(ea?.canonical.tutorialId, "executive-assistant");
  assert.equal(ea?.canonical.moduleSlug, "executive-assistant");

  const clientsDash = findCatalogueEntryByBinding(manifest.entries, "clients-dashboard");
  assert.ok(clientsDash);
  assert.equal(clientsDash?.canonical.tutorialId, "business-central.clients");
  assert.equal(clientsDash?.canonical.moduleSlug, "business-central");

  const pipeline = findCatalogueEntryByBinding(manifest.entries, "crm");
  assert.ok(pipeline);
  assert.equal(pipeline?.canonical.tutorialId, "business-central.pipeline");

  const competitor = findCatalogueEntryByBinding(manifest.entries, "oa-competitor-intelligence");
  assert.ok(competitor);
  assert.equal(competitor?.canonical.moduleSlug, "intelligence");
  assert.notEqual(competitor?.canonical.moduleSlug, "onwardair-intelligence");
}

function testCentralCatalogueFullyMapped() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();
  const needsMapping = listNeedsMappingEntries(manifest);
  assert.equal(needsMapping.length, 0, `unmapped entries: ${needsMapping.map((e) => e.runtime.viewId).join(", ")}`);
  assert.equal(manifest.stats.needsMapping, 0);
}

function testCentralModuleArchitecture() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();
  for (const entry of manifest.entries) {
    if (entry.status === "shell") continue;
    assert.ok(
      isCentralPlatformModuleSlug(entry.canonical.moduleSlug),
      `non-central module slug: ${entry.canonical.moduleSlug} (${entry.canonical.tutorialId})`,
    );
  }
}

function testCentralTutorialMultiBindings() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();

  const newsletter = manifest.entries.filter(
    (entry) => entry.canonical.tutorialId === "marketing-events.digital-newsletter",
  );
  assert.ok(newsletter.length >= 2);
  assert.ok(newsletter.some((entry) => entry.runtime.viewId === "marketing-newsletter"));
  assert.ok(newsletter.some((entry) => entry.runtime.viewId === "stories-newsletter"));

  const fundProfile = manifest.entries.filter(
    (entry) => entry.canonical.tutorialId === "fundraising.fund-profile",
  );
  assert.equal(fundProfile.length, 3);

  const investors = manifest.entries.filter((entry) => entry.canonical.tutorialId === "fundraising.investors");
  assert.ok(investors.length >= 2);
}

function testStableCanonicalLabels() {
  resetCanonicalLabelIndexForTests();
  const manifest = buildTutorialCoverageManifest();
  const clients = findCatalogueEntryByBinding(manifest.entries, "clients");
  assert.ok(clients);
  assert.equal(clients?.canonical.moduleLabel, "Business Central");
  assert.equal(clients?.canonical.functionLabel, "Client Directory");
  assert.equal(clients?.canonical.tutorialId, "business-central.client-directory");
  assert.notEqual(clients?.canonical.moduleLabel, "Members");
}

function testWorkspaceAvailabilityIsMetadata() {
  resetClientWorkspaceViewCacheForTests();
  const discovered = extractAllDiscoveredNavLeaves();
  const commissions = discovered.find(
    (leaf) => runtimeBindingKey(leaf.viewId, leaf.tabKey) === "sales-management:commissions",
  );
  assert.ok(commissions);
  assert.ok(commissions.workspaceSlugs.includes(DEMO_WORKSPACE_SLUG));
  assert.ok(commissions.workspaceSlugs.includes(ONWARDAIR_SLUG));
  assert.ok(commissions.workspaceSlugs.length >= 2);
}

function testCommissionsResolvesOnDemoAndOnwardAir() {
  resetClientWorkspaceViewCacheForTests();
  for (const slug of [DEMO_WORKSPACE_SLUG, ONWARDAIR_SLUG]) {
    const resolution = resolveTutorialForView(slug, "sales-management", "commissions");
    assert.equal(resolution.status, "available", slug);
    if (resolution.status === "available") {
      assert.equal(resolution.tutorial.tutorialId, "sales-management.commissions");
    }
  }
}

function testUnavailableMessageUsesContextPath() {
  const context = buildTutorialContext({
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    viewId: "sales-management",
    tabKey: "pipeline",
  });
  const path = formatTutorialContextPath(context);
  const message = formatTutorialUnavailableMessage(
    {
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      viewId: "sales-management",
      tabKey: "pipeline",
    },
    "no_tutorial_defined",
  );
  assert.equal(message, `No tutorial is available yet for ${path}.`);
  assert.ok(!message.toLowerCase().includes("demo"));
}

function testCoverageWorkspacePacks() {
  assert.ok(COVERAGE_WORKSPACE_SLUGS.includes(ONWARDAIR_SLUG));
  assert.ok(COVERAGE_WORKSPACE_SLUGS.includes(DEMO_WORKSPACE_SLUG));
}

function testOnwardAirDiscoveryCount() {
  resetClientWorkspaceViewCacheForTests();
  const onward = extractDiscoveredNavLeavesForWorkspace(ONWARDAIR_SLUG);
  assert.ok(onward.length >= 140, `onwardair functions: ${onward.length}`);
}

function testCoverageSummaryFormat() {
  resetCanonicalLabelIndexForTests();
  const reconciliation = reconcileTutorialCoverage();
  const summary = formatTutorialCoverageSummary(reconciliation);
  assert.ok(summary.includes("Unique product tutorial IDs"));
  assert.ok(summary.includes("financials.dashboard"));
  assert.ok(summary.includes("sales-management.commissions"));
  assert.ok(!summary.includes("195 screens across"));
}

function run() {
  testCanonicalCatalogueFromNavigation();
  testCanonicalContentFunctionCount();
  testPrimaryIdentityIsRuntimeBinding();
  testLiveTutorialsReconcile();
  testRegistryMatchesCanonicalBindings();
  testTabSpecificBindings();
  testCanonicalProductNaming();
  testCentralCatalogueFullyMapped();
  testCentralModuleArchitecture();
  testCentralTutorialMultiBindings();
  testStableCanonicalLabels();
  testWorkspaceAvailabilityIsMetadata();
  testCommissionsResolvesOnDemoAndOnwardAir();
  testUnavailableMessageUsesContextPath();
  testCoverageWorkspacePacks();
  testOnwardAirDiscoveryCount();
  testCoverageSummaryFormat();
  console.log("tutorial-coverage.check.ts: all assertions passed");
}

run();
