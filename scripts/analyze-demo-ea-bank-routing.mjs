/**
 * Routing-only analysis for the 612-question Demo EA bank.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx scripts/analyze-demo-ea-bank-routing.mjs
 */
import { buildNorthstarEaTestBank } from "../src/lib/demo/ea-module-test-bank.ts";
import { resolveOrchestrationRoute } from "../src/lib/ai-operating-assistant/action-orchestration.ts";
import { runEaAcceptanceCase } from "../src/lib/ea-acceptance/execute-case.ts";
import { demoEaTestBusiness } from "../src/lib/demo/ea-comprehensive-test-suite.ts";

function resolveTool(route) {
  if (route.kind === "tool") return route.intent.tool;
  if (route.kind === "evidence_gpt") return "evidence_gpt";
  if (route.kind === "platform_answer") return "platform_answer";
  if (route.kind === "semantic_answer") return route.capabilityId || "semantic_answer";
  if (route.kind === "capability_answer") return "capability_answer";
  return route.kind;
}

async function main() {
  const business = demoEaTestBusiness();
  const bank = buildNorthstarEaTestBank();
  let routePass = 0;
  let routeFail = 0;
  let fullPass = 0;
  let fullFail = 0;
  const routeFailures = [];
  const fullFailures = [];
  const routeCounts = {};

  for (const section of bank) {
    for (const q of section.questions) {
      const route = await resolveOrchestrationRoute(q.prompt, [], business);
      const tool = resolveTool(route);
      routeCounts[tool] = (routeCounts[tool] || 0) + 1;

      const expect =
        q.kind === "navigation"
          ? "platform_answer"
          : q.kind === "pdf" && q.expectTool
            ? q.expectTool
            : q.expectTool ?? "northstar.queryModule";
      if (tool === expect || (q.kind === "navigation" && tool === "searchApplications")) {
        routePass += 1;
      } else {
        routeFail += 1;
        routeFailures.push({
          id: q.id,
          kind: q.kind,
          expect,
          got: tool,
          routeKind: route.kind,
          prompt: q.prompt.slice(0, 90),
        });
      }

      const result = await runEaAcceptanceCase(
        {
          id: q.id,
          prompt: q.prompt,
          kind: q.kind,
          expectTool: q.expectTool,
          moduleLabel: q.moduleLabel,
          subModuleLabel: q.subModuleLabel,
          viewId: q.viewId,
        },
        business,
        { executeTools: false },
      );
      if (result.status === "pass") fullPass += 1;
      else {
        fullFail += 1;
        fullFailures.push({
          id: q.id,
          kind: q.kind,
          error: result.error,
          tool: result.tool,
          routeKind: result.routeKind,
          prompt: q.prompt.slice(0, 70),
        });
      }
    }
  }

  const total = routePass + routeFail;
  console.log(`\n=== ROUTING ONLY (expectTool match) ===`);
  console.log(`${routePass}/${total} (${((100 * routePass) / total).toFixed(1)}%)`);
  console.log(
    "Top routes:",
    Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([k, v]) => `${k}:${v}`)
      .join(", "),
  );

  const byKind = {};
  for (const f of routeFailures) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
  console.log("Route failures by kind:", byKind);

  console.log(`\n=== FULL ACCEPTANCE (executeTools=false) ===`);
  console.log(`${fullPass}/${total} (${((100 * fullPass) / total).toFixed(1)}%)`);

  const fullByKind = {};
  for (const f of fullFailures) fullByKind[f.kind] = (fullByKind[f.kind] || 0) + 1;
  console.log("Full failures by kind:", fullByKind);

  console.log("\nSample route failures (first 20):");
  for (const f of routeFailures.slice(0, 20)) {
    console.log(`  [${f.kind}] ${f.expect} -> ${f.got} | ${f.prompt}`);
  }

  console.log("\nSample full failures (first 20):");
  for (const f of fullFailures.slice(0, 20)) {
    console.log(`  [${f.kind}] ${f.error ?? f.routeKind} | ${f.prompt}`);
  }

  const noneRoutes = [];
  const dataMisroutes = [];
  for (const section of bank) {
    for (const q of section.questions) {
      const route = await resolveOrchestrationRoute(q.prompt, [], business);
      const tool = resolveTool(route);
      if (tool === "none") noneRoutes.push({ kind: q.kind, prompt: q.prompt });
      if (
        q.kind === "data" &&
        q.expectTool === "northstar.queryModule" &&
        tool !== "northstar.queryModule"
      ) {
        dataMisroutes.push({ got: tool, prompt: q.prompt.slice(0, 100) });
      }
    }
  }
  console.log(`\n=== NONE ROUTES (${noneRoutes.length}) ===`);
  for (const q of noneRoutes.slice(0, 20)) console.log(`  [${q.kind}] ${q.prompt.slice(0, 95)}`);
  console.log(`\n=== DATA MISROUTES (${dataMisroutes.length}) ===`);
  for (const q of dataMisroutes) console.log(`  ${q.got} | ${q.prompt}`);

  if (fullFailures.length > 0 && fullFailures.length <= 30) {
    console.log("\n=== ALL FULL FAILURES ===");
    for (const f of fullFailures) {
      console.log(`  [${f.kind}] ${f.id}: ${f.error ?? f.routeKind} | ${f.prompt}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
