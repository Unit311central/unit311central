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
  matchGreenDesertBoardPortalPathname,
  resolveGreenDesertBoardPortalPostLoginUrl,
} from "@/lib/greendesert/greendesert-board-portal-data";
import { GREENDESERT_LOGISTICS_SHIPMENTS } from "@/lib/greendesert/greendesert-logistics-data";
import { FEATURED_RIYADH_JEDDAH_ROUTE } from "@/lib/greendesert/greendesert-logistics-data";
import { GREENDESERT_ARCHITECTURE_DIAGRAMS } from "@/lib/greendesert/greendesert-architecture-diagrams-data";
import { GREENDESERT_IR_ARCHITECTURE_SLUGS } from "@/lib/greendesert/greendesert-information-repository-architecture-data";
import { buildGreenDesertEcaState } from "@/lib/greendesert/greendesert-eca-state";
import { GREENDESERT_HR_TEAM_EMPLOYEES } from "@/lib/greendesert/greendesert-hr-team-data";
import { GREENDESERT_COMPANY_INTELLIGENCE } from "@/lib/greendesert/greendesert-intelligence-data";
import { filterGreenDesertMessagingOperators } from "@/lib/greendesert/greendesert-messaging-operators";
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
import { GREENDESERT_ENABLED_MODULES } from "@/lib/greendesert/greendesert-provisioning";
import {
  allowsGreenDesertWorkspaceAccess,
  isGreenDesertWorkspaceOperatorUsername,
} from "@/lib/greendesert/greendesert-workspace-access";
import {
  applyGreenDesertWorkspaceAllowedViews,
  isViewAllowedForWorkspaceGrants,
} from "@/lib/workspace-enabled-views";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import { bootstrapPortalWorkspacePacks } from "@/lib/portals/workspace-packs";
import { getPortalPackBySlug } from "@/lib/portals/registry";
import { ensureMarketingWorkspacePacksRegistered, getMarketingWorkspacePack } from "@/lib/marketing/workspace-packs/registry";
import { resolveMarketingView } from "@/lib/marketing/view-resolver";
import { MARKETING_RENDERER_IDS } from "@/lib/marketing/workspace-packs/types";

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
assert.ok(matchGreenDesertBoardPortalPathname("/board"));
assert.ok(matchGreenDesertBoardPortalPathname("/board/decks"));
assert.equal(
  resolveGreenDesertBoardPortalPostLoginUrl({
    redirectPath: "/board",
    username: GREENDESERT_BOARD_USERNAME,
  }),
  `${GREENDESERT_BOARD_PORTAL_ORIGIN}/board`,
);

const jeddahRoute = getGreenDesertClientPortalByPath("jeddahtechnologies");
assert.ok(jeddahRoute);
assert.equal(jeddahRoute?.clientId, "greendesert-cli-jeddah-technologies");
assert.ok(isGreenDesertClientPortalUsername("jeddahtechnologies@greendesert.unit311central.com"));
assert.ok(verifyGreenDesertClientPortalPassword("Reactor20206$"));
assert.equal(getGreenDesertClientPortalByUsername("jeddahtechnologies@greendesert.unit311central.com")?.path, "jeddahtechnologies");

assert.equal(GREENDESERT_LOGISTICS_SHIPMENTS.length, 1);
assert.match(GREENDESERT_LOGISTICS_SHIPMENTS[0]?.origin ?? "", /Riyadh/i);
assert.match(GREENDESERT_LOGISTICS_SHIPMENTS[0]?.destination ?? "", /Jeddah/i);
assert.equal(FEATURED_RIYADH_JEDDAH_ROUTE.shipmentId, "gd-shp-jeddah-001");
assert.equal(GREENDESERT_HR_TEAM_EMPLOYEES.length, 4);
assert.equal(GREENDESERT_HR_TEAM_EMPLOYEES[0]?.fullName, "Ashley Pursglove");
assert.equal(GREENDESERT_HR_TEAM_EMPLOYEES[1]?.role, "Chief Executive Officer");
assert.ok(GREENDESERT_ARCHITECTURE_DIAGRAMS.some((row) => row.slug === "algae-cultivation-overview"));
assert.ok(GREENDESERT_IR_ARCHITECTURE_SLUGS.length === 4);

assert.ok(GREENDESERT_COMPANY_INTELLIGENCE.length >= 3);
assert.equal(buildGreenDesertEcaState().portals.length, 2);
assert.match(buildGreenDesertEcaState().portals[0]?.clientName ?? "", /Board|Jeddah/);
assert.ok(filterGreenDesertMessagingOperators([]).length >= 4);

ensureMarketingWorkspacePacksRegistered();
assert.ok(getMarketingWorkspacePack("greendesert"));
const mailingResolution = resolveMarketingView({
  view: "marketing-mailing-list",
  workspaceKey: "greendesert",
  workspaceSlug: GREENDESERT_SLUG,
});
assert.equal(mailingResolution?.rendererId, MARKETING_RENDERER_IDS.GREENDESERT_MAILING_LIST);
const storiesResolution = resolveMarketingView({
  view: "portfolio-stories",
  workspaceKey: "greendesert",
  workspaceSlug: GREENDESERT_SLUG,
});
assert.equal(storiesResolution?.rendererId, MARKETING_RENDERER_IDS.GREENDESERT_CLIENT_STORIES);
const dashboardResolution = resolveMarketingView({
  view: "oa-marketing-dashboard",
  workspaceKey: "greendesert",
  workspaceSlug: GREENDESERT_SLUG,
});
assert.equal(dashboardResolution?.rendererId, MARKETING_RENDERER_IDS.GREENDESERT_MARKETING_DASHBOARD);
const eventsResolution = resolveMarketingView({
  view: "marketing-events",
  workspaceKey: "greendesert",
  workspaceSlug: GREENDESERT_SLUG,
});
assert.equal(eventsResolution?.rendererId, MARKETING_RENDERER_IDS.GREENDESERT_EXTERNAL_EVENTS);

const saLabels = getPayrollUiLabels({ countryCode: "SA", defaultCurrency: "USD" });
assert.equal(saLabels.countryCode, "SA");
assert.match(saLabels.settingsBlurb, /Saudi Arabia/i);

assert.equal(GREENDESERT_REPRESENTATIVES_DASHBOARD_TILES[1]?.value, "$0");

assert.ok(isGreenDesertWorkspaceOperatorUsername("admin@greendesert.unit311central.com"));
assert.ok(
  allowsGreenDesertWorkspaceAccess(
    {
      sub: "gd-admin",
      username: "admin@greendesert.unit311central.com",
      displayName: "Green Desert Administrator",
      userType: "internal",
      redirectPath: "/dashboard",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    GREENDESERT_SLUG,
  ),
);

const gdEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: GREENDESERT_SLUG,
  workspaceType: "Customer",
});
assert.ok(gdEnablement.enabledModules.length >= GREENDESERT_ENABLED_MODULES.length);
assert.ok(
  isViewAllowedForWorkspaceGrants("technology-software", [], {
    workspaceSlug: GREENDESERT_SLUG,
    enabledModules: null,
    enabledSubModules: null,
  }),
);
assert.ok(
  applyGreenDesertWorkspaceAllowedViews([], GREENDESERT_SLUG, null, null)?.includes("hr"),
);

bootstrapPortalWorkspacePacks();
const portalPack = getPortalPackBySlug(GREENDESERT_SLUG);
assert.ok(portalPack);
assert.equal(portalPack?.implBase, "/greendesert-portal");

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
assert.match(irWorkspace, /GreenDesertInformationRepositoryArchitectureWorkspace/);
assert.match(irWorkspace, /isBrowserGreenDesertSurface\(\) \? "architecture" : "sections"/);

const techArchitecture = readFileSync(
  join(repoRoot, "src/components/testflighthub/TechnologyArchitectureWorkspace.tsx"),
  "utf8",
);
assert.match(techArchitecture, /isBrowserGreenDesertSurface\(\)/);
assert.match(techArchitecture, /GreenDesertInformationRepositoryArchitectureWorkspace/);

const orgChart = readFileSync(
  join(repoRoot, "src/components/testflighthub/OrgChartWorkspace.tsx"),
  "utf8",
);
assert.match(orgChart, /isGreenDesertSlug\(workspaceSlug\)/);
assert.match(orgChart, /inline-flex w-max max-w-none flex-nowrap/);

const boardPackModel = readFileSync(
  join(repoRoot, "src/lib/greendesert/greendesert-board-pack-model.ts"),
  "utf8",
);
assert.match(boardPackModel, /GREENDESERT_BOARD_AGENDA/);
assert.match(boardPackModel, /buildGreenDesertBoardPackData/);

const boardDeckApi = readFileSync(
  join(repoRoot, "src/app/api/greendesert/board-deck/route.ts"),
  "utf8",
);
assert.match(boardDeckApi, /generateGreenDesertBoardDeck/);

const boardPacksWorkspace = readFileSync(
  join(repoRoot, "src/components/greendesert/GreenDesertBoardPacksWorkspace.tsx"),
  "utf8",
);
assert.match(boardPacksWorkspace, /GreenDesertBoardPacksWorkspace/);

const internalDashboard = readFileSync(
  join(repoRoot, "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(internalDashboard, /GreenDesertBoardPacksWorkspace/);
assert.match(internalDashboard, /function FilesInternalWorkspace/);
assert.match(internalDashboard, /FileRepositoryWorkspace scope="internal"/);
assert.doesNotMatch(internalDashboard, /GreenDesertFileExplorerWorkspace/);

const filesBrowseRoute = readFileSync(join(repoRoot, "src/app/api/files/browse/route.ts"), "utf8");
assert.match(filesBrowseRoute, /ensureGreenDesertFilesSeeded/);
assert.match(filesBrowseRoute, /isGreenDesertSlug/);

const loginRoute = readFileSync(join(repoRoot, "src/app/api/auth/login/route.ts"), "utf8");
assert.match(loginRoute, /createGreenDesertClientPortalLoginResponse/);
assert.match(loginRoute, /Green Desert external portals — credential fallback before DB/);

console.log("greendesert-workspace.check.ts — all assertions passed");
