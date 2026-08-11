/**
 * OnwardAir Executive Assistant — structured test suite.
 * Run: npm run prove:onwardair-ea
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { buildWorkspaceNlSuite } from "@/lib/ai-operating-assistant/ea-workspace-nl-cases";
import { assertWorkspaceNlCase } from "@/lib/ai-operating-assistant/ea-workspace-nl-assert";
import {
  runEaToolExecutionSmoke,
  type EaToolSmokeCase,
} from "@/lib/ai-operating-assistant/ea-tool-execution-smoke";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { buildOnwardAirBoardPackData } from "@/lib/onwardair/board-pack-model";
import { ONWARDAIR_CASH_BALANCE_USD } from "@/lib/onwardair-financials";
import {
  getCompetitorIntelCadence,
  getIsoWeekKey,
  listCompetitorIntelFeed,
} from "@/lib/onwardair/competitor-intelligence-feed-store";
import { queryOnwardAirModule } from "@/lib/onwardair/executive-intelligence";

export type EaTestStatus = "pass" | "fail";
export type EaTestCaseResult = {
  id: string;
  section: string;
  label: string;
  status: EaTestStatus;
  detail?: string;
  error?: string;
};
export type EaTestSuiteReport = {
  suite: "onwardair-ea";
  version: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  total: number;
  ok: boolean;
  sections: Array<{
    id: string;
    title: string;
    passed: number;
    failed: number;
    cases: EaTestCaseResult[];
  }>;
};

const SUITE_VERSION = "onwardair-ea-v1";

class SectionRunner {
  readonly id: string;
  readonly title: string;
  readonly cases: EaTestCaseResult[] = [];
  constructor(title: string) {
    this.title = title;
    this.id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  async run(label: string, fn: () => void | Promise<void>, detail?: string) {
    const id = `${this.id}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    try {
      await fn();
      this.cases.push({ id, section: this.title, label, status: "pass", detail });
    } catch (error) {
      this.cases.push({
        id,
        section: this.title,
        label,
        status: "fail",
        detail,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
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

export async function runOnwardAirEaTestSuite(): Promise<EaTestSuiteReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const sections: SectionRunner[] = [];
  const business = onwardAirBusiness();
  const nl = buildWorkspaceNlSuite("onwardair");

  const catalogue = new SectionRunner("Application catalogue");
  sections.push(catalogue);
  await catalogue.run("OnwardAir module catalogue", () => {
    const modules = listPlatformModules({ workspaceSlug: "onwardair" });
    if (modules.length < 10) throw new Error(`expected 10+ modules, got ${modules.length}`);
    if (!modules.some((m) => m.label === "OnwardAir Intelligence")) {
      throw new Error("missing OnwardAir Intelligence");
    }
    if (!modules.some((m) => m.label === "Engineering")) {
      throw new Error("missing Engineering");
    }
  }, `modules=${listPlatformModules({ workspaceSlug: "onwardair" }).length}`);

  const boardPack = new SectionRunner("Board pack");
  sections.push(boardPack);
  await boardPack.run("Board pack intent", () => {
    const intent = resolveAbhiBoardPackIntent("Create a board deck for next week");
    if (!intent || intent.tool !== "boardpack.generate") {
      throw new Error("expected boardpack.generate");
    }
  });
  await boardPack.run("OnwardAir board pack data", () => {
    const pack = buildOnwardAirBoardPackData("2026-09-01");
    if (pack.financialOverview.cashPosition.actual !== ONWARDAIR_CASH_BALANCE_USD) {
      throw new Error("cash fixture mismatch");
    }
  }, `cash=${ONWARDAIR_CASH_BALANCE_USD}`);

  const moduleNl = new SectionRunner("Module natural language");
  sections.push(moduleNl);
  for (const row of nl.moduleCases) {
    await moduleNl.run(row.id, async () => {
      await assertWorkspaceNlCase(row, business);
    }, row.targetLabel);
  }

  const pageNl = new SectionRunner("Page natural language");
  sections.push(pageNl);
  for (const row of nl.pageCases) {
    await pageNl.run(row.id, async () => {
      await assertWorkspaceNlCase(row, business);
    }, row.targetLabel);
  }

  const tools = new SectionRunner("Tool execution smoke");
  sections.push(tools);
  const smokeCases: EaToolSmokeCase[] = [
    {
      id: "query-support",
      prompt: "How do I use support desk tickets?",
      expectedTool: "onwardair.queryModule",
    },
    {
      id: "query-procurement",
      prompt: "What screen shows procurement?",
      expectedTool: "onwardair.queryModule",
    },
    { id: "cash", prompt: "How much cash do we have?", expectedTool: "getCashPosition" },
    { id: "board-pack", prompt: "Create a board pack for tomorrow", expectedTool: "boardpack.generate" },
  ];
  const smokeResults = await runEaToolExecutionSmoke({ business, cases: smokeCases });
  for (const result of smokeResults) {
    await tools.run(result.id, () => {
      if (!result.ok) throw new Error(result.error ?? "tool smoke failed");
    });
  }

  const registry = new SectionRunner("Tool registry");
  sections.push(registry);
  await registry.run("Workspace-scoped tools", () => {
    const names = getOpenAIToolSchemas("onwardair").map((t) => t.name);
    for (const tool of ["boardpack.generate", "searchApplications", "queryBusiness", "getCashPosition"]) {
      if (!names.includes(tool)) throw new Error(`missing ${tool}`);
    }
    if (names.includes("abhi.getExecutiveBriefing")) {
      throw new Error("ABHI tools leaked to OnwardAir");
    }
  });

  const orchestration = new SectionRunner("Orchestration");
  sections.push(orchestration);
  await orchestration.run("Engineering module question", async () => {
    const route = await resolveOrchestrationRoute("Tell me about Engineering", [], business);
    if (route.kind !== "platform_answer" && route.kind !== "tool") {
      throw new Error(`unexpected route ${route.kind}`);
    }
  });

  const intelFeed = new SectionRunner("Competitor intel feed");
  sections.push(intelFeed);
  await intelFeed.run("Server feed seeded with current week brief", () => {
    const weekKey = getIsoWeekKey();
    const items = listCompetitorIntelFeed();
    if (items.length < 4) {
      throw new Error(`expected seeded feed items, got ${items.length}`);
    }
    const brief = items.find((i) => i.id === `weekly-brief-${weekKey}`);
    if (!brief) {
      throw new Error(`missing weekly brief for ${weekKey}`);
    }
    const cadence = getCompetitorIntelCadence();
    if (cadence.currentWeekKey !== weekKey) {
      throw new Error("cadence week key mismatch");
    }
  });
  await intelFeed.run("queryModule intelligence includes weekly brief", () => {
    const result = queryOnwardAirModule("intelligence");
    if (!result.bullets.some((b) => b.includes("This week"))) {
      throw new Error("expected current-week brief in bullets");
    }
    if (Number(result.metrics.intelFeedItems) < 4) {
      throw new Error("intelFeedItems metric missing or too low");
    }
  });

  const allCases = sections.flatMap((s) => s.cases);
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;
  return {
    suite: "onwardair-ea",
    version: SUITE_VERSION,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    passed,
    failed,
    total: allCases.length,
    ok: failed === 0,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      passed: s.cases.filter((c) => c.status === "pass").length,
      failed: s.cases.filter((c) => c.status === "fail").length,
      cases: s.cases,
    })),
  };
}
