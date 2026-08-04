/**
 * ABHI Executive Intelligence — intent + analysis smoke.
 * Run: node --import tsx src/lib/abhi/__tests__/executive-intelligence.check.ts
 */
import assert from "node:assert/strict";
import { resolveAbhiBoardPackIntent } from "../board-pack-intent";
import { resolveAbhiExecutiveIntelligenceIntent } from "../executive-intelligence-intent";
import {
  assessAbhiOrgHealth,
  buildAbhiBoardInsights,
  buildAbhiExecutiveBriefing,
  formatAbhiExecutiveBriefingText,
  queryAbhiActionCentre,
} from "../executive-intelligence";

const ANALYSIS_CASES: Array<{ q: string; tool: string; focusOrQuery?: string }> = [
  { q: "Give me an executive briefing.", tool: "abhi.getExecutiveBriefing" },
  { q: "Organisation health assessment", tool: "abhi.getOrgHealth" },
  { q: "What actions are overdue?", tool: "abhi.queryActions", focusOrQuery: "overdue" },
  { q: "What actions are due this week?", tool: "abhi.queryActions", focusOrQuery: "due_this_week" },
  { q: "Who owns the most actions?", tool: "abhi.queryActions", focusOrQuery: "by_owner" },
  {
    q: "What are the three biggest risks facing ABHI?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "risks",
  },
  {
    q: "What board decisions require attention?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "decisions",
  },
  {
    q: "How is sponsorship performing?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "sponsorship",
  },
  { q: "Are WHX targets at risk?", tool: "abhi.getBoardInsights", focusOrQuery: "whx" },
  {
    q: "Summarise financial performance.",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "financial",
  },
  {
    q: "What should the board discuss next month?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "agenda",
  },
  {
    q: "What issues are deteriorating?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "deteriorating",
  },
  {
    q: "What issues have improved?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "improving",
  },
];

function main() {
  console.log("\n=== ABHI analysis intents (not board pack) ===");
  for (const row of ANALYSIS_CASES) {
    const pack = resolveAbhiBoardPackIntent(row.q);
    assert.equal(pack, null, `must not generate pack for: ${row.q}`);
    const intent = resolveAbhiExecutiveIntelligenceIntent(row.q);
    assert.ok(intent, `expected intelligence intent for: ${row.q}`);
    assert.equal(intent!.tool, row.tool, row.q);
    if (row.focusOrQuery && intent!.tool === "abhi.queryActions") {
      assert.equal(intent!.args.query, row.focusOrQuery, row.q);
    }
    if (row.focusOrQuery && intent!.tool === "abhi.getBoardInsights") {
      assert.equal(intent!.args.focus, row.focusOrQuery, row.q);
    }
    console.log(`ok  ${row.tool.padEnd(28)} ← ${row.q}`);
  }

  console.log("\n=== Board pack only on explicit generate ===");
  const packQ = "Create a board pack for next week's meeting.";
  assert.equal(resolveAbhiExecutiveIntelligenceIntent(packQ), null);
  const packIntent = resolveAbhiBoardPackIntent(packQ);
  assert.ok(packIntent);
  assert.equal(packIntent!.tool, "boardpack.generate");
  console.log(`ok  boardpack.generate ← ${packQ}`);

  const mentionOnly = "Tell me about the board pack numbers.";
  assert.equal(resolveAbhiBoardPackIntent(mentionOnly), null);
  console.log("ok  mention-only board pack does not generate");

  console.log("\n=== Analysis outputs ===");
  const brief = buildAbhiExecutiveBriefing();
  const prose = formatAbhiExecutiveBriefingText(brief);
  assert.match(prose, /Organisation Status/i);
  assert.match(prose, /Financial Summary/i);
  assert.match(prose, /Commercial Summary/i);
  assert.match(prose, /Risks Requiring Attention/i);
  assert.match(prose, /Open Actions/i);
  assert.match(prose, /Strategic Issues/i);
  assert.match(prose, /Recommended Actions/i);
  console.log(`ok  briefing status=${brief.organisationStatus}`);

  const health = assessAbhiOrgHealth();
  assert.ok(["Red", "Amber", "Green"].includes(health.overall));
  assert.equal(health.dimensions.length, 5);
  for (const dim of ["financial", "commercial", "operational", "governance", "overall"]) {
    assert.ok(health.dimensions.some((d) => d.id === dim));
  }
  console.log(`ok  org health overall=${health.overall}`);

  const overdue = queryAbhiActionCentre("overdue");
  assert.ok(overdue.actions.length >= 1, "expected overdue actions from seed");
  console.log(`ok  overdue actions=${overdue.actions.length}`);

  const owners = queryAbhiActionCentre("by_owner");
  assert.ok((owners.ownerLoads?.length ?? 0) >= 1);
  console.log(`ok  top owner=${owners.ownerLoads?.[0]?.owner}`);

  const risks = buildAbhiBoardInsights("risks");
  assert.ok(risks.topRisks.length >= 3);
  console.log(`ok  top risks=${risks.topRisks.length}`);

  console.log("\nAll ABHI executive intelligence checks passed.\n");
}

main();
