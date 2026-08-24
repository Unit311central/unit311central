/**
 * Fundraising workspace surface isolation checks.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildFundraisingWorkspaceEyebrow,
  FUNDRAISING_MODULE_VIEWS,
  isFundraisingModuleEnabled,
  isFundraisingModuleView,
  resolveFundraisingSurfaceKind,
} from "@/lib/fundraising-workspace-surface";
import { WORKSPACE_FUNDING_ROUNDS } from "@/lib/workspace-fundraising-data";

assert.ok(isFundraisingModuleView("fundraising-meetings"));
assert.ok(!isFundraisingModuleView("financials"));
assert.equal(FUNDRAISING_MODULE_VIEWS.size, 7);

assert.equal(isFundraisingModuleEnabled(null), true);
assert.equal(isFundraisingModuleEnabled([]), true);
assert.equal(isFundraisingModuleEnabled(["home", "fundraising"]), true);
assert.equal(isFundraisingModuleEnabled(["home", "financials"]), false);
assert.equal(
  isFundraisingModuleEnabled(["home", "financials"], {
    workspaceSlug: "demo",
    workspaceType: "Demo",
    enabledSubModules: [],
  }),
  true,
);

assert.equal(
  buildFundraisingWorkspaceEyebrow({
    workspaceSlug: "interfaceworx",
    workspaceName: "Interface Worx",
  }),
  "Interface Worx · Fundraising",
);

assert.ok(WORKSPACE_FUNDING_ROUNDS.length >= 2);
assert.ok(
  WORKSPACE_FUNDING_ROUNDS.every((round) => !round.typicalUse.includes("VTOL")),
  "Workspace fundraising rounds must not leak OnwardAir programme copy",
);

const dashboard = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(dashboard, /FundraisingMeetingsHost/);
assert.match(dashboard, /FundraisingDataRoomsHost/);
assert.match(dashboard, /FundraisingCapTableHost/);
assert.doesNotMatch(dashboard, /fundraising-cap-table[\s\S]*isBrowserDemoSurface\(\)/);
assert.doesNotMatch(dashboard, /<FundraisingMeetingsWorkspace \/>/);

const hosts = readFileSync(
  join(process.cwd(), "src/components/testflighthub/FundraisingViewHosts.tsx"),
  "utf8",
);
assert.match(hosts, /resolveFundraisingSurfaceKind/);
assert.match(hosts, /surface === "workspace"/);

const fundraisingWorkspaces = readFileSync(
  join(process.cwd(), "src/components/onwardair/FundraisingWorkspaces.tsx"),
  "utf8",
);
assert.match(fundraisingWorkspaces, /useFundraisingPresentation/);
assert.match(fundraisingWorkspaces, /WORKSPACE_FUNDING_ROUNDS/);

console.log("ok  fundraising-workspace-surface checks passed\n");
