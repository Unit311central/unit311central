import { resolveOrchestrationRoute } from "../src/lib/ai-operating-assistant/action-orchestration.ts";
import { resolveNorthstarEaDataRoute } from "../src/lib/demo/northstar-ea-route-resolver.ts";
import { preferDemoModuleSpineOverSemantic } from "../src/lib/demo/demo-ea-orchestration.ts";
import { demoEaTestBusiness } from "../src/lib/demo/ea-comprehensive-test-suite.ts";

const business = demoEaTestBusiness();
const prompts = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "What data is on the Targets & Forecast screen?",
      "Show me risks in Board.",
      "Where is Sales Management in the sidebar?",
      "What applications are under Business Central?",
      "Give me company intelligence briefing.",
      "Create a new client called Acme Corp.",
      "How are sales doing?",
      "Summarise Document Control in Quality Management.",
    ];

for (const p of prompts) {
  const spine = resolveNorthstarEaDataRoute(p);
  const defer = preferDemoModuleSpineOverSemantic(p, "demo");
  const route = await resolveOrchestrationRoute(p, [], business);
  const tool = route.kind === "tool" ? route.intent.tool : route.kind;
  console.log("---");
  console.log(p);
  console.log(`  deferSpine: ${defer} spine: ${spine?.tool ?? "null"} route: ${tool} (${route.kind})`);
}
