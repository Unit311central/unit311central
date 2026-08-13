/**
 * Vercel upcoming invoice accounting checks.
 * Run: node --import tsx src/lib/software-billing/__tests__/vercel-upcoming-invoice.check.ts
 */
import assert from "node:assert/strict";

import {
  aggregateVercelMeteredUsage,
  computeVercelNetOnDemandUsd,
  extractVercelSubscriptionLineItems,
  resolveVercelMonthlyUsageCreditPoolUsd,
  VERCEL_PRO_PLUS_MONTHLY_USAGE_CREDIT_USD,
} from "@/lib/software-billing/vercel-upcoming-invoice";
import type { FocusBillingCharge } from "@/lib/software-billing/types";
import type { VercelTeamBillingDetails } from "@/lib/software-billing/vercel-client";

const teamPlus: VercelTeamBillingDetails = {
  plan: "pro",
  planIteration: "plus",
  currency: "USD",
  periodStart: "2026-07-22T07:00:00.000Z",
  periodEnd: "2026-08-22T07:00:00.000Z",
  baseSubscriptionMonthly: 20,
  seatCount: 1,
  analyticsSpendLimitDollars: 500,
  includedAllocationEnabled: true,
  teamId: "team_test",
  teamSlug: "test-team",
  invoiceItems: {
    pro: { price: 2000, quantity: 1 },
    teamSeats: { price: 2000, quantity: 1 },
    includedAllocationUsd: { price: 0, quantity: 20, highestQuantity: 20 },
  },
};

const subscription = extractVercelSubscriptionLineItems(teamPlus);
assert.equal(subscription.length, 2);
assert.equal(subscription.reduce((s, row) => s + row.amount, 0), 40);

assert.equal(resolveVercelMonthlyUsageCreditPoolUsd(teamPlus), VERCEL_PRO_PLUS_MONTHLY_USAGE_CREDIT_USD);

const charges: FocusBillingCharge[] = [
  {
    BilledCost: 105.5,
    EffectiveCost: 125.1,
    ChargeCategory: "Usage",
    ChargePeriodStart: "2026-07-22T00:00:00.000Z",
    ChargePeriodEnd: "2026-07-23T00:00:00.000Z",
    ServiceName: "Build CPU Minutes",
  },
  {
    BilledCost: 1.35,
    EffectiveCost: 1.9,
    ChargeCategory: "Usage",
    ChargePeriodStart: "2026-07-22T00:00:00.000Z",
    ChargePeriodEnd: "2026-07-23T00:00:00.000Z",
    ServiceName: "Fluid Active CPU",
  },
];

const metered = aggregateVercelMeteredUsage(charges);
assert.ok(metered.meteredUsageBilled > 106);
const netOnDemand = computeVercelNetOnDemandUsd({
  meteredUsageBilled: metered.meteredUsageBilled,
  usageCreditPoolUsd: VERCEL_PRO_PLUS_MONTHLY_USAGE_CREDIT_USD,
});
assert.ok(netOnDemand > 6 && netOnDemand < 8);
const upcomingTotal = Math.round((40 + netOnDemand) * 100) / 100;
assert.ok(upcomingTotal >= 46.5 && upcomingTotal <= 47.5, `expected ~46.79, got ${upcomingTotal}`);

console.log("vercel-upcoming-invoice.check.ts: all assertions passed");
