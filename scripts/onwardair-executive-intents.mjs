/**
 * OnwardAir Executive Intelligence intent gate.
 * Usage: node --import tsx scripts/onwardair-executive-intents.mjs
 */
import { resolveOnwardAirExecutiveIntelligenceIntent } from "../src/lib/onwardair/executive-intelligence-intent.ts";

/** @type {{ id: string; prompt: string; tool: string }[]} */
const CASES = [
  {
    id: "oa.briefing",
    prompt: "Give me an executive briefing",
    tool: "onwardair.getExecutiveBriefing",
  },
  {
    id: "oa.attention",
    prompt: "What requires my attention today?",
    tool: "onwardair.getExecutiveBriefing",
  },
  {
    id: "oa.health",
    prompt: "Organisation health assessment",
    tool: "onwardair.getOrgHealth",
  },
  {
    id: "oa.fundraising",
    prompt: "Where are we on the seed raise?",
    tool: "onwardair.queryModule",
  },
  {
    id: "oa.engineering",
    prompt: "Which engineering milestones are at risk?",
    tool: "onwardair.queryModule",
  },
  {
    id: "oa.competitors",
    prompt: "Summarise competitor intelligence",
    tool: "onwardair.queryModule",
  },
  {
    id: "oa.board_actions",
    prompt: "Which board actions are overdue?",
    tool: "onwardair.queryActions",
  },
  {
    id: "oa.board_insights",
    prompt: "Board discussion topics for fundraising",
    tool: "onwardair.getBoardInsights",
  },
];

let failed = 0;
for (const c of CASES) {
  const intent = resolveOnwardAirExecutiveIntelligenceIntent(c.prompt);
  if (!intent || intent.tool !== c.tool) {
    failed += 1;
    console.log(`FAIL ${c.id}: tool=${intent?.tool || "none"} (want ${c.tool})`);
  } else {
    console.log(`PASS ${c.id} → ${intent.tool} (${intent.reason})`);
  }
}

if (failed) {
  console.error(`\nOnwardAir intent gate failed: ${failed}/${CASES.length}`);
  process.exit(1);
}
console.log(`\nOnwardAir intent gate passed: ${CASES.length}/${CASES.length}`);
