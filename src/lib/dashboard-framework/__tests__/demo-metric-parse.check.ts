import assert from "node:assert/strict";

import {
  formatDemoMetricValue,
  parseDemoMetricValue,
} from "@/lib/dashboard-framework/demo-metric-parse";

const gbp = parseDemoMetricValue("£1,245,000");
assert.equal(gbp.numeric, 1245000);
assert.equal(formatDemoMetricValue(gbp, 1245000), "£1,245,000");

const pct = parseDemoMetricValue("42.5%");
assert.equal(pct.numeric, 42.5);
assert.equal(formatDemoMetricValue(pct, 42.5), "42.5%");

assert.equal(parseDemoMetricValue("—").numeric, null);

console.log("demo-metric-parse.check: OK");
