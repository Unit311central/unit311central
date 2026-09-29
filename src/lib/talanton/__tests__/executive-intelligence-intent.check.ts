/**
 * Talanton EA intent routing — portfolio vs board insights vs training.
 * Run: node --import tsx src/lib/talanton/__tests__/executive-intelligence-intent.check.ts
 */
import assert from "node:assert/strict";

import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";

function expectTool(prompt: string, expected: string) {
  const intent = resolveTalantonExecutiveIntelligenceIntent(prompt);
  assert.ok(intent, `[${prompt}] expected intent, got null`);
  assert.equal(intent!.tool, expected, `[${prompt}] tool mismatch`);
}

function expectNull(prompt: string) {
  assert.equal(resolveTalantonExecutiveIntelligenceIntent(prompt), null, `[${prompt}] expected null`);
}

expectTool("Show me the Talanton portfolio.", "talanton.queryPortfolio");
expectTool("Show me the portfolio", "talanton.queryPortfolio");
expectTool("List the Talanton portfolio companies", "talanton.queryPortfolio");
expectTool("What companies are in the Talanton portfolio?", "talanton.queryPortfolio");
expectTool("Show me all portfolio companies", "talanton.queryPortfolio");
expectTool("Give me the Talanton portfolio", "talanton.queryPortfolio");
expectTool("What requires attention across the portfolio?", "talanton.queryPortfolio");

expectTool("Give me board insights on the portfolio", "talanton.getBoardInsights");
expectTool("Board-level analysis of portfolio governance posture", "talanton.getBoardInsights");

expectTool(
  "Summarise training progress across the Talanton portfolio companies",
  "talanton.queryPortfolio",
);
expectTool("Give me a training summary", "talanton.queryPortfolio");
expectTool("How is training progressing across the portfolio?", "talanton.queryPortfolio");
expectTool("Which portfolio companies have outstanding training?", "talanton.queryPortfolio");
expectTool("Show me training progress across the portfolio", "talanton.queryPortfolio");

expectTool("Give me the Talanton executive briefing.", "talanton.getExecutiveBriefing");

expectNull("Create a board pack for next month");
expectNull("Generate the Field Stories and Lessons PDF.");

console.log("talanton/executive-intelligence-intent.check.ts: all assertions passed");
