import { round2 } from "@/lib/software-billing/period-utils";
import type { CursorUsageEvent } from "@/lib/software-billing/cursor-client";

export function aggregateCursorUsageEvents(events: CursorUsageEvent[]) {
  const byDay: Array<{
    chargeDate: string;
    serviceName: string;
    billedCost: number;
    effectiveCost: number;
  }> = [];
  const byModel: Record<string, number> = {};
  let totalCents = 0;

  for (const event of events) {
    totalCents += event.chargedCents;
    const chargeDate = event.timestamp.slice(0, 10);
    const serviceName = event.model || "cursor-usage";
    byModel[serviceName] = round2((byModel[serviceName] ?? 0) + event.chargedCents / 100);
    byDay.push({
      chargeDate,
      serviceName,
      billedCost: round2(event.chargedCents / 100),
      effectiveCost: round2(event.chargedCents / 100),
    });
  }

  return {
    lineCount: events.length,
    totalBilled: round2(totalCents / 100),
    byModel,
    byDay,
  };
}

export function estimateCursorSeatSubscriptionMonthly(seatCount: number) {
  // Teams list price; API does not expose invoice line items for seat fees.
  return round2(seatCount * 40);
}
