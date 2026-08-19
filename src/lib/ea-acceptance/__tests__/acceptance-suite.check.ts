/**
 * Run: npm run prove:ea-acceptance
 */
import assert from "node:assert/strict";

import {
  acceptanceChecksPassed,
  hasSubstantiveDataSignal,
  isGenericCatalogueAnswer,
  promptExpectsChart,
  runEaAcceptanceAssertions,
} from "@/lib/ea-acceptance/assertions";

function testAssertionLogic() {
  const genericFail = runEaAcceptanceAssertions({
    prompt: "What is our bank balance?",
    kind: "data",
    routeKind: "platform_answer",
    text: "Financials gives you visibility into your company's financial position.",
  });
  assert.equal(acceptanceChecksPassed(genericFail), false);
  assert.ok(isGenericCatalogueAnswer("Financials gives you visibility into your company's financial position."));

  const bankPass = runEaAcceptanceAssertions({
    prompt: "What is our bank balance?",
    kind: "data",
    routeKind: "semantic_answer",
    capabilityId: "financials.cashPosition.read",
    deterministic: true,
    text: "Your current bank balance is £1,245,000.",
    responseBlocks: [{ type: "kpi", label: "Bank balance", value: "£1,245,000" }],
  });
  assert.equal(acceptanceChecksPassed(bankPass), true);

  const pdfFail = runEaAcceptanceAssertions({
    prompt: "Create a PDF with P&L highlights",
    kind: "pdf",
    routeKind: "tool",
    tool: "generateScopedBusinessPdf",
    text: "Custom Business Report.pdf\n\nIncluded: none. No live source registered for: p&l.",
    toolResult: {
      tool: "generateScopedBusinessPdf",
      status: "ok",
      source: [],
      total: 0,
      page: 1,
      pageSize: 1,
      items: [],
      summary: {
        message: "Custom Business Report.pdf\n\nIncluded: none. No live source registered for: p&l.",
        byteLength: 900,
        metrics: [],
      },
    } as import("@/lib/ai-operating-assistant/tool-result").AssistantToolResult,
    artifactByteLength: 900,
  });
  assert.equal(acceptanceChecksPassed(pdfFail), false);

  const chartFail = runEaAcceptanceAssertions({
    prompt: "Show me employee growth as a chart",
    kind: "chart",
    routeKind: "semantic_answer",
    text: "Employee numbers have increased.",
  });
  assert.equal(acceptanceChecksPassed(chartFail), false);
  assert.ok(promptExpectsChart("Show me employee growth as a chart"));

  const chartPass = runEaAcceptanceAssertions({
    prompt: "Show me employee growth as a chart",
    kind: "chart",
    routeKind: "semantic_answer",
    text: "Employee growth by year",
    responseBlocks: [
      {
        type: "line_chart",
        title: "Employee growth",
        labels: ["2022", "2023", "2024"],
        datasets: [{ label: "Employees", data: [18, 20, 25] }],
      },
    ],
  });
  assert.equal(acceptanceChecksPassed(chartPass), true);

  assert.ok(
    hasSubstantiveDataSignal("You have 25 employees in your workspace.", "How many employees do we have?"),
  );
  assert.ok(!hasSubstantiveDataSignal("Human Resources is where you manage people.", "How many employees do we have?"));
}

async function main() {
  testAssertionLogic();
  const { runEaAcceptanceSuite } = await import("@/lib/ea-acceptance/run-suite");
  const live = process.env.EA_ACCEPTANCE_LIVE === "1";
  console.log(
    live
      ? "Running EA acceptance with live tool execution (EA_ACCEPTANCE_LIVE=1)."
      : "Running EA routing acceptance (set EA_ACCEPTANCE_LIVE=1 for full live tool execution).",
  );
  const report = await runEaAcceptanceSuite({ executeTools: live });
  for (const workspace of report.workspaces) {
    console.log(`\n=== ${workspace.slug} ===`);
    for (const row of workspace.cases) {
      const mark = row.status === "pass" ? "ok " : "FAIL";
      console.log(`${mark}  ${row.prompt}`);
      if (row.status === "fail") {
        console.error(`     ${row.error ?? "assertion failed"}`);
        for (const check of row.checks.filter((c) => !c.passed)) {
          console.error(`       - ${check.id}: ${check.message}`);
        }
      }
    }
  }
  console.log(
    `\n${report.ok ? "All" : "Some"} EA acceptance checks ${report.ok ? "passed" : "failed"} (${report.passed}/${report.total}, ${report.durationMs}ms, ${report.version}).\n`,
  );
  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
