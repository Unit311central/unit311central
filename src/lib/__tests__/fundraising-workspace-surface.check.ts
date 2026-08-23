/**
 * Fundraising workspace surface isolation checks.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FUNDRAISING_MODULE_VIEWS,
  isFundraisingModuleEnabled,
  isFundraisingModuleView,
} from "@/lib/fundraising-workspace-surface";

assert.ok(isFundraisingModuleView("fundraising-meetings"));
assert.ok(!isFundraisingModuleView("financials"));
assert.equal(FUNDRAISING_MODULE_VIEWS.size, 7);

assert.equal(isFundraisingModuleEnabled(null), true);
assert.equal(isFundraisingModuleEnabled([]), true);
assert.equal(isFundraisingModuleEnabled(["home", "fundraising"]), true);
assert.equal(isFundraisingModuleEnabled(["home", "financials"]), false);

const dashboard = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(dashboard, /FundraisingMeetingsHost/);
assert.match(dashboard, /FundraisingDataRoomsHost/);
assert.doesNotMatch(dashboard, /<FundraisingMeetingsWorkspace \/>/);

const hosts = readFileSync(
  join(process.cwd(), "src/components/testflighthub/FundraisingViewHosts.tsx"),
  "utf8",
);
assert.match(hosts, /resolveFundraisingSurfaceKind/);
assert.match(hosts, /FundraisingCustomerEmptyWorkspace/);

console.log("ok  fundraising-workspace-surface checks passed\n");
