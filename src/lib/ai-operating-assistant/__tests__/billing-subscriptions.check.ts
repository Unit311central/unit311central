/**
 * Regression: billing / signup-amount questions must hit platform subscriptions,
 * not the generic queryBusiness snapshot.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/billing-subscriptions.check.ts
 */
import assert from "node:assert/strict";
import {
  isPlatformBillingQuery,
  parseExpectedBillingFromQuestion,
} from "../billing-query";
import { isEaGeneralIntentMode } from "../ea-general-mode";
import { resolveDirectIntent } from "../intent-router";
import { classifyKnowledgeDomain } from "../knowledge-domains";

const QUESTION =
  "for all my active clients, they should pay ($1,300 × 3) on signup for quarterly in advance. Is this reflected in their current details?";

{
  assert.equal(isPlatformBillingQuery(QUESTION), true);
  const expected = parseExpectedBillingFromQuestion(QUESTION);
  assert.equal(expected.expectedMonthlyUsd, 1300);
  assert.equal(expected.expectedQuarterlyUsd, 3900);
  assert.equal(expected.expectedFrequency, "quarterly");
}

{
  const domain = classifyKnowledgeDomain(QUESTION);
  assert.equal(domain.domain, "business");
}

{
  const intent = resolveDirectIntent(QUESTION, []);
  if (isEaGeneralIntentMode()) {
    assert.equal(intent, null, "real EA: model picks searchPlatformSubscriptions");
  } else {
    assert.ok(intent, "expected direct intent");
    assert.equal(intent?.tool, "searchPlatformSubscriptions");
    assert.equal(intent?.args.status, "active");
    assert.equal(intent?.args.expectedMonthlyUsd, 1300);
    assert.equal(intent?.args.expectedQuarterlyUsd, 3900);
    assert.equal(intent?.args.expectedFrequency, "quarterly");
  }
}

{
  const summaryIntent = resolveDirectIntent("summarise the business", []);
  if (isEaGeneralIntentMode()) {
    assert.equal(summaryIntent, null);
  } else {
    assert.equal(summaryIntent?.tool, "queryBusiness");
  }
}

console.log("billing-subscriptions.check.ts: OK");
