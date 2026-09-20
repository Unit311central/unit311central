import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS,
  INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK,
} from "@/lib/internal-sales-opportunities-architecture";

assert.ok(INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS.includes("prospects"));
assert.ok(INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS.includes("discovery"));
assert.ok(!INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS.includes("opportunities"));
assert.ok(!INTERNAL_OPPORTUNITIES_ARCHITECTURE_HIDDEN_TABS.includes("sales-quotes"));
assert.ok(INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK.length >= 5);

const hub = readFileSync(
  join(process.cwd(), "src/components/testflighthub/sales-management/InternalSalesOpportunitiesArchitectureHub.tsx"),
  "utf8",
);
assert.match(hub, /Create Opportunity/);
assert.match(hub, /Select existing client/);
assert.match(hub, /Create new client/);
assert.match(hub, /File Explorer/);
assert.match(hub, /Sales Quotes/);

console.log("ok  internal-sales-opportunities-architecture");
