/**
 * Demo EA Phase 2 — live tool execution + answer quality acceptance.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx scripts/demo-ea-phase2-e2e.mjs
 */
import { writeFileSync } from "node:fs";

import { resolveOrchestrationRoute } from "../src/lib/ai-operating-assistant/action-orchestration.ts";
import { executeEaAcceptanceCase } from "../src/lib/ea-acceptance/execute-case.ts";
import { resolveBusinessActionIntent } from "../src/lib/ai-operating-assistant/intent-action-resolver.ts";
import { executeRegisteredActionNow } from "../src/lib/ai-operating-assistant/actions/instant-execute.ts";
import { getNorthstarClients } from "../src/lib/demo/module-fixtures.ts";
import { buildNorthstarSalesEaSnapshot } from "../src/lib/demo/northstar-sales-ea-data.ts";
import { demoEaTestBusiness } from "../src/lib/demo/ea-comprehensive-test-suite.ts";

const business = demoEaTestBusiness();

function modulesFromExecution(ex) {
  const mods = new Set();
  if (ex.route?.kind === "tool" && ex.route.intent?.args?.module) {
    mods.add(String(ex.route.intent.args.module));
  }
  if (ex.evidencePlan?.tools) {
    for (const t of ex.evidencePlan.tools) {
      if (t.args?.module) mods.add(String(t.args.module));
    }
  }
  if (ex.capabilityId) mods.add(ex.capabilityId);
  return [...mods];
}

function toolsFromExecution(ex) {
  const tools = [];
  if (ex.tool) tools.push(ex.tool);
  if (ex.evidencePlan?.tools) tools.push(...ex.evidencePlan.tools.map((t) => t.tool));
  return [...new Set(tools)];
}

function scoreAnswer(text, checks = {}) {
  const t = String(text ?? "").trim();
  if (!t) return { verdict: "FAIL", reason: "Empty answer" };
  if (/waiting for live business data|i don'?t have data|cannot answer|not connected|no live source/i.test(t)) {
    return { verdict: "FAIL", reason: "Dead-end / not connected" };
  }
  if (checks.requireNumbers && !/[£$€]|\b\d{1,3}(?:,\d{3})+|\b\d+\b/.test(t)) {
    return { verdict: "PARTIAL", reason: "No numeric evidence in answer" };
  }
  if (checks.requireSubstance && t.length < 120) {
    return { verdict: "PARTIAL", reason: "Answer too thin for executive question" };
  }
  if (checks.requireRecommendation && !/recommend|should|prioriti[sz]|escalat|focus|next step|attention|concern/i.test(t)) {
    return { verdict: "PARTIAL", reason: "Missing management recommendation language" };
  }
  if (checks.requireChart && !(exBlocks(checks.blocks)?.length)) {
    return { verdict: "FAIL", reason: "No chart block" };
  }
  if (checks.requirePdfBytes && (checks.pdfBytes ?? 0) < 1500) {
    return { verdict: "FAIL", reason: `PDF too small (${checks.pdfBytes ?? 0} bytes)` };
  }
  if (checks.requireHonestGap && !/cannot find|don'?t have|not available|no record|unable to find|insufficient/i.test(t)) {
    return { verdict: "FAIL", reason: "Did not honestly report missing data" };
  }
  return { verdict: "PASS", reason: "Substantive answer with expected signals" };
}

function exBlocks(blocks) {
  return (blocks ?? []).filter((b) => /chart|table|kpi/.test(b.type));
}

async function runQuestion(id, prompt, kind, checks = {}) {
  const execution = await executeEaAcceptanceCase(
    { id, prompt, kind },
    business,
    { executeTools: true },
  );
  const text = String(execution.text ?? "");
  const scored = scoreAnswer(text, {
    ...checks,
    blocks: execution.responseBlocks,
    pdfBytes: execution.artifactByteLength,
  });
  return {
    id,
    question: prompt,
    routingPath: `${execution.routeKind}${execution.tool ? ` → ${execution.tool}` : ""}${execution.capabilityId ? ` (${execution.capabilityId})` : ""}`,
    modulesUsed: modulesFromExecution(execution),
    toolsUsed: toolsFromExecution(execution),
    dataUsed: execution.evidencePlan?.tools?.map((t) => t.tool).join(", ") || execution.tool || "—",
    actualActions: execution.routeKind === "capability_answer" ? "action/capability message" : execution.tool || execution.routeKind,
    actualAnswer: text.slice(0, 1200),
    expectedResult: checks.expected ?? "Useful grounded executive answer",
    verdict: scored.verdict,
    reason: scored.reason,
    artifactByteLength: execution.artifactByteLength,
    responseBlocks: execution.responseBlocks,
    routeKind: execution.routeKind,
    error: execution.error,
    checks: execution.checks,
  };
}

async function runConversation() {
  const turns = [
    "How are sales doing?",
    "Who is behind target?",
    "What about their pipeline?",
    "Which one should I be most concerned about?",
    "Tell me more about that one.",
    "What should we do?",
  ];
  const history = [];
  const results = [];
  for (const prompt of turns) {
    const route = await resolveOrchestrationRoute(prompt, history, business);
    const execution = await executeEaAcceptanceCase({ id: `conv-${results.length}`, prompt, kind: "data" }, business, {
      executeTools: true,
    });
    history.push({ role: "user", content: prompt, id: `u${results.length}`, createdAt: new Date().toISOString() });
    history.push({
      role: "assistant",
      content: execution.text || execution.error || "",
      id: `a${results.length}`,
      createdAt: new Date().toISOString(),
    });
    const text = String(execution.text ?? "");
    const refersBack =
      results.length > 0 &&
      /\b(them|their|that one|this rep|pipeline|behind|concern|recommend|should|alex|priya|chris|morgan|shah|okafor)\b/i.test(
        text,
      );
    results.push({
      question: prompt,
      routingPath: `${execution.routeKind} → ${execution.tool ?? execution.capabilityId ?? "none"}`,
      actualAnswer: (text || execution.error || "").slice(0, 600),
      verdict: text.length > 40 ? (refersBack || results.length === 0 ? "PASS" : "PARTIAL") : "FAIL",
      reason: refersBack || results.length === 0 ? "Answer produced" : "Weak contextual continuity",
    });
  }
  return results;
}

async function runActions() {
  const steps = [
    { prompt: "Create a new client called Acme Corp.", actionId: "clients.createClient" },
    { prompt: "Change Acme Corp's account manager to John.", actionId: "clients.assignAccountManager" },
    { prompt: "Archive Acme Corp.", actionId: "clients.archiveClient" },
    { prompt: "Restore Acme Corp.", actionId: "clients.restoreClient" },
  ];
  const out = [];
  for (const step of steps) {
    const intent = await resolveBusinessActionIntent(step.prompt, business, []);
    let exec = null;
    let stateNote = "";
    if (intent.kind === "propose") {
      try {
        exec = await executeRegisteredActionNow({
          actionId: intent.actionId,
          actionInput: intent.input,
          business,
        });
      } catch (e) {
        stateNote = e instanceof Error ? e.message : String(e);
      }
    }
    out.push({
      question: step.prompt,
      routingPath: intent.kind === "propose" ? `Action Framework → ${intent.actionId}` : intent.kind,
      actualActions: exec?.message ?? intent.question ?? intent.reason,
      verdict:
        intent.kind === "propose" && exec?.ok
          ? "PASS"
          : /Supabase is not configured|not configured/i.test(stateNote)
            ? "BLOCKED"
            : intent.kind === "propose"
              ? "PARTIAL"
              : "FAIL",
      reason: stateNote || exec?.message || intent.reason,
    });
  }
  return out;
}

const EXECUTIVE = [
  ["fin-review", "Review our financial performance over the last six months. Tell me what has changed, what is driving the changes, and whether there is anything management should be concerned about.", { requireSubstance: true, requireNumbers: true, requireRecommendation: true }],
  ["sales-review", "Give me an executive sales review. Are we on track to hit target, which opportunities matter most, who is behind target, and what should management do?", { requireSubstance: true, requireNumbers: true, requireRecommendation: true }],
  ["projects-risk", "Review our projects and tell me which ones are most at risk, why, what the business impact could be, and what needs escalation.", { requireSubstance: true, requireRecommendation: true }],
  ["workforce-review", "Review our workforce and tell me whether there are any staffing, training, capacity or performance issues management should know about.", { requireSubstance: true, requireRecommendation: true }],
  ["top-risks", "What are the five biggest risks to the business right now?", { requireSubstance: true, requireRecommendation: true }],
  ["material-change", "What has materially changed in the business over the last six months?", { requireSubstance: true }],
  ["worried", "What should I be worried about?", { requireSubstance: true, requireRecommendation: true }],
  ["prioritise", "What should I prioritise this week?", { requireSubstance: true, requireRecommendation: true }],
  ["board-prep", "Prepare me for tomorrow's board meeting.", { requireSubstance: true, requireRecommendation: true }],
];

const CROSS = [
  ["x-forecast", "Which sales opportunities are important enough to affect our forecast?"],
  ["x-clients-issues", "Which clients have both significant commercial value and unresolved issues?"],
  ["x-project-fin", "Which projects are at risk and what financial impact could they have?"],
  ["x-emp-proj", "Which employees are working on projects that are behind schedule?"],
  ["x-risk-impact", "Which risks have the greatest potential business impact?"],
  ["x-attention", "Give me a management summary of anything that needs my attention."],
];

const FINANCIAL = [
  ["pl-6m", "Give me the P&L for the last six months and explain the trend.", { requireNumbers: true, requireSubstance: true }],
  ["compare-6m", "Compare the last six months with the previous six months.", { requireNumbers: true, requireSubstance: true }],
  ["profit-driver", "What is driving the change in profitability?", { requireSubstance: true }],
  ["expense-fast", "Which expense categories are increasing fastest?", { requireNumbers: true }],
  ["fin-concerns", "What financial issues should management be concerned about?", { requireRecommendation: true, requireSubstance: true }],
];

const CHARTS = [
  ["chart-revenue", "Graph revenue for the last six months.", { kind: "chart", requireChart: true }],
  ["chart-rev-exp", "Show revenue versus expenses.", { kind: "chart", requireChart: true }],
  ["chart-pie-exp", "Give me a pie chart of expenses.", { kind: "chart", requireChart: true }],
  ["chart-target", "Show actual versus target.", { kind: "chart", requireChart: true }],
  ["chart-sales", "Graph sales performance.", { kind: "chart", requireChart: true }],
];

const NL_QUALITY = [
  ["nl-doing", "How are we doing?", { kind: "clarification" }],
  ["nl-sales", "What's going on with sales?"],
  ["nl-anything", "Anything I should know?", { requireSubstance: true }],
  ["nl-worry", "What's worrying you?", { requireSubstance: true }],
  ["nl-board", "prep me for the board"],
  ["nl-pl", "p&l last 6 months", { requireNumbers: true }],
  ["nl-opps", "any big sales opps?"],
];

const HALLUCINATION = [
  ["hall-fake", "What is our revenue from the Antarctica division last quarter?", { requireHonestGap: true }],
  ["hall-fake2", "Who is our CEO in Tokyo?", { requireHonestGap: true }],
];

const GPT_TERRA = [
  ["gpt-why", "Why might declining sales create a business risk if we also have strong pipeline coverage?", { requireSubstance: true }],
  ["gpt-strategy", "If margin falls while headcount rises, what strategic trade-offs should management consider?", { requireSubstance: true }],
];

async function main() {
  const report = { generatedAt: new Date().toISOString(), branch: "local-restored", sections: {} };

  report.sections.executive = [];
  for (const [id, prompt, checks] of EXECUTIVE) {
    report.sections.executive.push(await runQuestion(id, prompt, "composite", checks));
  }

  report.sections.crossModule = [];
  for (const [id, prompt] of CROSS) {
    report.sections.crossModule.push(
      await runQuestion(id, prompt, "composite", { requireSubstance: true, requireRecommendation: true }),
    );
  }

  report.sections.financial = [];
  for (const row of FINANCIAL) {
    const [id, prompt, checks = {}] = row;
    report.sections.financial.push(await runQuestion(id, prompt, "data", checks));
  }

  report.sections.charts = [];
  for (const row of CHARTS) {
    const [id, prompt, opts = {}] = row;
    report.sections.charts.push(await runQuestion(id, prompt, opts.kind ?? "chart", opts));
  }

  report.sections.boardDeck = [
    await runQuestion(
      "board-deck",
      "Create a board deck for tomorrow as a PDF.",
      "pdf",
      { requirePdfBytes: true, requireSubstance: true, expected: "Board pack PDF artifact with live sections" },
    ),
  ];

  report.sections.actions = await runActions();
  report.sections.conversation = await runConversation();
  report.sections.nlQuality = [];
  for (const row of NL_QUALITY) {
    const [id, prompt, opts = {}] = row;
    report.sections.nlQuality.push(await runQuestion(id, prompt, opts.kind ?? "data", opts));
  }
  report.sections.hallucination = [];
  for (const row of HALLUCINATION) {
    const [id, prompt, opts] = row;
    report.sections.hallucination.push(await runQuestion(id, prompt, "data", opts));
  }
  report.sections.gptTerra = [];
  for (const row of GPT_TERRA) {
    const [id, prompt, opts] = row;
    report.sections.gptTerra.push(await runQuestion(id, prompt, "composite", opts));
  }

  // Ground-truth sanity for sales
  const snap = buildNorthstarSalesEaSnapshot();
  report.groundTruth = {
    salesPipelineValue: snap.metrics.pipelineValue,
    salesOpenOpportunities: snap.metrics.openOpportunityCount,
    clientFixtureCount: getNorthstarClients().length,
  };

  writeFileSync("/opt/cursor/artifacts/demo-ea-phase2-e2e-report.json", JSON.stringify(report, null, 2));

  const all = Object.values(report.sections).flat();
  const counts = { PASS: 0, PARTIAL: 0, FAIL: 0, BLOCKED: 0 };
  for (const row of all) counts[row.verdict] = (counts[row.verdict] ?? 0) + 1;
  console.log(JSON.stringify({ counts, groundTruth: report.groundTruth }, null, 2));
  for (const section of Object.entries(report.sections)) {
    console.log(`\n## ${section[0]}`);
    for (const r of section[1]) {
      console.log(`${r.verdict?.padEnd(8)} ${r.question?.slice(0, 70)}`);
      console.log(`         route: ${r.routingPath ?? ""}`);
      if (r.verdict !== "PASS") console.log(`         reason: ${r.reason ?? r.error ?? ""}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
