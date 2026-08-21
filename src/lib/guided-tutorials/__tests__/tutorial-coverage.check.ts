/**
 * Run: npm run prove:tutorial-coverage
 */
import assert from "node:assert/strict";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  buildTutorialCoverageManifest,
  findCoverageEntry,
  formatTutorialCoverageSummary,
  reconcileTutorialCoverage,
} from "@/lib/guided-tutorials/coverage/manifest";
import {
  COVERAGE_WORKSPACE_SLUGS,
  extractAllCoverageNavLeaves,
  extractNavLeavesForWorkspace,
  tutorialIdentityKey,
} from "@/lib/guided-tutorials/coverage/nav-leaves";
import { buildTutorialContext, formatTutorialContextPath } from "@/lib/guided-tutorials/context";
import { resolveTutorialForView } from "@/lib/guided-tutorials/client-resolver";
import { formatTutorialUnavailableMessage } from "@/lib/guided-tutorials/resolve-tutorial-core";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import { resetClientWorkspaceViewCacheForTests } from "@/lib/guided-tutorials/client-workspace-views";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";

function testManifestGeneratedFromNavigation() {
  resetClientWorkspaceViewCacheForTests();
  const leaves = extractAllCoverageNavLeaves();
  assert.ok(leaves.length >= 140, `expected nav-derived leaves, got ${leaves.length}`);
  assert.ok(
    leaves.every((leaf) => leaf.viewId && leaf.moduleLabel && leaf.functionLabel),
    "every leaf must have labels",
  );
  assert.ok(
    leaves.every((leaf) => leaf.workspaceSlugs.length > 0),
    "every leaf must belong to at least one workspace pack",
  );
}

function testOnwardAirAndDemoLeavesPresent() {
  resetClientWorkspaceViewCacheForTests();
  const onward = extractNavLeavesForWorkspace(ONWARDAIR_SLUG);
  const demo = extractNavLeavesForWorkspace(DEMO_WORKSPACE_SLUG);
  assert.ok(onward.length >= 140, `onwardair leaves: ${onward.length}`);
  assert.ok(demo.length >= 130, `demo leaves: ${demo.length}`);
}

function testTabSpecificIdentities() {
  resetClientWorkspaceViewCacheForTests();
  const manifest = buildTutorialCoverageManifest();
  const commissions = findCoverageEntry(manifest, "sales-management", "commissions");
  assert.ok(commissions, "commissions tab identity must exist in manifest");
  assert.equal(commissions?.status, "live");
  assert.equal(commissions?.tutorialId, "sales-management.commissions");
  assert.equal(commissions?.presentationTier, "C");

  const dashboard = findCoverageEntry(manifest, "sales-management", "dashboard");
  assert.ok(dashboard, "sales dashboard tab identity must exist");
  assert.equal(dashboard?.status, "missing");

  const glJournal = findCoverageEntry(manifest, "general-ledger", "journal");
  assert.ok(glJournal, "general ledger journal tab must exist");
  assert.equal(glJournal?.tabKey, "journal");
}

function testLiveTutorialsReconcile() {
  resetClientWorkspaceViewCacheForTests();
  const reconciliation = reconcileTutorialCoverage();
  assert.equal(reconciliation.liveTutorials.length, 2);
  assert.equal(reconciliation.orphanRegistryEntries.length, 0);
  assert.equal(reconciliation.duplicateRegistryIdentities.length, 0);

  const fin = reconciliation.liveTutorials.find((t) => t.tutorialId === "financials.dashboard");
  const comm = reconciliation.liveTutorials.find(
    (t) => t.tutorialId === "sales-management.commissions",
  );
  assert.ok(fin);
  assert.ok(comm);
  assert.equal(fin?.identityKey, "financials:");
  assert.equal(comm?.identityKey, "sales-management:commissions");

  const finEntry = findCoverageEntry(reconciliation.manifest, "financials");
  assert.equal(finEntry?.status, "live");
  assert.equal(finEntry?.presentationTier, "C");
}

function testRegistryMatchesManifestCount() {
  assert.equal(listTutorialDefinitions().length, 2);
  const reconciliation = reconcileTutorialCoverage();
  assert.equal(reconciliation.manifest.stats.live, 2);
  assert.ok(reconciliation.manifest.stats.missing > 0);
  assert.ok(reconciliation.manifest.stats.shell > 0);
}

function testShellViewsClassified() {
  const manifest = buildTutorialCoverageManifest();
  const budget = findCoverageEntry(manifest, "finances-planning-budget");
  assert.ok(budget);
  assert.equal(budget?.status, "shell");
  assert.equal(budget?.presentationTier, "A");
}

function testCoverageWorkspacePacks() {
  assert.ok(COVERAGE_WORKSPACE_SLUGS.includes(ONWARDAIR_SLUG));
  assert.ok(COVERAGE_WORKSPACE_SLUGS.includes(DEMO_WORKSPACE_SLUG));
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
  assert.ok(!message.toLowerCase().includes("demo"), "message must not blame workspace slug");
  assert.ok(!message.includes("sales-management"), "message must not expose raw viewId");
}

function testResolverUnavailableMessage() {
  resetClientWorkspaceViewCacheForTests();
  const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "sales-management", "pipeline");
  assert.equal(resolution.status, "unavailable");
  if (resolution.status === "unavailable") {
    assert.equal(resolution.reason, "no_tutorial_defined");
    assert.match(resolution.message, /No tutorial is available yet for Sales Management/);
    assert.ok(!resolution.message.includes(DEMO_WORKSPACE_SLUG));
  }
}

function testIdentityKeyStability() {
  assert.equal(tutorialIdentityKey("financials"), "financials:");
  assert.equal(tutorialIdentityKey("sales-management", "commissions"), "sales-management:commissions");
}

function testCoverageSummaryFormat() {
  const reconciliation = reconcileTutorialCoverage();
  const summary = formatTutorialCoverageSummary(reconciliation);
  assert.ok(summary.includes("financials.dashboard"));
  assert.ok(summary.includes("sales-management.commissions"));
  assert.ok(summary.includes("missing:"));
}

function run() {
  testManifestGeneratedFromNavigation();
  testOnwardAirAndDemoLeavesPresent();
  testTabSpecificIdentities();
  testLiveTutorialsReconcile();
  testRegistryMatchesManifestCount();
  testShellViewsClassified();
  testCoverageWorkspacePacks();
  testUnavailableMessageUsesContextPath();
  testResolverUnavailableMessage();
  testIdentityKeyStability();
  testCoverageSummaryFormat();
  console.log("tutorial-coverage.check.ts: all assertions passed");
}

run();
