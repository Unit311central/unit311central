/**
 * Regression: Demo Fundraising authenticated UI must stay reachable when legacy
 * workspace_admin_metadata lists only the 5-module starter pack.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  isFundraisingModuleEnabled,
  isFundraisingModuleView,
  resolveFundraisingSurfaceKind,
} from "@/lib/fundraising-workspace-surface";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import { isViewAllowedForWorkspaceGrants } from "@/lib/workspace-enabled-views";

const LEGACY_DEMO_MODULES = [
  "home",
  "executive-assistant",
  "business-central",
  "financials",
  "board",
] as const;

const demoEnablement = resolveWorkspaceNavEnablement({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enabledModules: [...LEGACY_DEMO_MODULES],
  enabledSubModules: [],
  allowDefaultFallback: true,
});

assert.ok(
  demoEnablement.enabledModules.includes("fundraising"),
  "Demo nav enablement must include fundraising when submodule metadata is empty",
);

assert.equal(
  isFundraisingModuleEnabled([...LEGACY_DEMO_MODULES], {
    workspaceSlug: "demo",
    workspaceType: "Demo",
    enabledSubModules: [],
  }),
  true,
  "Fundraising module gate must follow resolved Demo enablement, not raw metadata",
);

for (const view of [
  "fundraising-dashboard",
  "fundraising-investors",
  "fundraising-cap-table",
  "fundraising-pipeline",
  "fundraising-meetings",
  "fundraising-pitch-decks",
  "fundraising-data-rooms",
] as const) {
  assert.ok(isFundraisingModuleView(view), `${view} must be a fundraising view`);
  assert.equal(
    resolveFundraisingSurfaceKind("demo"),
    "demo",
    `${view} must resolve demo fundraising surface from authenticated workspace slug`,
  );
  assert.equal(
    isViewAllowedForWorkspaceGrants(view, null, {
      workspaceSlug: "demo",
      enabledModules: demoEnablement.enabledModules,
      enabledSubModules: demoEnablement.enabledSubModules,
    }),
    true,
    `${view} must remain entitled for Demo owner via resolved enablement`,
  );
}

assert.equal(
  isFundraisingModuleEnabled(["home", "financials"], {
    workspaceSlug: "interfaceworx",
    workspaceType: "Customer",
    enabledSubModules: ["financials:financials"],
  }),
  false,
  "Customer workspaces must still honour raw module metadata",
);

const dashboard = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(dashboard, /FundraisingCapTableHost/);
assert.match(dashboard, /resolveWorkspaceNavEnablement/);
assert.doesNotMatch(
  dashboard,
  /fundraising-cap-table[\s\S]*isBrowserDemoSurface\(\)/,
  "Cap table must not branch on isBrowserDemoSurface directly",
);

console.log("ok  demo-fundraising-auth-ui checks passed\n");
