/**
 * Test-workspace-only QA capture system checks.
 * Run: npm run prove:qa-workspace
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { allCatalogueModuleSelections } from "@/lib/platform-workspaces/module-catalogue";
import { injectTestWorkspaceQaNav } from "@/lib/qa-workspace/nav";
import { resolveQaPageContext } from "@/lib/qa-workspace/page-context";
import { qaTasksToCsv } from "@/lib/qa-workspace/csv";
import { assertTestWorkspaceSlug } from "@/lib/qa-workspace/auth";
import {
  TEST_WORKSPACE_SLUG,
  QA_PAGE_LEVEL_ELEMENT,
  QA_MODULE_LEVEL_ELEMENT,
  QA_WORKSPACE_LEVEL_ELEMENT,
} from "@/lib/qa-workspace/constants";
import {
  buildElementCapture,
  buildModuleCapture,
  buildPageCapture,
  buildWorkspaceCapture,
  captureContextToTaskInput,
  formatQaTaskScopeLabel,
  inferScopeFromLegacyTask,
  validateQaWorkspaceTaskInput,
} from "@/lib/qa-workspace/scope";
import {
  isBrowserTestWorkspaceSurface,
  isTestWorkspaceSlug,
} from "@/lib/qa-workspace/surface";
import type { QaWorkspaceTask } from "@/lib/qa-workspace/types";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";
import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";

const repoRoot = join(process.cwd());

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

// --- Surface / slug gating ---
assert.equal(isTestWorkspaceSlug("test"), true);
assert.equal(isTestWorkspaceSlug("TEST"), true);
assert.equal(isTestWorkspaceSlug("demo"), false);
assert.equal(isTestWorkspaceSlug("unit311"), false);
assert.equal(isTestWorkspaceSlug("interfaceworx"), false);
assert.equal(isTestWorkspaceSlug("onwardair"), false);
assert.equal(isTestWorkspaceSlug("abhi"), false);
assert.equal(isTestWorkspaceSlug("talantonimpact"), false);
assert.equal(TEST_WORKSPACE_SLUG, "test");

assert.throws(() => assertTestWorkspaceSlug("demo"), /only available on the dedicated Test workspace/);

// --- Nav injection: Test workspace only ---
const toolsSection = internalSurveyNavSections.find(
  (section) => section.kind === "workspace" && section.label === "Tools",
);
assert.ok(toolsSection);
const defaultToolsViews = toolsSection!.items.map((item) => item.view);
assert.ok(!defaultToolsViews.includes("qa-tasks"), "qa-tasks must not be in canonical Tools nav");

const demoNav = injectTestWorkspaceQaNav(internalSurveyNavSections, "demo");
const demoTools = demoNav.find((section) => section.kind === "workspace" && section.label === "Tools");
assert.ok(demoTools);
assert.ok(!demoTools!.items.some((item) => item.view === "qa-tasks"), "Demo must not get QA Tasks nav");

const internalNav = injectTestWorkspaceQaNav(internalSurveyNavSections, "unit311");
const internalTools = internalNav.find(
  (section) => section.kind === "workspace" && section.label === "Tools",
);
assert.ok(internalTools);
assert.ok(
  !internalTools!.items.some((item) => item.view === "qa-tasks"),
  "Internal must not get QA Tasks nav",
);

const testNav = injectTestWorkspaceQaNav(internalSurveyNavSections, "test");
const testTools = testNav.find((section) => section.kind === "workspace" && section.label === "Tools");
assert.ok(testTools);
const qaItem = testTools!.items.find((item) => item.view === "qa-tasks");
assert.ok(qaItem, "Test workspace must get QA Tasks under Tools");
assert.equal(qaItem!.label, "QA Tasks");

// --- Page / module context ---
const pageContext = resolveQaPageContext({
  activeView: "accounts-receivable",
  pathname: "/dashboard",
  search: "?view=accounts-receivable",
});
assert.equal(pageContext.moduleLabel, "Finances");
assert.equal(pageContext.pageLabel, "Invoices");
assert.equal(pageContext.pageViewId, "accounts-receivable");
assert.match(pageContext.routePath, /accounts-receivable/);

const homeContext = resolveQaPageContext({
  activeView: "home",
  pathname: "/dashboard",
  search: "",
});
assert.equal(homeContext.moduleLabel, "HOME");
assert.equal(homeContext.pageLabel, "Home");

// --- Scope capture builders ---
const elementCapture = buildElementCapture(pageContext, {
  elementLabel: "Invoice Total",
  elementType: "calculation",
  elementId: "invoice-total",
});
assert.equal(elementCapture.scope, "element");
assert.equal(elementCapture.elementLabel, "Invoice Total");

const pageCapture = buildPageCapture(homeContext);
assert.equal(pageCapture.scope, "page");
assert.equal(pageCapture.elementLabel, QA_PAGE_LEVEL_ELEMENT);
assert.equal(pageCapture.moduleLabel, "HOME");
assert.equal(pageCapture.pageLabel, "Home");
assert.equal(pageCapture.pageViewId, "home");

const moduleCapture = buildModuleCapture(homeContext);
assert.equal(moduleCapture.scope, "module");
assert.equal(moduleCapture.moduleLabel, "HOME");
assert.equal(moduleCapture.pageLabel, QA_MODULE_LEVEL_ELEMENT);
assert.equal(moduleCapture.routePath, null);

const workspaceCapture = buildWorkspaceCapture(homeContext);
assert.equal(workspaceCapture.scope, "workspace");
assert.equal(workspaceCapture.elementLabel, QA_WORKSPACE_LEVEL_ELEMENT);
assert.equal(workspaceCapture.moduleLabel, "Workspace");

assert.equal(
  validateQaWorkspaceTaskInput(
    captureContextToTaskInput(pageCapture, "Dashboard client count mismatch"),
  ),
  null,
);
assert.equal(
  validateQaWorkspaceTaskInput({
    scope: "element",
    moduleLabel: "Home",
    pageLabel: "Home",
    elementLabel: "",
    description: "missing element",
  }),
  "Module, page, and element are required for element-scoped tasks.",
);

assert.equal(inferScopeFromLegacyTask({ elementLabel: QA_PAGE_LEVEL_ELEMENT }), "page");
assert.equal(inferScopeFromLegacyTask({ elementLabel: QA_MODULE_LEVEL_ELEMENT }), "module");
assert.equal(inferScopeFromLegacyTask({ elementLabel: QA_WORKSPACE_LEVEL_ELEMENT }), "workspace");
assert.equal(formatQaTaskScopeLabel("page"), "Page");

// --- CSV export ---
const sampleTask: QaWorkspaceTask = {
  id: "task-1",
  workspaceId: "ws-test",
  scope: "page",
  status: "open",
  completed: false,
  moduleLabel: "HOME",
  moduleId: "home",
  pageLabel: "Home",
  pageViewId: "home",
  routePath: "/dashboard?view=home",
  elementLabel: QA_PAGE_LEVEL_ELEMENT,
  elementType: "page",
  elementId: "home",
  description: 'Dashboard shows 3 clients but BC shows 0',
  createdBy: null,
  createdByEmail: null,
  createdAt: "2026-08-22T12:00:00.000Z",
  updatedAt: "2026-08-22T12:00:00.000Z",
};

const csv = qaTasksToCsv([sampleTask], "test");
assert.match(csv, /^ID,Scope,Status,Completed,Module,Page,Element/);
assert.match(csv, /Page,open,false,HOME,Home,Page-level/);
assert.match(csv, /,test,/);

// --- Migration registered ---
const migration153 = "supabase/migrations/153_qa_workspace_tasks.sql";
const migration154 = "supabase/migrations/154_qa_workspace_tasks_scope.sql";
assert.ok(UNIT311_PENDING_MIGRATIONS.includes(migration153 as never));
assert.ok(UNIT311_PENDING_MIGRATIONS.includes(migration154 as never));
assert.ok(MIGRATION_SATISFACTION_PROBES[migration153]);
assert.ok(MIGRATION_SATISFACTION_PROBES[migration154]);

const migrationSql = readRepoFile(migration153);
assert.match(migrationSql, /create table if not exists public\.qa_workspace_tasks/);
assert.match(migrationSql, /scope text not null default 'element'/);
assert.match(migrationSql, /qa_workspace_tasks_deny_all/);

const scopeMigrationSql = readRepoFile(migration154);
assert.match(scopeMigrationSql, /add column if not exists scope text/);
assert.match(scopeMigrationSql, /set scope = 'page'/);

// --- Not in product catalogue / provisioning ---
const catalogueSelections = allCatalogueModuleSelections();
const catalogueTokens = [
  ...catalogueSelections.enabledModules,
  ...catalogueSelections.enabledSubModules,
];
assert.ok(
  !catalogueTokens.some((entry) => /qa/i.test(entry)),
  "QA must not appear in workspace module catalogue",
);

const provisioningSql = readRepoFile(
  "supabase/migrations/151_workspace_phase3_provisioning.sql",
);
assert.ok(!/qa_workspace_tasks/i.test(provisioningSql), "Provisioning must not seed QA tables");
assert.ok(!/qa-tasks/i.test(provisioningSql), "Provisioning must not reference QA views");

const productNavSource = readRepoFile("src/lib/platform-workspaces/workspace-product-nav.ts");
assert.ok(!/qa-tasks/i.test(productNavSource), "Product nav must not include QA Tasks");

const wizardSource = readRepoFile("src/components/platform-workspaces/NewWorkspaceWizard.tsx");
assert.ok(!/qa-tasks/i.test(wizardSource), "New Workspace wizard must not include QA");

// --- API routes enforce test workspace ---
const qaApiRoute = readRepoFile("src/app/api/qa/tasks/route.ts");
assert.match(qaApiRoute, /requireTestWorkspaceAccess/);
assert.match(qaApiRoute, /validateQaWorkspaceTaskInput/);
assert.match(qaApiRoute, /scope/);

const qaOverlay = readRepoFile("src/components/qa-workspace/QaModeOverlay.tsx");
assert.match(qaOverlay, /onWorkspaceLevelTask/);
assert.match(qaOverlay, /onModuleLevelTask/);
assert.match(qaOverlay, /onPageLevelTask/);

// --- Browser surface helper returns false without window (SSR) ---
assert.equal(isBrowserTestWorkspaceSurface(), false);

console.log("ok  qa-workspace checks passed\n");
