/**
 * WOLF Sentinel host: Unit311 modules, WOLF clients and WOLF sales.
 * Run: node --import tsx src/lib/wolf/__tests__/wolf-sentinel.check.ts
 */
import assert from "node:assert/strict";

import { readRequestedSalesBusinessContext } from "@/lib/sales-business-context";
import {
  WOLF_SENTINEL_MODULE_IDS,
  isWolfSentinelHost,
  requestTargetsWolfSentinel,
  supportTicketsVisibleOnWolfSentinel,
} from "@/lib/wolf/wolf-sentinel";
import {
  buildWolfSentinelNavSections,
  isWolfSentinelView,
} from "@/lib/wolf/wolf-sentinel-nav";

assert.equal(isWolfSentinelHost("wolfsentinel.unit311central.com"), true);
assert.equal(isWolfSentinelHost("internal.unit311central.com"), false);
assert.equal(isWolfSentinelHost("wolf.unit311central.com"), false);

const headers = new Headers({
  host: "wolfsentinel.unit311central.com",
  "x-unit311-workspace-slug": "wolfsentinel",
});
assert.equal(requestTargetsWolfSentinel(headers), true);
assert.equal(
  readRequestedSalesBusinessContext(
    new Request("https://wolfsentinel.unit311central.com/api/financials/sales-quotes", {
      headers,
    }),
  ),
  "wolf",
);

const internal = new Headers({ host: "internal.unit311central.com" });
assert.equal(requestTargetsWolfSentinel(internal), false);
assert.equal(
  readRequestedSalesBusinessContext(
    new Request("https://internal.unit311central.com/api/clients"),
  ),
  undefined,
);

const labels = buildWolfSentinelNavSections().map((section) =>
  section.kind === "pin" ? section.items[0]?.label : section.label,
);
assert.deepEqual(labels, [
  "HOME",
  "Business Central",
  "Sales Management",
  "Operations",
  "Business Productivity",
  "Support Desk",
  "Settings",
]);

const settings = buildWolfSentinelNavSections().find((section) => section.label === "Settings");
assert.deepEqual(
  settings?.items.map((item) => item.label),
  ["Profile"],
);
assert.equal(isWolfSentinelView("clients"), true);
assert.equal(isWolfSentinelView("sales-management"), true);
assert.equal(isWolfSentinelView("profile"), true);
assert.equal(isWolfSentinelView("human-resources"), false);
assert.equal(isWolfSentinelView("settings"), false);
assert.deepEqual(
  [...WOLF_SENTINEL_MODULE_IDS],
  [
    "home",
    "business-central",
    "sales-management",
    "operations",
    "business-productivity",
    "support-desk",
    "settings",
  ],
);

const visible = supportTicketsVisibleOnWolfSentinel(
  [
    { id: "SUP-1", clientId: "wolf-client" },
    { id: "SUP-2", clientId: "unit311-client" },
    { id: "SUP-3", clientId: null },
  ],
  new Set(["wolf-client"]),
);
assert.deepEqual(
  visible.map((ticket) => ticket.id),
  ["SUP-1"],
);

console.log("wolf-sentinel.check.ts: ok");
