/**
 * Talanton EA routing regressions — orchestration must select Talanton tools, not evidence_gpt / scoped PDF.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx src/lib/talanton/__tests__/ea-routing-regression.check.ts
 */

import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import {
  TALANTON_FIELD_STORIES_LESSONS_PDF_PROMPT,
} from "@/lib/talanton/ea-test-suite";

process.env.TALANTON_EA_SUITE = "1";

function talantonBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-test",
      username: "harry@talantonimpact.com",
      displayName: "Harry Turner",
      userType: "operator",
    },
    organisation: { id: "org-ti", name: "Talanton Impact" },
    workspace: { id: "ws-ti", name: "Talanton Impact", slug: "talantonimpact" },
    page: { activeView: "executive-assistant", label: "Executive Assistant" },
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

async function assertToolRoute(prompt: string, expectedTool: string) {
  const route = await resolveOrchestrationRoute(prompt, [], talantonBusiness());
  if (route.kind !== "tool") {
    throw new Error(`[${prompt}] expected tool route, got ${route.kind}`);
  }
  if (route.intent.tool !== expectedTool) {
    throw new Error(`[${prompt}] expected ${expectedTool}, got ${route.intent.tool}`);
  }
}

async function main() {
  await assertToolRoute("Talanton executive briefing", "talanton.getExecutiveBriefing");
  await assertToolRoute("Give me an executive briefing", "talanton.getExecutiveBriefing");

  await assertToolRoute(
    "What requires attention across the portfolio?",
    "talanton.queryPortfolio",
  );
  await assertToolRoute("Show me the Talanton portfolio.", "talanton.queryPortfolio");
  await assertToolRoute(
    "What companies are in the Talanton portfolio?",
    "talanton.queryPortfolio",
  );
  await assertToolRoute(
    "Give me board insights on the portfolio",
    "talanton.getBoardInsights",
  );
  await assertToolRoute(
    "Summarise training progress across the Talanton portfolio companies",
    "talanton.queryPortfolio",
  );
  await assertToolRoute("Create a board pack for next month", "boardpack.generate");

  const portfolioRoute = await resolveOrchestrationRoute(
    "What requires attention across the portfolio?",
    [],
    talantonBusiness(),
  );
  if (portfolioRoute.kind !== "tool" || portfolioRoute.intent.tool !== "talanton.queryPortfolio") {
    throw new Error("portfolio routing regression failed");
  }
  const portfolioResult = (await executeAssistantTool(
    portfolioRoute.intent.tool,
    portfolioRoute.intent.args ?? {},
    talantonBusiness(),
  )) as AssistantToolResult;
  if (portfolioResult.status !== "ok" && portfolioResult.status !== "partial") {
    throw new Error(
      `talanton.queryPortfolio execution failed: ${portfolioResult.status} ${portfolioResult.error ?? ""}`,
    );
  }
  const items = portfolioResult.items ?? [];
  if (!items.length) {
    throw new Error("talanton.queryPortfolio returned no items");
  }

  await assertToolRoute(
    "field stories lessons PDF",
    "talanton.generateStoriesLessonsPdf",
  );
  await assertToolRoute(
    TALANTON_FIELD_STORIES_LESSONS_PDF_PROMPT,
    "talanton.generateStoriesLessonsPdf",
  );

  console.log("talanton/ea-routing-regression.check.ts: all assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
