/**
 * EA LLM synthesis — routing, eligibility, and payload smoke tests.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/ea-llm-synthesis.check.ts
 */
import assert from "node:assert/strict";

import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import {
  buildExecutiveSynthesisDeveloperMessage,
  shouldSynthesizeExecutiveToolResult,
  toolResultPayloadForSynthesis,
} from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { queryOnwardAirModule } from "@/lib/onwardair/executive-intelligence";
import { queryTalantonStories } from "@/lib/talanton/executive-stories-intelligence";

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

function onwardAirBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-oa-test",
      username: "demo@onwardair.com",
      displayName: "OnwardAir Demo",
      userType: "operator",
    },
    organisation: { id: "org-oa", name: "OnwardAir" },
    workspace: { id: "ws-oa", name: "OnwardAir", slug: "onwardair" },
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

const STORIES_CASES = [
  {
    id: "talanton-stories-demo",
    prompt:
      "Review the field stories and identify the three most important lessons or recurring themes that management should be aware of.",
    variation:
      "Review our field stories and tell me the three biggest lessons management should take away.",
  },
];

const ENGINEERING_CASES = [
  {
    id: "oa-engineering-demo",
    prompt:
      "Give me an executive summary of the key engineering issues, risks and priorities currently affecting the business.",
    variation:
      "What are the biggest engineering issues and risks management needs to know about?",
  },
];

const FUNDRAISING_CASES = [
  {
    id: "oa-fundraising-demo",
    prompt:
      "Give me an executive summary of the key fundraising issues, risks and priorities currently affecting the business.",
    variation:
      "What should management be most concerned about with the current fundraising?",
  },
];

async function assertStoriesRoute(prompt: string) {
  const route = await resolveOrchestrationRoute(prompt, [], talantonBusiness());
  assert.equal(route.kind, "tool");
  if (route.kind !== "tool") return;
  assert.equal(route.intent.tool, "talanton.queryStories");
}

async function assertOnwardAirModuleRoute(prompt: string, module: string) {
  const route = await resolveOrchestrationRoute(prompt, [], onwardAirBusiness());
  assert.equal(route.kind, "tool");
  if (route.kind !== "tool") return;
  assert.equal(route.intent.tool, "onwardair.queryModule");
  assert.equal(route.intent.args.module, module);
}

async function main() {
  console.log("EA LLM synthesis checks\n");

  // --- Talanton field stories ---
  for (const testCase of STORIES_CASES) {
    for (const prompt of [testCase.prompt, testCase.variation]) {
      await assertStoriesRoute(prompt);

      const route = await resolveOrchestrationRoute(prompt, [], talantonBusiness());
      assert.equal(route.kind, "tool");
      if (route.kind !== "tool") continue;

      const result = await executeAssistantTool(
        route.intent.tool,
        route.intent.args ?? {},
        talantonBusiness(),
      );
      assert.equal(String((result as { status?: string }).status), "ok");

      const items = (result as { items?: unknown[] }).items ?? [];
      assert.ok(items.length > 0, "stories tool must return items");

      const synthesisCtx = {
        workspaceSlug: "talantonimpact",
        toolName: "talanton.queryStories",
        toolArgs: route.intent.args ?? {},
        userMessage: prompt,
        toolResult: result,
      };
      assert.equal(shouldSynthesizeExecutiveToolResult(synthesisCtx), true);

      const developerMsg = buildExecutiveSynthesisDeveloperMessage(synthesisCtx);
      assert.match(developerMsg, /talanton\.queryStories/);
      assert.match(developerMsg, /themes|lessons/i);
      assert.doesNotMatch(developerMsg, /Review the field stories and identify the three/);

      const payload = toolResultPayloadForSynthesis(result);
      assert.match(payload, /"rows"/);
      assert.ok(payload.includes('"title"'), "synthesis payload must include story records");

      console.log(`PASS ${testCase.id}: ${prompt.slice(0, 60)}…`);
    }
  }

  // --- OnwardAir engineering ---
  for (const testCase of ENGINEERING_CASES) {
    for (const prompt of [testCase.prompt, testCase.variation]) {
      await assertOnwardAirModuleRoute(prompt, "engineering");

      const route = await resolveOrchestrationRoute(prompt, [], onwardAirBusiness());
      if (route.kind !== "tool") continue;

      const result = await executeAssistantTool(
        route.intent.tool,
        route.intent.args ?? {},
        onwardAirBusiness(),
      );
      assert.equal(String((result as { status?: string }).status), "ok");

      const synthesisCtx = {
        workspaceSlug: "onwardair",
        toolName: "onwardair.queryModule",
        toolArgs: route.intent.args ?? {},
        userMessage: prompt,
        toolResult: result,
      };
      assert.equal(shouldSynthesizeExecutiveToolResult(synthesisCtx), true);

      const developerMsg = buildExecutiveSynthesisDeveloperMessage(synthesisCtx);
      assert.match(developerMsg, /Key issues/i);
      assert.match(developerMsg, /Key risks/i);
      assert.match(developerMsg, /Key priorities/i);

      const moduleResult = queryOnwardAirModule("engineering");
      assert.ok(moduleResult.records?.programs, "engineering records must include programmes");
      assert.ok(moduleResult.records?.risks, "engineering records must include risks");

      console.log(`PASS ${testCase.id}: ${prompt.slice(0, 60)}…`);
    }
  }

  // --- OnwardAir fundraising ---
  for (const testCase of FUNDRAISING_CASES) {
    for (const prompt of [testCase.prompt, testCase.variation]) {
      await assertOnwardAirModuleRoute(prompt, "fundraising");

      const route = await resolveOrchestrationRoute(prompt, [], onwardAirBusiness());
      if (route.kind !== "tool") continue;

      const result = await executeAssistantTool(
        route.intent.tool,
        route.intent.args ?? {},
        onwardAirBusiness(),
      );
      assert.equal(String((result as { status?: string }).status), "ok");

      const synthesisCtx = {
        workspaceSlug: "onwardair",
        toolName: "onwardair.queryModule",
        toolArgs: route.intent.args ?? {},
        userMessage: prompt,
        toolResult: result,
      };
      assert.equal(shouldSynthesizeExecutiveToolResult(synthesisCtx), true);

      const developerMsg = buildExecutiveSynthesisDeveloperMessage(synthesisCtx);
      assert.match(developerMsg, /Current fundraising position/i);
      assert.match(developerMsg, /Management priorities/i);

      const moduleResult = queryOnwardAirModule("fundraising");
      assert.ok(moduleResult.records?.deals, "fundraising records must include deals");

      console.log(`PASS ${testCase.id}: ${prompt.slice(0, 60)}…`);
    }
  }

  // --- Non-synthesis controls (preserve existing behaviour) ---
  assert.equal(
    shouldSynthesizeExecutiveToolResult({
      workspaceSlug: "onwardair",
      toolName: "onwardair.queryModule",
      toolArgs: { module: "operations" },
      userMessage: "What is our operations status?",
      toolResult: { status: "ok" },
    }),
    false,
    "operations module must not trigger synthesis",
  );
  assert.equal(
    shouldSynthesizeExecutiveToolResult({
      workspaceSlug: "onwardair",
      toolName: "onwardair.queryModule",
      toolArgs: { module: "board" },
      userMessage: "What is on the board agenda?",
      toolResult: { status: "ok" },
    }),
    false,
    "board module must not trigger synthesis",
  );

  const storiesData = queryTalantonStories({
    companyIds: "all",
    storyTypes: "both",
    statusFilter: "include_review",
    categories: "all",
    outputFormat: "narrative",
  });
  assert.ok(storiesData.rows.length > 0, "fixture stories must exist for synthesis");

  console.log("\nAll EA LLM synthesis checks passed (6 prompts + controls).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
