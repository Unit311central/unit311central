/**
 * Vercel upcoming invoice computation.
 *
 * Accounting layers (never mix):
 *   1. Raw metered usage (FOCUS charges) — informational only
 *   2. Provider credits/allowances (plan credit pool)
 *   3. Subscription line items (team billing API — full monthly rates)
 *   4. Net on-demand usage (metered billed minus credit pool)
 *   5. Upcoming invoice total = subscription + net on-demand
 *
 * Raw FOCUS totals are NOT invoice amounts.
 */

import { aggregateFocusCharges, parseFocusJsonl } from "@/lib/software-billing/parse-focus-jsonl";
import { roundMoney } from "@/lib/software-billing/dashboard-model";
import type { FocusBillingCharge } from "@/lib/software-billing/types";
import {
  fetchVercelBillingCharges,
  fetchVercelTeamBillingDetails,
  type VercelTeamBillingDetails,
} from "@/lib/software-billing/vercel-client";

/** Documented Vercel Pro platform monthly usage credit (USD). */
export const VERCEL_PRO_DOCUMENTED_MONTHLY_USAGE_CREDIT_USD = 20;

/** Pro Plus enhanced monthly usage credit pool (USD), reconciled to Vercel Billing UI. */
export const VERCEL_PRO_PLUS_MONTHLY_USAGE_CREDIT_USD = 100;

const SUBSCRIPTION_SERVICE_NAMES =
  /^(Pro|Additional Team Seats|Observability Plus|Web Analytics Plus|Analytics)$/i;

export type VercelSubscriptionLineItem = {
  key: string;
  name: string;
  amount: number;
  quantity: number;
};

export type VercelMeteredUsageSummary = {
  meteredUsageBilled: number;
  meteredUsageEffective: number;
  rawUsageLineCount: number;
  focusTotalBilled: number;
  focusTotalEffective: number;
};

export type VercelUpcomingInvoicePreview = {
  subscriptionLineItems: VercelSubscriptionLineItem[];
  subscriptionTotal: number;
  rawUsageAmount: number;
  creditsAndAllowancesAmount: number;
  netOnDemandAmount: number;
  upcomingInvoiceTotal: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  scheduledPaymentDate: string;
  note: string;
};

export function extractVercelSubscriptionLineItems(
  team: VercelTeamBillingDetails,
): VercelSubscriptionLineItem[] {
  const items = team.invoiceItems;
  const lines: VercelSubscriptionLineItem[] = [];

  const push = (key: string, name: string, priceCents: number, quantity: number) => {
    if (quantity <= 0 || priceCents <= 0) return;
    lines.push({
      key,
      name,
      amount: roundMoney((priceCents / 100) * quantity),
      quantity,
    });
  };

  push("pro", "Pro", items.pro?.price ?? 0, items.pro?.quantity ?? 0);
  push(
    "teamSeats",
    "Additional Team Seat",
    items.teamSeats?.price ?? 0,
    items.teamSeats?.quantity ?? 0,
  );
  push("analytics", "Analytics", items.analytics?.price ?? 0, items.analytics?.quantity ?? 0);

  return lines;
}

export function resolveVercelMonthlyUsageCreditPoolUsd(team: VercelTeamBillingDetails): number {
  if (team.plan === "pro" && team.planIteration === "plus") {
    return VERCEL_PRO_PLUS_MONTHLY_USAGE_CREDIT_USD;
  }
  let pool = VERCEL_PRO_DOCUMENTED_MONTHLY_USAGE_CREDIT_USD;
  if (team.includedAllocationEnabled) {
    const flexUsd = Number(team.invoiceItems.includedAllocationUsd?.quantity ?? 0);
    if (flexUsd > 0) pool += flexUsd;
  }
  return pool;
}

export function aggregateVercelMeteredUsage(charges: readonly FocusBillingCharge[]): VercelMeteredUsageSummary {
  const agg = aggregateFocusCharges(charges);
  let meteredUsageBilled = 0;
  let meteredUsageEffective = 0;

  for (const row of charges) {
    const service = String(row.ServiceName ?? "");
    if (SUBSCRIPTION_SERVICE_NAMES.test(service)) continue;
    if (String(row.ChargeCategory ?? "") !== "Usage") continue;
    meteredUsageBilled += Number(row.BilledCost ?? 0);
    meteredUsageEffective += Number(row.EffectiveCost ?? 0);
  }

  return {
    meteredUsageBilled: roundMoney(meteredUsageBilled),
    meteredUsageEffective: roundMoney(meteredUsageEffective),
    rawUsageLineCount: charges.length,
    focusTotalBilled: agg.totalBilled,
    focusTotalEffective: agg.totalEffective,
  };
}

export function computeVercelNetOnDemandUsd(input: {
  meteredUsageBilled: number;
  usageCreditPoolUsd: number;
}): number {
  const creditsApplied = Math.min(input.meteredUsageBilled, input.usageCreditPoolUsd);
  return roundMoney(Math.max(0, input.meteredUsageBilled - creditsApplied));
}

export async function fetchVercelUpcomingInvoicePreview(): Promise<VercelUpcomingInvoicePreview> {
  const team = await fetchVercelTeamBillingDetails();
  const nowIso = new Date().toISOString();
  const chargesText = await fetchVercelBillingCharges(team.periodStart, nowIso);
  const charges = parseFocusJsonl(chargesText);
  const metered = aggregateVercelMeteredUsage(charges);
  const subscriptionLineItems = extractVercelSubscriptionLineItems(team);
  const subscriptionTotal = roundMoney(
    subscriptionLineItems.reduce((sum, row) => sum + row.amount, 0),
  );
  const usageCreditPoolUsd = resolveVercelMonthlyUsageCreditPoolUsd(team);
  const netOnDemandAmount = computeVercelNetOnDemandUsd({
    meteredUsageBilled: metered.meteredUsageBilled,
    usageCreditPoolUsd,
  });
  const creditsAndAllowancesAmount = roundMoney(
    Math.max(0, metered.meteredUsageBilled - netOnDemandAmount),
  );
  const upcomingInvoiceTotal = roundMoney(subscriptionTotal + netOnDemandAmount);

  return {
    subscriptionLineItems,
    subscriptionTotal,
    rawUsageAmount: metered.meteredUsageBilled,
    creditsAndAllowancesAmount,
    netOnDemandAmount,
    upcomingInvoiceTotal,
    currency: team.currency,
    billingPeriodStart: team.periodStart,
    billingPeriodEnd: team.periodEnd,
    scheduledPaymentDate: team.periodEnd.slice(0, 10),
    note:
      "Upcoming invoice from Vercel team subscription lines + net on-demand usage after plan credit pool. Raw FOCUS usage is stored separately and is not the invoice amount.",
  };
}
