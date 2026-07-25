/**
 * Parse expected platform billing amounts from executive questions such as
 * "they should pay ($1,300 × 3) on signup for quarterly in advance".
 */

export const MARKETING_PROFESSIONAL_MONTHLY_USD = 1300;

export type ParsedBillingExpectation = {
  expectedMonthlyUsd: number | null;
  expectedQuarterlyUsd: number | null;
  expectedAnnualUsd: number | null;
  expectedFrequency: "monthly" | "quarterly" | "annual" | null;
};

export function isPlatformBillingQuery(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower) return false;
  if (/\b(pdf|export|download|create\s+client|archive\s+client)\b/i.test(lower)) return false;

  if (
    /\b(subscriptions?|platform\s+billing|billing\s+(details|page|workspace|amount|frequency)|mrr|arr|signup\s+(fee|amount|price|charge)|quarterly\s+in\s+advance|plan\s+price|professional\s+plan)\b/i.test(
      lower,
    )
  ) {
    return true;
  }

  if (
    /\bshould\s+pay\b/i.test(lower) &&
    /\b(client|customer|subscription|signup|quarterly|monthly|annual)\b/i.test(lower)
  ) {
    return true;
  }

  if (
    /\b(active\s+)?(clients?|customers?)\b/i.test(lower) &&
    /\b(pay|payment|price|pricing|\$|usd|quarterly|monthly|annual|reflected|billing|subscription)\b/i.test(
      lower,
    ) &&
    /\b(reflected|details|signup|advance|billing|subscription|plan|mrr)\b/i.test(lower)
  ) {
    return true;
  }

  return false;
}

export function parseExpectedBillingFromQuestion(question: string): ParsedBillingExpectation {
  const lower = question.toLowerCase();
  let expectedFrequency: ParsedBillingExpectation["expectedFrequency"] = null;
  if (/\bquarterly\b/i.test(lower)) expectedFrequency = "quarterly";
  else if (/\bannual|yearly\b/i.test(lower)) expectedFrequency = "annual";
  else if (/\bmonthly\b/i.test(lower)) expectedFrequency = "monthly";

  let expectedMonthlyUsd: number | null = null;
  let expectedQuarterlyUsd: number | null = null;
  let expectedAnnualUsd: number | null = null;

  const product = question.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*[×x*]\s*(\d+)/i);
  if (product) {
    const base = Number(product[1].replace(/,/g, ""));
    const multiplier = Number(product[2]);
    if (Number.isFinite(base) && Number.isFinite(multiplier) && multiplier > 0) {
      if (multiplier === 3) {
        expectedMonthlyUsd = base;
        expectedQuarterlyUsd = base * 3;
        if (!expectedFrequency) expectedFrequency = "quarterly";
      } else if (multiplier === 12) {
        expectedMonthlyUsd = base;
        expectedAnnualUsd = base * 12;
        if (!expectedFrequency) expectedFrequency = "annual";
      } else {
        expectedQuarterlyUsd = base * multiplier;
      }
    }
  }

  if (expectedMonthlyUsd == null) {
    const single = question.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    if (single) {
      const amount = Number(single[1].replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0) {
        if (expectedFrequency === "quarterly") {
          expectedQuarterlyUsd = amount;
          expectedMonthlyUsd = Math.round((amount / 3) * 100) / 100;
        } else if (expectedFrequency === "annual") {
          expectedAnnualUsd = amount;
          expectedMonthlyUsd = Math.round((amount / 12) * 100) / 100;
        } else {
          expectedMonthlyUsd = amount;
          expectedQuarterlyUsd = amount * 3;
          expectedAnnualUsd = amount * 12;
        }
      }
    }
  }

  if (expectedMonthlyUsd == null && expectedFrequency === "quarterly" && /\b1300\b/.test(lower)) {
    expectedMonthlyUsd = MARKETING_PROFESSIONAL_MONTHLY_USD;
    expectedQuarterlyUsd = MARKETING_PROFESSIONAL_MONTHLY_USD * 3;
  }

  if (expectedMonthlyUsd != null && expectedQuarterlyUsd == null) {
    expectedQuarterlyUsd = expectedMonthlyUsd * 3;
  }
  if (expectedMonthlyUsd != null && expectedAnnualUsd == null) {
    expectedAnnualUsd = expectedMonthlyUsd * 12;
  }

  return {
    expectedMonthlyUsd,
    expectedQuarterlyUsd,
    expectedAnnualUsd,
    expectedFrequency,
  };
}

export function chargeForFrequency(
  mrrUsd: number,
  frequency: "monthly" | "quarterly" | "annual" | string,
) {
  if (frequency === "quarterly") return mrrUsd * 3;
  if (frequency === "annual") return mrrUsd * 12;
  return mrrUsd;
}
