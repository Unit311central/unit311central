/**
 * Business Central dashboard workspace branding isolation.
 * Run: npm run prove:business-central-branding
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildBusinessCentralDashboardEyebrow,
  resolveBusinessCentralDashboardVariant,
} from "@/lib/business-central-dashboard-variant";
import { TEST_WORKSPACE_SLUG } from "@/lib/qa-workspace/constants";

const repoRoot = join(process.cwd());

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

// --- Variant resolution: demo / OnwardAir / everyone else ---
assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: true,
    onwardAirSurface: false,
    workspaceSlug: "demo",
  }),
  "northstar",
);

assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: false,
    onwardAirSurface: true,
    workspaceSlug: "onwardair",
  }),
  "onwardair",
);

assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: false,
    onwardAirSurface: false,
    workspaceSlug: "onwardair",
  }),
  "onwardair",
);

assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: false,
    onwardAirSurface: false,
    workspaceSlug: TEST_WORKSPACE_SLUG,
  }),
  "workspace",
);

assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: false,
    onwardAirSurface: false,
    workspaceSlug: "interfaceworx",
  }),
  "workspace",
);

assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: false,
    onwardAirSurface: false,
    workspaceSlug: "greendesert",
  }),
  "workspace",
);

// Demo wins over OnwardAir preview slug when both would apply.
assert.equal(
  resolveBusinessCentralDashboardVariant({
    demoSurface: true,
    onwardAirSurface: true,
    workspaceSlug: "onwardair",
  }),
  "northstar",
);

// --- Eyebrow branding must not leak OnwardAir / Northstar into customer workspaces ---
assert.equal(
  buildBusinessCentralDashboardEyebrow({ variant: "onwardair" }),
  "OnwardAir · Business Central",
);

assert.equal(
  buildBusinessCentralDashboardEyebrow({ variant: "northstar" }),
  "Northstar · Business Central",
);

assert.equal(
  buildBusinessCentralDashboardEyebrow({
    variant: "workspace",
    workspaceSlug: TEST_WORKSPACE_SLUG,
    workspaceName: "Test Workspace",
  }),
  "Test Workspace · Business Central",
);

assert.equal(
  buildBusinessCentralDashboardEyebrow({
    variant: "workspace",
    workspaceSlug: "interfaceworx",
    workspaceName: "Interface Worx",
  }),
  "Interface Worx · Business Central",
);

assert.equal(
  buildBusinessCentralDashboardEyebrow({
    variant: "workspace",
    workspaceSlug: "greendesert",
    workspaceName: null,
  }),
  "Greendesert · Business Central",
);

assert.ok(
  !buildBusinessCentralDashboardEyebrow({
    variant: "workspace",
    workspaceSlug: TEST_WORKSPACE_SLUG,
    workspaceName: "Test Workspace",
  }).includes("OnwardAir"),
  "Test workspace eyebrow must not include OnwardAir",
);

// --- Routing guard in InternalOperationsDashboard ---
const dashboardSource = readRepoFile("src/components/testflighthub/InternalOperationsDashboard.tsx");
assert.ok(
  dashboardSource.includes("isBrowserDemoSurface()"),
  "Business Central routing must keep Northstar demo branch",
);
assert.ok(
  dashboardSource.includes("isBrowserOnwardAirSurface()"),
  "Business Central routing must gate OnwardAir dashboard to OnwardAir surface",
);
assert.ok(
  dashboardSource.includes("<WorkspaceBusinessCentralDashboard />"),
  "Non-demo, non-OnwardAir workspaces must use workspace-branded dashboard",
);
assert.ok(
  !/business-central-dashboard[\s\S]{0,400}<OnwardAirBusinessCentralDashboard\s*\/>/.test(
    dashboardSource.replace(
      /isBrowserOnwardAirSurface\(\)\s*\?\s*\(\s*<OnwardAirBusinessCentralDashboard\s*\/>\s*\)/,
      "",
    ),
  ),
  "OnwardAir dashboard must not be the default fallback for all non-demo hosts",
);

// --- OnwardAir component must not hardcode eyebrow (shared resolver) ---
const onwardAirSource = readRepoFile("src/components/onwardair/OnwardAirBusinessCentralDashboard.tsx");
assert.ok(
  onwardAirSource.includes("buildBusinessCentralDashboardEyebrow"),
  "OnwardAir dashboard eyebrow must come from shared branding resolver",
);
assert.ok(
  !onwardAirSource.includes("OnwardAir · Business Central"),
  "OnwardAir eyebrow string must not be duplicated outside the resolver",
);

console.log("business-central-branding.check.ts: all assertions passed");
