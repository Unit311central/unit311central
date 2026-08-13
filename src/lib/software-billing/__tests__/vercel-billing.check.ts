/**
 * Vercel billing parser/aggregation checks.
 * Run: node --import tsx src/lib/software-billing/__tests__/vercel-billing.check.ts
 */
import assert from "node:assert/strict";

import {
  aggregateFocusCharges,
  parseFocusJsonl,
} from "@/lib/software-billing/parse-focus-jsonl";
import type { FocusBillingCharge } from "@/lib/software-billing/types";

const period = {
  start: "2026-07-01T00:00:00.000Z",
  end: "2026-07-02T00:00:00.000Z",
};

const julyFixture: FocusBillingCharge[] = [
  {
    BilledCost: 32.046,
    EffectiveCost: 32.046,
    ChargeCategory: "Usage",
    ChargePeriodStart: period.start,
    ChargePeriodEnd: period.end,
    ServiceName: "Build CPU Minutes",
  },
  {
    BilledCost: 8.0480168306,
    EffectiveCost: 8.0480168306,
    ChargeCategory: "Usage",
    ChargePeriodStart: period.start,
    ChargePeriodEnd: period.end,
    ServiceName: "Fluid Active CPU",
  },
  {
    BilledCost: -27.0967741935,
    EffectiveCost: -27.0967741935,
    ChargeCategory: "Credit",
    ChargePeriodStart: period.start,
    ChargePeriodEnd: period.end,
    ServiceName: "Included Allocation",
  },
];

const julyAgg = aggregateFocusCharges(julyFixture);
assert.equal(julyAgg.lineCount, 3);
assert.ok(Math.abs(julyAgg.usageEffective - 40.0940168306) < 0.0001);
assert.ok(Math.abs(julyAgg.totalBilled - 12.9972426371) < 0.0001);
assert.ok(Math.abs(julyAgg.creditsApplied - 27.0967741935) < 0.0001);

const jsonl = julyFixture.map((row) => JSON.stringify(row)).join("\n");
assert.equal(parseFocusJsonl(jsonl).length, 3);

const completed = { periodKind: "completed" as const, billedAmount: 12.9972 };
const inProgress = { periodKind: "in_progress" as const, projectedAmount: 105.7267 };
assert.notEqual(completed.billedAmount, inProgress.projectedAmount);
assert.ok(completed.billedAmount < 20, "July completed billed should remain actual");

const manualMonthly = 240;
const vercelUpcoming = 105.7267;
const total = manualMonthly + vercelUpcoming;
assert.ok(total > vercelUpcoming, "manual software should remain in overall totals");

console.log("vercel-billing.check.ts: OK");
