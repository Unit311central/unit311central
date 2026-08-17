/**
 * OpenAI cost estimation + EA usage aggregation smoke.
 * Run: npm run prove:ea-openai-usage
 */
import assert from "node:assert/strict";

import { estimateModelCostUsd, formatUsd } from "@/lib/ai-operating-assistant/model-cost";
import { buildEaOpenAiUsageSummary } from "@/lib/platform-analytics/ea-openai-usage";

async function main() {
  const cost = estimateModelCostUsd("gpt-4o-mini", 1_000_000, 500_000);
  assert.ok(cost > 0, "cost should be positive for 1M in / 500k out");
  assert.equal(formatUsd(0), "$0.00");

  const summary = await buildEaOpenAiUsageSummary(
    null,
    new Date().toISOString(),
    "all",
    new Map(),
  );
  assert.equal(summary.apiCalls, 0);
  assert.equal(summary.estimatedCostUsd, 0);
  assert.ok(Array.isArray(summary.byModel));
  assert.ok(Array.isArray(summary.byWorkspace));
  assert.equal(summary.trend.length, 4);

  console.log("prove:ea-openai-usage: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
