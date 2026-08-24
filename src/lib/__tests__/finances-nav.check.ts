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
  shouldHideFinancesShellLeaves,
} from "@/lib/finances-nav";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(getCanonicalModule("financials")?.id, FINANCES_CANONICAL_MODULE_ID);
assert.equal(getCanonicalModule("financials")?.label, FINANCES_MODULE_LABEL);

const section = internalSurveyNavSections.find((entry) => entry.label === FINANCES_MODULE_LABEL);
assert.ok(section, "internal nav must expose Finances module");
assert.equal(section?.items[0]?.label, "Dashboard");
assert.equal(section?.items[0]?.view, "financials");

const topLevelLabels = section!.items.map((item) => item.label);
assert.deepEqual(topLevelLabels, [
  "Dashboard",
  "Accounting",
  "Accounts Receivable",
  "Accounts Payable",
  "Expenses",
  "Banking & Cash",
  "Planning & Management",
  "Financial Reports",
]);

const accounting = section!.items.find((item) => item.label === "Accounting");
assert.ok(accounting?.children?.length, "Accounting must expose subsections");
assert.deepEqual(
  accounting!.children!.map((child) => child.label),
  ["General Ledger", "Chart of Accounts", "Trial Balance", "Journals"],
);

const built = buildFinancesNavSection();
assert.equal(built.label, FINANCES_MODULE_LABEL);
assert.equal(FINANCES_SHELL_VIEWS.length, 11);

assert.equal(shouldHideFinancesShellLeaves({ workspaceType: "Demo", workspaceSlug: "demo" }), true);
assert.equal(shouldHideFinancesShellLeaves({ workspaceType: "Internal", workspaceSlug: "unit311" }), false);
assert.equal(shouldHideFinancesShellLeaves({ workspaceType: "Customer", workspaceSlug: "greendesert" }), true);

const demoFinances = buildFinancesNavSection({ hideUnfinishedLeaves: true });
const demoPlanning = demoFinances.items.find((item) => item.label === "Planning & Management");
assert.equal(demoPlanning, undefined);

const customerFinances = buildFinancesNavSection({ hideUnfinishedLeaves: true });
const arChildren = customerFinances.items.find((item) => item.label === "Accounts Receivable")?.children ?? [];
assert.deepEqual(
  arChildren.map((child) => child.label),
  ["Invoices", "Outstanding", "Overdue"],
);
const planning = customerFinances.items.find((item) => item.label === "Planning & Management");
assert.equal(planning, undefined);

console.log("ok  finances-nav checks passed\n");
