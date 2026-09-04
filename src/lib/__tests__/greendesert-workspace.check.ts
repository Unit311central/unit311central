/**
 * Green Desert workspace regression checks.
 * Run: npx tsx src/lib/__tests__/greendesert-workspace.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  GREENDESERT_INFORMATION_REPOSITORY_WORKSPACE_CONFIG,
} from "@/components/testflighthub/information-repository-workspace-config";
import {
  GREENDESERT_REPORTING_CURRENCY,
  GREENDESERT_SLUG,
  GREENDESERT_WORKSPACE_LOGO_SRC,
  isGreenDesertSlug,
} from "@/lib/greendesert-surface";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";

const repoRoot = join(process.cwd());

assert.ok(isGreenDesertSlug(GREENDESERT_SLUG));
assert.ok(isCustomerWorkspaceSlug(GREENDESERT_SLUG));
assert.equal(resolveSlugReportingCurrency(GREENDESERT_SLUG), GREENDESERT_REPORTING_CURRENCY);
assert.equal(GREENDESERT_REPORTING_CURRENCY, "USD");
assert.equal(GREENDESERT_WORKSPACE_LOGO_SRC, "/images/workspaces/greendesert/logo.svg");
assert.equal(GREENDESERT_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.recordAttachments, true);

const sidebarBrand = readFileSync(
  join(repoRoot, "src/components/layout/WorkspaceSidebarBrand.tsx"),
  "utf8",
);
assert.match(sidebarBrand, /greendesert/);
assert.match(sidebarBrand, /GreenDesertLogoMark/);

const bcDashboard = readFileSync(
  join(repoRoot, "src/components/business-central/WorkspaceBusinessCentralDashboard.tsx"),
  "utf8",
);
assert.match(bcDashboard, /resolveSlugReportingCurrency/);

const logisticsDashboard = readFileSync(
  join(repoRoot, "src/components/testflighthub/LogisticsDashboard.tsx"),
  "utf8",
);
assert.match(logisticsDashboard, /selectedShipment \?/);

console.log("greendesert-workspace.check.ts — all assertions passed");
