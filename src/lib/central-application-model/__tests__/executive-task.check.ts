/**
 * Executive task executor — property-based generalisation tests.
 * Run: npm run prove:ea-executive-task
 */
import assert from "node:assert/strict";

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { adaptExecutiveOrchestrationResult } from "@/lib/ai-operating-assistant/artifact-output";
import { registerAllActionModules } from "@/lib/ai-operating-assistant/actions/register-all-modules";
import { ensureCentralApplicationModel } from "@/lib/central-application-model/registry";
import { classifyExecutiveTask } from "@/lib/central-application-model/executive-task";
import { planInvestigation } from "@/lib/central-application-model/investigation-planner";
import { executeEvidencePlan } from "@/lib/central-application-model/orchestrate";
import { offFocusDomainsMentioned } from "@/lib/central-application-model/materiality";
import { executeEaAcceptanceCase } from "@/lib/ea-acceptance/execute-case";

function business(): AssistantBusinessContext {
  return {
    user: { id: "u1", username: "ceo", displayName: "CEO", userType: "internal" },
    organisation: { id: "org", name: "Northstar" },
    workspace: { id: "ws-demo", name: "Demo", slug: DEMO_WORKSPACE_SLUG },
    page: { activeView: "executive-assistant", label: "EA" },
    selection: {},
    permissions: {
      roleView: "executive",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

function pickVariant(variants: string[]): string {
  return variants[Math.floor(Math.random() * variants.length)];
}

async function run() {
  registerAllActionModules();
  ensureCentralApplicationModel();
  const ctx = business();

  // A. Materiality — financial overview must not dump headcount
  for (const lead of [
    "Walk me through our financial performance this quarter.",
    "Give me the full financial picture for leadership.",
    "How is the company performing financially right now?",
  ]) {
    const plan = planInvestigation(lead, ctx);
    assert.ok(plan, `plan for materiality: ${lead}`);
    assert.ok(!plan.tools.some((t) => t.tool === "searchEmployees"), `headcount tool leaked: ${lead}`);
    const executed = await executeEvidencePlan(plan, { message: lead, business: ctx });
    const leaked = offFocusDomainsMentioned(executed.answer.text, plan.task);
    assert.equal(leaked.includes("headcount"), false, `headcount in answer: ${lead}`);
  }
  console.log("PASS A materiality");

  // B. Comparison — sales vs revenue, no cash/headcount tools
  for (const lead of [
    "Compare our sales performance with revenue and explain any gap.",
    "How does pipeline momentum align with recognised revenue?",
    "Sales versus revenue — what is driving the difference?",
  ]) {
    const task = classifyExecutiveTask(lead);
    assert.equal(task?.job, "compare", lead);
    const plan = planInvestigation(lead, ctx);
    assert.ok(plan);
    const tools = plan.tools.map((t) => t.tool);
    assert.ok(tools.includes("searchCRM"), lead);
    assert.ok(tools.some((t) => t === "getFinancialChartData"), lead);
    assert.equal(tools.includes("getCashPosition"), false, lead);
    assert.equal(tools.includes("searchEmployees"), false, lead);
    assert.equal(tools.includes("getBusinessHealth"), false, lead);
    const executed = await executeEvidencePlan(plan, { message: lead, business: ctx });
    assert.match(executed.answer.text, /pipeline|sales/i);
    assert.match(executed.answer.text, /revenue/i);
    assert.doesNotMatch(executed.answer.text, /\bheadcount\b/i);
  }
  console.log("PASS B comparison");

  // C. Visualisation
  const chartLead = pickVariant([
    "Plot revenue, cash and headcount together for the past year.",
    "Chart monthly revenue, cash position and headcount over twelve months.",
    "Visualise revenue, cash and workforce size on one timeline.",
  ]);
  const chartPlan = planInvestigation(chartLead, ctx);
  assert.equal(chartPlan?.task.job, "visualise");
  const chartExecuted = await executeEvidencePlan(chartPlan!, { message: chartLead, business: ctx });
  assert.ok(chartExecuted.answer.blocks?.some((b) => /chart/.test(b.type)), chartLead);
  console.log("PASS C visualisation");

  // D. Scoped PDF
  const scopedLead = pickVariant([
    "Create a financial PDF containing revenue, expenses, cash and AR.",
    "Generate a PDF with revenue, expenses, cash and accounts receivable.",
    "Prepare a PDF covering revenue, expenses, cash and AR.",
  ]);
  const scopedTask = classifyExecutiveTask(scopedLead);
  assert.equal(scopedTask?.job, "report");
  assert.equal(scopedTask?.outputContract.kind, "scoped_pdf");
  const scopedPlan = planInvestigation(scopedLead, ctx);
  assert.equal(scopedPlan?.synthesisKind, "scoped_pdf");
  const scopedExecuted = await executeEvidencePlan(scopedPlan!, { message: scopedLead, business: ctx });
  assert.equal(scopedExecuted.capabilityId, "reports.scopedPdf.generate");
  assert.match(scopedExecuted.answer.text, /Included:/i);
  assert.doesNotMatch(scopedExecuted.answer.text, /Board Analytical Report/i);
  console.log("PASS D scoped PDF");

  // E. Board PDF
  const boardLead = pickVariant([
    "Create a PDF for the board with findings, risks, evidence and recommended actions.",
    "Generate an executive board report covering findings, risks and management recommendations.",
  ]);
  const boardTask = classifyExecutiveTask(boardLead);
  assert.equal(boardTask?.outputContract.kind, "analytical_pdf");
  const boardPlan = planInvestigation(boardLead, ctx);
  assert.equal(boardPlan?.synthesisKind, "board_report");
  const boardExecuted = await executeEvidencePlan(boardPlan!, { message: boardLead, business: ctx });
  const adaptedBoard = adaptExecutiveOrchestrationResult(boardExecuted);
  assert.ok(adaptedBoard.artifactIds.length > 0, "board artifact id");
  console.log("PASS E board PDF");

  // F. Artifact ids on PDF-producing paths
  assert.ok(adaptedBoard.artifacts[0]?.downloadUrl?.includes("/api/executive-assistant/artifacts/"));
  assert.ok(adaptedBoard.artifacts[0]?.openUrl?.includes("disposition=inline"));
  console.log("PASS F artifact");

  // G. Runtime parity — acceptance vs orchestration plan
  const parityLead = "Compare sales pipeline with revenue this quarter.";
  const route = await resolveOrchestrationRoute(parityLead, [], ctx);
  assert.equal(route.kind, "evidence_gpt");
  const acceptance = await executeEaAcceptanceCase(
    { id: "parity", prompt: parityLead, kind: "composite" },
    ctx,
    { executeTools: true },
  );
  assert.equal(acceptance.evidencePlan?.task.job, "compare");
  assert.ok(acceptance.artifactIds === undefined || Array.isArray(acceptance.artifactIds));
  assert.equal(acceptance.routeKind, "evidence_gpt");
  console.log("PASS G runtime parity");

  // H. Generalisation variants
  const variant = pickVariant([
    "Reconcile bookings growth with thinner margins in the P&L.",
    "Does our open pipeline justify the revenue forecast?",
    "Leadership briefing: what should worry us about liquidity and pipeline?",
  ]);
  const variantTask = classifyExecutiveTask(variant);
  assert.ok(variantTask, variant);
  assert.notEqual(variantTask?.job, "lookup");
  console.log("PASS H generalisation");

  console.log("\nALL EXECUTIVE TASK TESTS PASSED");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
