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
  getGreenDesertClientPortalByPath,
} from "@/lib/greendesert/client-portal-routes";
import {
  GREENDESERT_BOARD_PORTAL_ORIGIN,
  GREENDESERT_BOARD_USERNAME,
} from "@/lib/greendesert/greendesert-board-portal-data";
import { GREENDESERT_LOGISTICS_SHIPMENTS } from "@/lib/greendesert/greendesert-logistics-data";
import {
  GREENDESERT_REPORTING_CURRENCY,
  GREENDESERT_SLUG,
  GREENDESERT_WORKSPACE_LOGO_SRC,
  isGreenDesertHost,
  isGreenDesertSlug,
} from "@/lib/greendesert-surface";
import {
  isGreenDesertClientPortalUsername,
  getGreenDesertClientPortalByUsername,
  verifyGreenDesertClientPortalPassword,
} from "@/lib/greendesert/greendesert-portal-auth-server";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { getPayrollUiLabels } from "@/lib/payroll/payroll-ui-labels";
import {
  isGreenDesertBoardPortalUsername,
  verifyGreenDesertBoardPortalPassword,
} from "@/lib/greendesert/greendesert-board-portal-auth-server";
import { GREENDESERT_REPRESENTATIVES_DASHBOARD_TILES } from "@/lib/view-dashboard-tile-catalogs";
import { bootstrapPortalWorkspacePacks } from "@/lib/portals/workspace-packs";
import { getPortalPackBySlug } from "@/lib/portals/registry";
import { ensureMarketingWorkspacePacksRegistered, getMarketingWorkspacePack } from "@/lib/marketing/workspace-packs/registry";

const repoRoot = join(process.cwd());

assert.ok(isGreenDesertSlug(GREENDESERT_SLUG));
assert.ok(isCustomerWorkspaceSlug(GREENDESERT_SLUG));
assert.equal(resolveSlugReportingCurrency(GREENDESERT_SLUG), GREENDESERT_REPORTING_CURRENCY);
assert.equal(GREENDESERT_REPORTING_CURRENCY, "USD");
assert.equal(GREENDESERT_WORKSPACE_LOGO_SRC, "/images/workspaces/greendesert/logo.png");
assert.equal(GREENDESERT_INFORMATION_REPOSITORY_WORKSPACE_CONFIG.features.architectureDiagrams, true);
assert.equal(GREENDESERT_BOARD_PORTAL_ORIGIN, "https://greendesert.unit311central.com");
assert.equal(GREENDESERT_BOARD_USERNAME, "board@greendesert.unit311central.com");
assert.ok(isGreenDesertHost("greendesert.unit311central.com"));
assert.ok(isGreenDesertBoardPortalUsername(GREENDESERT_BOARD_USERNAME));
assert.ok(verifyGreenDesertBoardPortalPassword("Algae2026$"));
assert.equal(verifyGreenDesertBoardPortalPassword("wrong"), false);

const jeddahRoute = getGreenDesertClientPortalByPath("jeddahtechnologies");
assert.ok(jeddahRoute);
assert.equal(jeddahRoute?.clientId, "greendesert-cli-jeddah-technologies");
assert.ok(isGreenDesertClientPortalUsername("jeddahtechnologies@greendesert.unit311central.com"));
assert.ok(verifyGreenDesertClientPortalPassword("Reactor20206$"));
assert.equal(getGreenDesertClientPortalByUsername("jeddahtechnologies@greendesert.unit311central.com")?.path, "jeddahtechnologies");

assert.equal(GREENDESERT_LOGISTICS_SHIPMENTS.length, 1);
assert.match(GREENDESERT_LOGISTICS_SHIPMENTS[0]?.origin ?? "", /Riyadh/i);
assert.match(GREENDESERT_LOGISTICS_SHIPMENTS[0]?.destination ?? "", /Jeddah/i);

assert.equal(GREENDESERT_REPRESENTATIVES_DASHBOARD_TILES[1]?.value, "$0");

bootstrapPortalWorkspacePacks();
const portalPack = getPortalPackBySlug(GREENDESERT_SLUG);
assert.ok(portalPack);
assert.equal(portalPack?.implBase, "/greendesert-portal");

ensureMarketingWorkspacePacksRegistered();
assert.ok(getMarketingWorkspacePack("greendesert"));

const saLabels = getPayrollUiLabels({ countryCode: "SA", defaultCurrency: "USD" });
assert.equal(saLabels.countryCode, "SA");
assert.match(saLabels.settingsBlurb, /Saudi Arabia/i);

const middleware = readFileSync(join(repoRoot, "src/middleware.ts"), "utf8");
assert.match(middleware, /Green Desert board portal/);
assert.match(middleware, /isGreenDesertSlug\(workspaceSlug\)/);

const boardLoginPage = readFileSync(join(repoRoot, "src/app/board/login/page.tsx"), "utf8");
assert.match(boardLoginPage, /GreenDesertBoardPortalLogin/);

const clientPortalPage = readFileSync(
  join(repoRoot, "src/app/greendesert-portal/[company]/login/page.tsx"),
  "utf8",
);
assert.match(clientPortalPage, /GreenDesertClientPortalLogin/);

const sidebarBrand = readFileSync(
  join(repoRoot, "src/components/layout/WorkspaceSidebarBrand.tsx"),
  "utf8",
);
assert.match(sidebarBrand, /greendesert/);
assert.match(sidebarBrand, /GreenDesertLogoMark/);
assert.match(sidebarBrand, /bg-white/);

const irWorkspace = readFileSync(
  join(repoRoot, "src/components/testflighthub/InterfaceWorxInformationRepositoryWorkspace.tsx"),
  "utf8",
);
assert.match(irWorkspace, /CustomerArchitectureWorkspace/);

const loginRoute = readFileSync(join(repoRoot, "src/app/api/auth/login/route.ts"), "utf8");
assert.match(loginRoute, /createGreenDesertClientPortalLoginResponse/);
assert.match(loginRoute, /Green Desert external portals — credential fallback before DB/);

console.log("greendesert-workspace.check.ts — all assertions passed");
