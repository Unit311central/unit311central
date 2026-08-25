/**
 * Finances module navigation structure — central Unit311 layout.
 * Run: node --import tsx src/lib/__tests__/finances-nav.check.ts
 */
import assert from "node:assert/strict";

import { getCanonicalModule } from "@/lib/central-application-model/canonical-modules";
import {
  FINANCES_CANONICAL_MODULE_ID,
  FINANCES_MODULE_LABEL,
  FINANCES_SHELL_VIEWS,
  buildFinancesNavSection,
} from "@/lib/finances-nav";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";

assert.equal(getCanonicalModule("financials")?.id, FINANCES_CANONICAL_MODULE_ID);
assert.equal(getCanonicalModule("financials")?.label, FINANCES_MODULE_LABEL);

const section = internalSurveyNavSections.find((entry) => entry.label === FINANCES_MODULE_LABEL);
assert.ok(section, "internal nav must expose Finances module");
assert.equal(section?.items[0]?.label, "Dashboard");
assert.equal(section?.items[0]?.view, "financials");

const topLevelLabels = section!.items.map((item) => item.label);
assert.deepEqual(topLevelLabels, [
  "Dashboard",
  "General Ledger",
  "Accounts Receivable",
  "Accounts Payable",
  "Expenses",
  "Banking & Cash",
  "Planning & Management",
  "Financial Reports",
]);

const generalLedger = section!.items.find((item) => item.label === "General Ledger");
assert.ok(generalLedger?.children?.length, "General Ledger must expose subsections");
assert.deepEqual(
  generalLedger!.children!.map((child) => child.label),
  ["Chart of Accounts", "Trial Balance", "Journals"],
);

const built = buildFinancesNavSection();
assert.equal(built.label, FINANCES_MODULE_LABEL);
assert.equal(FINANCES_SHELL_VIEWS.length, 11);

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
});
const demoNav = buildWorkspaceProductNavSections({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enablement: demoEnablement,
});
const demoFinances = demoNav.find((entry) => entry.label === FINANCES_MODULE_LABEL);
assert.ok(demoFinances, "Demo nav must include Finances");
assert.ok(
  demoFinances!.items.some((item) => item.label === "Planning & Management"),
  "Demo must show Planning & Management",
);
const arChildren =
  demoFinances!.items.find((item) => item.label === "Accounts Receivable")?.children ?? [];
assert.ok(arChildren.some((child) => child.label === "Collections"), "Demo AR must include Collections");
assert.ok(arChildren.some((child) => child.label === "AR Reporting"), "Demo AR must include AR Reporting");

console.log("ok  finances-nav checks passed\n");
