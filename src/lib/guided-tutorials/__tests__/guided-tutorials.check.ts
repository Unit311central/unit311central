/**
 * Run: npm run prove:guided-tutorials
 */
import assert from "node:assert/strict";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { WAVE_1_TUTORIAL_IDS } from "@/lib/guided-tutorials/content/wave-1-scope";
import { WAVE_2_TUTORIAL_IDS } from "@/lib/guided-tutorials/content/wave-2-scope";
import { FINANCIALS_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/financials-dashboard";
import { SALES_MANAGEMENT_COMMISSIONS_TUTORIAL } from "@/lib/guided-tutorials/content/sales-management-commissions";
import {
  buildTutorialContext,
  formatTutorialContextPath,
  resolveTutorialTabKey,
} from "@/lib/guided-tutorials/context";
import { resolveTutorialForView as resolveClientTutorialForView } from "@/lib/guided-tutorials/client-resolver";
import { resolveTutorial, resolveTutorialForView } from "@/lib/guided-tutorials/resolver";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import {
  buildTutorialCoverageReport,
  formatTutorialCoverageReport,
  tutorialValidationPassed,
  validateTutorialRegistry,
} from "@/lib/guided-tutorials/validation";
import {
  stepUsesDomHighlight,
  stepUsesImmersiveMedia,
} from "@/lib/guided-tutorials/step-presentation";
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
  const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "messaging");
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

function testCommissionsTutorialResolvesWithTabKey() {
  const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "sales-management", "commissions");
  assert.equal(resolution.status, "available");
  if (resolution.status === "available") {
    assert.equal(resolution.tutorial.tutorialId, "sales-management.commissions");
  }
}

function testCommissionsTutorialNotOnDashboardTab() {
  const dashboard = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "sales-management", "dashboard");
  assert.equal(dashboard.status, "available");
  if (dashboard.status === "available") {
    assert.equal(dashboard.tutorial.tutorialId, "sales-management.dashboard");
  }

  const commissions = resolveTutorialForView(DEMO_WORKSPACE_SLUG, "sales-management", "commissions");
  assert.equal(commissions.status, "available");
  if (commissions.status === "available") {
    assert.equal(commissions.tutorial.tutorialId, "sales-management.commissions");
  }
}

function testTutorialContextHierarchy() {
  const context = buildTutorialContext({
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    viewId: "sales-management",
    tabKey: "commissions",
  });
  assert.equal(context.moduleLabel, "Sales Management");
  assert.equal(context.sectionLabel, "Management");
  assert.equal(context.functionLabel, "Commissions");
  assert.equal(
    formatTutorialContextPath(context),
    "Sales Management → Management → Commissions",
  );
}

function testFinancesContextHierarchy() {
  const context = buildTutorialContext({
    workspaceSlug: DEMO_WORKSPACE_SLUG,
    viewId: "financials",
  });
  assert.equal(formatTutorialContextPath(context), "Finances → Dashboard");
}

function testResolveTutorialTabKeyForSales() {
  const params = new URLSearchParams("view=sales-management&tab=commissions");
  assert.equal(resolveTutorialTabKey("sales-management", params), "commissions");
}

function testCommissionsRichMediaSteps() {
  const diagram = SALES_MANAGEMENT_COMMISSIONS_TUTORIAL.steps.find((s) => s.id === "flow-diagram");
  const layout = SALES_MANAGEMENT_COMMISSIONS_TUTORIAL.steps.find((s) => s.id === "layout-visual");
  assert.ok(diagram);
  assert.ok(layout);
  assert.equal(diagram?.presentation, "diagram");
  assert.equal(layout?.presentation, "screenshot");
  assert.ok(stepUsesImmersiveMedia(diagram));
  assert.ok(stepUsesImmersiveMedia(layout));
  assert.equal(stepUsesDomHighlight(diagram), false);
  assert.ok(diagram?.media?.assetUrl.startsWith("/tutorials/"));
}

function testWave1TutorialsResolve() {
  const cases: Array<{ viewId: string; tabKey?: string; tutorialId: string }> = [
    { viewId: "home", tutorialId: "home" },
    { viewId: "executive-assistant", tutorialId: "executive-assistant" },
    { viewId: "clients-dashboard", tutorialId: "business-central.clients" },
    { viewId: "crm", tutorialId: "business-central.pipeline" },
    { viewId: "sales-management", tabKey: "dashboard", tutorialId: "sales-management.dashboard" },
    { viewId: "sales-management", tabKey: "pipeline", tutorialId: "sales-management.pipeline" },
    {
      viewId: "oa-competitor-intelligence",
      tutorialId: "intelligence.competitor-intelligence",
    },
    { viewId: "general-ledger", tabKey: "journal", tutorialId: "financials.journal" },
    { viewId: "accounts-receivable", tutorialId: "financials.accounts-receivable" },
    { viewId: "wise", tutorialId: "financials.wise" },
  ];

  for (const row of cases) {
    const workspace =
      row.tutorialId === "intelligence.competitor-intelligence"
        ? ONWARDAIR_SLUG
        : DEMO_WORKSPACE_SLUG;
    const resolution = resolveTutorialForView(workspace, row.viewId, row.tabKey);
    assert.equal(resolution.status, "available", `${row.tutorialId} on ${workspace}`);
    if (resolution.status === "available") {
      assert.equal(resolution.tutorial.tutorialId, row.tutorialId);
    }
  }

  assert.equal(WAVE_1_TUTORIAL_IDS.length, 10);
}

function testWave2TutorialsResolve() {
  const cases: Array<{ viewId: string; tabKey?: string; tutorialId: string }> = [
    { viewId: "fundraising-dashboard", tutorialId: "fundraising.dashboard" },
    { viewId: "board-dashboard", tutorialId: "board.board-dashboard" },
    { viewId: "corporate-dashboard", tutorialId: "corporate-information.dashboard" },
    { viewId: "operations-dashboard", tutorialId: "operations.dashboard" },
    { viewId: "oa-marketing-dashboard", tutorialId: "marketing-events.dashboard" },
    { viewId: "technology-dashboard", tutorialId: "technology-management.dashboard" },
    { viewId: "hr-dashboard", tutorialId: "human-resources.dashboard" },
    { viewId: "productivity-dashboard", tutorialId: "business-productivity.dashboard" },
    { viewId: "support", tutorialId: "support-desk.tickets" },
    { viewId: "settings", tutorialId: "settings.general" },
  ];

  for (const row of cases) {
    const resolution = resolveTutorialForView(DEMO_WORKSPACE_SLUG, row.viewId, row.tabKey);
    assert.equal(resolution.status, "available", `${row.tutorialId} on demo`);
    if (resolution.status === "available") {
      assert.equal(resolution.tutorial.tutorialId, row.tutorialId);
    }
  }

  assert.equal(WAVE_2_TUTORIAL_IDS.length, 10);
}

function testWave2ContentIsWorkspaceNeutral() {
  const banned = /\b(demo|onwardair|talanton|abhi|northstar)\b/i;
  for (const tutorial of listTutorialDefinitions()) {
    if (!WAVE_2_TUTORIAL_IDS.includes(tutorial.tutorialId as (typeof WAVE_2_TUTORIAL_IDS)[number])) {
      continue;
    }
    const text = [
      tutorial.title,
      tutorial.description,
      ...tutorial.steps.map((step) => `${step.title} ${step.body} ${step.tryPrompt ?? ""}`),
    ].join(" ");
    assert.ok(!banned.test(text), `${tutorial.tutorialId} contains workspace-specific naming`);
  }
}

function testStepPresentationHelpers() {
  const highlightStep = FINANCIALS_DASHBOARD_TUTORIAL.steps[0]!;
  assert.ok(stepUsesDomHighlight(highlightStep));
  assert.equal(stepUsesImmersiveMedia(highlightStep), false);
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
  testCommissionsTutorialResolvesWithTabKey();
  testCommissionsTutorialNotOnDashboardTab();
  testTutorialContextHierarchy();
  testFinancesContextHierarchy();
  testResolveTutorialTabKeyForSales();
  testCommissionsRichMediaSteps();
  testWave1TutorialsResolve();
  testWave2TutorialsResolve();
  testWave2ContentIsWorkspaceNeutral();
  testStepPresentationHelpers();
  assert.equal(listTutorialDefinitions().length, 22);
  console.log("guided-tutorials.check.ts: all assertions passed");
}

run();
