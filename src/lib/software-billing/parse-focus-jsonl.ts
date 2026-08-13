import type { ChargeAggregation, FocusBillingCharge } from "@/lib/software-billing/types";

function round4(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

export function parseFocusJsonl(text: string): FocusBillingCharge[] {
  const rows: FocusBillingCharge[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(JSON.parse(trimmed) as FocusBillingCharge);
  }
  return rows;
}

export function aggregateFocusCharges(charges: readonly FocusBillingCharge[]): ChargeAggregation {
  const byService: Record<string, { effective: number; billed: number }> = {};
  let usageEffective = 0;
  let usageBilled = 0;
  let creditsApplied = 0;
  let additionalPurchases = 0;
  let taxAmount = 0;
  let adjustmentsAmount = 0;
  let baseSubscription = 0;
  let totalEffective = 0;
  let totalBilled = 0;

  for (const row of charges) {
    const effective = Number(row.EffectiveCost ?? 0);
    const billed = Number(row.BilledCost ?? 0);
    const category = String(row.ChargeCategory ?? "");
    const service = String(row.ServiceName ?? "Unknown");

    totalEffective += effective;
    totalBilled += billed;

    if (!byService[service]) {
      byService[service] = { effective: 0, billed: 0 };
    }
    byService[service].effective += effective;
    byService[service].billed += billed;

    if (category === "Usage") {
      usageEffective += effective;
      usageBilled += billed;
    } else if (category === "Credit") {
      creditsApplied += Math.abs(billed !== 0 ? billed : effective);
    } else if (category === "Purchase") {
      additionalPurchases += billed;
    } else if (category === "Tax") {
      taxAmount += billed;
    } else if (category === "Adjustment") {
      adjustmentsAmount += billed;
    }

    if (/^pro$/i.test(service)) {
      baseSubscription += billed > 0 ? billed : effective;
    }
  }

  return {
    lineCount: charges.length,
    usageEffective: round4(usageEffective),
    usageBilled: round4(usageBilled),
    creditsApplied: round4(creditsApplied),
    additionalPurchases: round4(additionalPurchases),
    taxAmount: round4(taxAmount),
    adjustmentsAmount: round4(adjustmentsAmount),
    baseSubscription: round4(baseSubscription),
    totalEffective: round4(totalEffective),
    totalBilled: round4(totalBilled),
    byService: Object.fromEntries(
      Object.entries(byService).map(([name, values]) => [
        name,
        { effective: round4(values.effective), billed: round4(values.billed) },
      ]),
    ),
  };
}

export function buildDailyChargeFacts(charges: FocusBillingCharge[]) {
  const map = new Map<
    string,
    {
      chargeDate: string;
      serviceName: string;
      chargeCategory: string;
      effectiveCost: number;
      billedCost: number;
      pricingQuantity: number;
      tags: Record<string, string>;
    }
  >();

  for (const row of charges) {
    const chargeDate = String(row.ChargePeriodStart ?? "").slice(0, 10);
    if (!chargeDate) continue;
    const serviceName = String(row.ServiceName ?? "");
    const chargeCategory = String(row.ChargeCategory ?? "");
    const key = `${chargeDate}|${serviceName}|${chargeCategory}`;
    const existing = map.get(key) ?? {
      chargeDate,
      serviceName,
      chargeCategory,
      effectiveCost: 0,
      billedCost: 0,
      pricingQuantity: 0,
      tags: row.Tags ?? {},
    };
    existing.effectiveCost += Number(row.EffectiveCost ?? 0);
    existing.billedCost += Number(row.BilledCost ?? 0);
    existing.pricingQuantity += Number(row.PricingQuantity ?? 0);
    map.set(key, existing);
  }

  return [...map.values()].map((row) => ({
    ...row,
    effectiveCost: round4(row.effectiveCost),
    billedCost: round4(row.billedCost),
    pricingQuantity: round4(row.pricingQuantity),
  }));
}
