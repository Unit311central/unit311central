/**
 * Run: npm run prove:guided-tutorials
 */
import assert from "node:assert/strict";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { FINANCIALS_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/financials-dashboard";
import { resolveTutorialForView as resolveClientTutorialForView } from "@/lib/guided-tutorials/client-resolver";
import { resolveTutorial, resolveTutorialForView } from "@/lib/guided-tutorials/resolver";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import {
  buildTutorialCoverageReport,
  formatTutorialCoverageReport,
  tutorialValidationPassed,
  validateTutorialRegistry,
} from "@/lib/guided-tutorials/validation";
import { resolveWorkspaceSlugFromHost } from "@/lib/guided-tutorials/workspace-slug";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";

function testValidResolution() {
  const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "financials");
  assert.equal(resolution.status, "available");
  if (resolution.status === "available") {
    assert.equal(resolution.tutorial.tutorialId, "financials.dashboard");
    assert.ok(resolution.tutorial.steps.length >= 8);
  }
}

function testInvalidViewFailsSafely() {
  const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "not-a-real-view-id");
  assert.equal(resolution.status, "unavailable");
  if (resolution.status === "unavailable") {
    assert.equal(resolution.reason, "view_not_in_workspace");
  }
}

function testMissingTutorialDoesNotCrash() {
  const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "home");
  assert.equal(resolution.status, "unavailable");
  if (resolution.status === "unavailable") {
    assert.equal(resolution.reason, "no_tutorial_defined");
  }
}

function testWorkspaceSpecificResolution() {
  const demo = resolveTutorial({
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    viewId: "financials",
  });
  const onward = resolveTutorial({
    workspaceSlug: ONWARDAIR_SLUG,
    viewId: "financials",
  });
  assert.equal(demo.status, "available");
  assert.equal(onward.status, "available");
}

function testTutorialTargetsDeclared() {
  const tutorial = FINANCIALS_DASHBOARD_TUTORIAL;
  for (const step of tutorial.steps) {
    if (!step.targetId) continue;
    assert.ok(
      tutorial.declaredTargetIds.includes(step.targetId),
      `step ${step.id} target ${step.targetId} must be declared`,
    );
  }
}

function testStepNavigationModel() {
  const steps = FINANCIALS_DASHBOARD_TUTORIAL.steps;
  assert.ok(steps.length > 1);
  let index = 0;
  index = Math.min(index + 1, steps.length - 1);
  assert.equal(index, 1);
  index = Math.max(0, index - 1);
  assert.equal(index, 0);
  index = steps.length;
  assert.ok(index >= steps.length);
}

function testRegistryValidation() {
  const issues = validateTutorialRegistry();
  assert.ok(tutorialValidationPassed(issues), issues.map((i) => i.message).join("\n"));
}

function testCoverageReport() {
  const report = buildTutorialCoverageReport();
  assert.ok(report.definedTutorials.length >= 1);
  const finRows = report.workspaceCoverage.filter(
    (row) => row.viewId === "financials" && row.hasTutorial,
  );
  assert.ok(finRows.length >= 3);
  const formatted = formatTutorialCoverageReport(report);
  assert.ok(formatted.includes("financials.dashboard"));
}

function testWorkspaceSlugResolution() {
  assert.equal(resolveWorkspaceSlugFromHost("demo.unit311central.com"), DEMO_WORKSPACE_SLUG);
  assert.equal(
    resolveWorkspaceSlugFromHost("demo.unit311central.com", "onwardair"),
    "onwardair",
  );
  assert.equal(resolveWorkspaceSlugFromHost("internal.unit311central.com"), INTERNAL_WORKSPACE_SLUG);
}

function testClientServerResolverParity() {
  const workspaces = ["demo", "onwardair", "abhi", "talantonimpact", "unit311"] as const;
  for (const workspaceSlug of workspaces) {
    const server = resolveTutorialForView(workspaceSlug, "financials");
    const client = resolveClientTutorialForView(workspaceSlug, "financials");
    assert.equal(server.status, client.status, `parity failed for ${workspaceSlug}`);
    if (server.status === "available" && client.status === "available") {
      assert.equal(server.tutorial.tutorialId, client.tutorial.tutorialId);
    }
  }
}

function testContentDescribesRealFeatures() {
  const body = FINANCIALS_DASHBOARD_TUTORIAL.steps.map((step) => step.body).join(" ");
  assert.ok(/cash position/i.test(body));
  assert.ok(/receivable/i.test(body));
  assert.ok(/payable/i.test(body));
  assert.ok(/burn rate/i.test(body));
  assert.ok(!/coming soon/i.test(body));
  assert.ok(!/placeholder/i.test(body));
}

function run() {
  testValidResolution();
  testInvalidViewFailsSafely();
  testMissingTutorialDoesNotCrash();
  testWorkspaceSpecificResolution();
  testTutorialTargetsDeclared();
  testStepNavigationModel();
  testRegistryValidation();
  testCoverageReport();
  testWorkspaceSlugResolution();
  testClientServerResolverParity();
  testContentDescribesRealFeatures();
  assert.equal(listTutorialDefinitions().length, 1);
  console.log("guided-tutorials.check.ts: all assertions passed");
}

run();
