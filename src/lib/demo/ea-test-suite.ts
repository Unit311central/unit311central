/**
 * Demo workspace Executive Assistant — regression prove suite.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { shouldSynthesizeExecutiveToolResult } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { getOpenAIToolSchemas, toOpenAiFunctionToolName } from "@/lib/ai-operating-assistant/tool-service";
import { resolveBusinessActionIntent } from "@/lib/ai-operating-assistant/intent-action-resolver";
import { executeEaAcceptanceCase } from "@/lib/ea-acceptance/execute-case";
import { queryNorthstarModuleTool } from "@/lib/ai-operating-assistant/northstar-executive-tools";
import { formatNorthstarDemoMoneyCompact } from "@/lib/demo/northstar-money";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackForSlug,
} from "@/lib/ai-operating-assistant/workspace-packs";

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
  suite: "demo-ea";
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

const SUITE_VERSION = "demo-ea-v1";

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

function demoBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-demo",
      username: "demo@unit311central.com",
      displayName: "Demo User",
      userType: "operator",
    },
    organisation: { id: "org-demo", name: "Demo Workspace" },
    workspace: { id: "ws-demo", name: "Demo", slug: DEMO_WORKSPACE_SLUG },
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

export async function runDemoEaTestSuite(): Promise<EaTestSuiteReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const sections: SectionRunner[] = [];
  const business = demoBusiness();

  const packSection = new SectionRunner("Workspace pack");
  sections.push(packSection);
  await packSection.run("demo pack registered", () => {
    ensureEaWorkspacePacksRegistered();
    const pack = getEaWorkspacePackForSlug(DEMO_WORKSPACE_SLUG);
    if (!pack || pack.id !== "demo") throw new Error("missing demo pack");
  });
  await packSection.run("catalogue uses demo nav", () => {
    const modules = listPlatformModules({ workspaceSlug: DEMO_WORKSPACE_SLUG });
    if (modules.length < 8) throw new Error(`expected 8+ modules, got ${modules.length}`);
  });

  const tools = new SectionRunner("Tool registration");
  sections.push(tools);
  await tools.run("northstar executive tools registered", () => {
    const schemas = getOpenAIToolSchemas(DEMO_WORKSPACE_SLUG);
    const names = new Set(schemas.map((s) => s.name));
    if (!names.has("queryBusiness")) throw new Error("missing queryBusiness");
    if (!names.has(toOpenAiFunctionToolName("northstar.getExecutiveBriefing")))
      throw new Error("missing northstar.getExecutiveBriefing");
    if (!names.has(toOpenAiFunctionToolName("northstar.queryModule")))
      throw new Error("missing northstar.queryModule");
    if (names.has("onwardair.queryModule")) throw new Error("unexpected OA tool on demo");
  });

  const orchestration = new SectionRunner("Orchestration");
  sections.push(orchestration);
  await orchestration.run("headcount question routes to semantic HR capability", async () => {
    const route = await resolveOrchestrationRoute(
      "How many employees do we have?",
      [],
      business,
    );
    if (route.kind !== "tool") {
      throw new Error(`expected tool route, got ${JSON.stringify(route)}`);
    }
    const tool = route.intent.tool;
    if (tool !== "searchEmployees" && tool !== "northstar.queryModule") {
      throw new Error(`expected searchEmployees or northstar.queryModule, got ${JSON.stringify(route)}`);
    }
  });
  await orchestration.run("margin question routes to northstar briefing", async () => {
    const route = await resolveOrchestrationRoute("Why did margin fall?", [], business);
    if (route.kind !== "tool" || route.intent.tool !== "northstar.getExecutiveBriefing") {
      throw new Error(`expected northstar.getExecutiveBriefing, got ${JSON.stringify(route)}`);
    }
  });
  await orchestration.run("Sheffield risk routes to northstar module", async () => {
    const route = await resolveOrchestrationRoute("Which customers are at risk?", [], business);
    if (route.kind !== "tool" || route.intent.tool !== "northstar.queryModule") {
      throw new Error(`expected northstar.queryModule, got ${JSON.stringify(route)}`);
    }
  });
  await orchestration.run("board deck for tomorrow routes to boardpack.generate", async () => {
    const route = await resolveOrchestrationRoute("Create me a board deck for tomorrow", [], business);
    if (route.kind !== "tool" || route.intent.tool !== "boardpack.generate") {
      throw new Error(`expected boardpack.generate, got ${JSON.stringify(route)}`);
    }
  });
  await orchestration.run("payroll last 6 months routes to queryPayroll trend", async () => {
    const route = await resolveOrchestrationRoute("Tell me payroll for last 6 months", [], business);
    if (route.kind !== "tool" || route.intent.tool !== "queryPayroll") {
      throw new Error(`expected queryPayroll, got ${JSON.stringify(route)}`);
    }
  });

  const regressionPrompts: Array<{ label: string; assert: (route: Awaited<ReturnType<typeof resolveOrchestrationRoute>>) => void }> = [
    {
      label: "sales performance read",
      assert: (route) => {
        if (route.kind !== "tool" || route.intent.tool !== "northstar.queryModule") {
          throw new Error(`expected northstar.queryModule, got ${JSON.stringify(route)}`);
        }
      },
    },
    {
      label: "sales target tracking",
      assert: (route) => {
        if (route.kind !== "tool" || route.intent.tool !== "northstar.queryModule") {
          throw new Error(`expected northstar.queryModule, got ${JSON.stringify(route)}`);
        }
      },
    },
    {
      label: "executive sales update",
      assert: (route) => {
        if (route.kind !== "tool" || route.intent.tool !== "northstar.queryModule") {
          throw new Error(`expected northstar.queryModule, got ${JSON.stringify(route)}`);
        }
      },
    },
    {
      label: "create client write",
      assert: (route) => {
        if (route.kind !== "capability_answer" && route.kind !== "need_info") {
          throw new Error(`expected write/action route, got ${JSON.stringify(route)}`);
        }
      },
    },
    {
      label: "sales management sidebar navigation",
      assert: (route) => {
        if (route.kind !== "platform_answer") {
          throw new Error(`expected platform_answer, got ${JSON.stringify(route)}`);
        }
      },
    },
    {
      label: "financial executive summary",
      assert: (route) => {
        if (route.kind !== "tool" || route.intent.tool !== "northstar.queryModule") {
          throw new Error(`expected northstar.queryModule, got ${JSON.stringify(route)}`);
        }
      },
    },
    {
      label: "project risk read",
      assert: (route) => {
        if (route.kind !== "tool" || route.intent.tool !== "northstar.queryModule") {
          throw new Error(`expected northstar.queryModule, got ${JSON.stringify(route)}`);
        }
      },
    },
  ];
  const regressionMessages = [
    "How are sales doing?",
    "Are we on track to hit target?",
    "Give me an executive sales update.",
    "Create a new client called Acme Corp.",
    "Where is Sales Management in the sidebar?",
    "Give me a financial executive summary.",
    "Which projects are at risk?",
  ];
  for (let i = 0; i < regressionPrompts.length; i += 1) {
    const spec = regressionPrompts[i];
    const message = regressionMessages[i];
    await orchestration.run(`regression: ${spec.label}`, async () => {
      const route = await resolveOrchestrationRoute(message, [], business);
      spec.assert(route);
    });
  }
  await orchestration.run("board deck PDF regression", async () => {
    const route = await resolveOrchestrationRoute("Create a board deck for tomorrow as a PDF.", [], business);
    if (route.kind !== "tool" || route.intent.tool !== "boardpack.generate") {
      throw new Error(`expected boardpack.generate, got ${JSON.stringify(route)}`);
    }
  });

  const phase3 = new SectionRunner("Phase 3 defect regression");
  sections.push(phase3);
  await phase3.run("sales-management module executes as sales not intelligence", async () => {
    const result = await queryNorthstarModuleTool(
      { module: "sales-management", question: "How are sales doing?" },
      { business, userId: business.user.id },
    );
    const prose = String((result.items?.[0] as { prose?: string })?.prose ?? result.summary?.message ?? "");
    if (/intelligence posture/i.test(prose)) {
      throw new Error(`expected sales data, got intelligence copy: ${prose.slice(0, 120)}`);
    }
    if (!/pipeline|target|sales|opportunit/i.test(prose)) {
      throw new Error(`expected sales pipeline/target content: ${prose.slice(0, 120)}`);
    }
  });
  await phase3.run("chart request routes to chart capability not module spine", async () => {
    const route = await resolveOrchestrationRoute("Graph revenue for the last six months.", [], business);
    if (route.kind === "tool" && route.intent.tool === "northstar.queryModule") {
      throw new Error("chart stolen by module spine");
    }
    const exec = await executeEaAcceptanceCase(
      { id: "chart-rev", prompt: "Graph revenue for the last six months.", kind: "chart" },
      business,
      { executeTools: true },
    );
    const hasChart = (exec.responseBlocks ?? []).some((b) => /chart/i.test(b.type));
    if (!hasChart) throw new Error(`expected chart block, got ${JSON.stringify(exec.responseBlocks?.map((b) => b.type))}`);
  });
  await phase3.run("cross-module synthesis uses evidence not queryBusiness", async () => {
    const exec = await executeEaAcceptanceCase(
      {
        id: "x-clients",
        prompt: "Which clients have both significant commercial value and unresolved issues?",
        kind: "composite",
      },
      business,
      { executeTools: true },
    );
    if (/live snapshot for:/i.test(exec.text ?? "")) {
      throw new Error("thin queryBusiness snapshot");
    }
    if ((exec.text ?? "").length < 80) throw new Error("answer too thin for cross-module synthesis");
  });
  await phase3.run("open-ended executive question returns briefing not none", async () => {
    const exec = await executeEaAcceptanceCase(
      { id: "prio", prompt: "What should I prioritise this week?", kind: "composite" },
      business,
      { executeTools: true },
    );
    if (!(exec.text ?? "").trim()) throw new Error("empty answer for prioritise this week");
  });
  await phase3.run("missing entity returns honest gap not generic financials", async () => {
    const exec = await executeEaAcceptanceCase(
      {
        id: "hall",
        prompt: "What is our revenue from the Antarctica division last quarter?",
        kind: "data",
      },
      business,
      { executeTools: true },
    );
    if (!/couldn't find|cannot find|not find|no antarctica/i.test(exec.text ?? "")) {
      throw new Error(`expected honest gap, got: ${(exec.text ?? "").slice(0, 160)}`);
    }
  });
  await phase3.run("archive client routes to clients.archiveClient", async () => {
    const intent = await resolveBusinessActionIntent("Archive Acme Corp.", business, []);
    if (intent.kind !== "propose" || intent.actionId !== "clients.archiveClient") {
      throw new Error(`expected clients.archiveClient, got ${JSON.stringify(intent)}`);
    }
  });
  await phase3.run("restore client routes to clients.restoreClient", async () => {
    const intent = await resolveBusinessActionIntent("Restore Acme Corp.", business, []);
    if (intent.kind !== "propose" || intent.actionId !== "clients.restoreClient") {
      throw new Error(`expected clients.restoreClient, got ${JSON.stringify(intent)}`);
    }
  });
  await phase3.run("conversation follow-up retains sales context", async () => {
    const history = [];
    const turns = ["How are sales doing?", "Tell me more about that one."];
    for (const prompt of turns) {
      const exec = await executeEaAcceptanceCase(
        { id: "conv", prompt, kind: "data" },
        business,
        { executeTools: true, history: [...history] },
      );
      history.push({ role: "user", content: prompt, id: `u${history.length}`, createdAt: new Date().toISOString() });
      history.push({
        role: "assistant",
        content: exec.text ?? "",
        id: `a${history.length}`,
        createdAt: new Date().toISOString(),
      });
      if (prompt.includes("Tell me more") && exec.tool === "searchApplications") {
        throw new Error("follow-up fell through to catalogue search");
      }
    }
  });
  await phase3.run("demo financial currency uses GBP prefix on server", () => {
    const sample = formatNorthstarDemoMoneyCompact(2_900_000);
    if (!sample.startsWith("£")) throw new Error(`expected GBP compact money, got ${sample}`);
  });
  await phase3.run("board deck executes with artifact bytes", async () => {
    const exec = await executeEaAcceptanceCase(
      { id: "board", prompt: "Create a board deck for tomorrow as a PDF.", kind: "pdf" },
      business,
      { executeTools: true },
    );
    if (exec.tool !== "boardpack.generate") throw new Error(`expected boardpack.generate, got ${exec.tool}`);
    const text = String(exec.text ?? "");
    if (!/board pack|boardpack|generated successfully/i.test(text) && (exec.artifactByteLength ?? 0) < 1500) {
      throw new Error(`board pack did not execute: bytes=${exec.artifactByteLength ?? 0} text=${text.slice(0, 80)}`);
    }
  });

  const synthesis = new SectionRunner("LLM synthesis");
  sections.push(synthesis);
  await synthesis.run("northstar executive briefing synthesizes", () => {
    const ok = shouldSynthesizeExecutiveToolResult({
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      toolName: "northstar.getExecutiveBriefing",
      toolArgs: {},
      userMessage: "Give me an executive briefing",
      toolResult: { status: "ok", items: [{ prose: "brief" }] },
    });
    if (!ok) throw new Error("expected northstar briefing synthesis");
  });
  await synthesis.run("getSmartInsights health check synthesizes", () => {
    const ok = shouldSynthesizeExecutiveToolResult({
      workspaceSlug: DEMO_WORKSPACE_SLUG,
      toolName: "getSmartInsights",
      toolArgs: {},
      userMessage: "Give me an executive health check",
      toolResult: { status: "ok", insights: [] },
    });
    if (!ok) throw new Error("expected health-check synthesis");
  });

  const finishedAt = new Date().toISOString();
  const allCases = sections.flatMap((s) => s.cases);
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;
  return {
    suite: "demo-ea",
    version: SUITE_VERSION,
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    passed,
    failed,
    total: allCases.length,
    ok: failed === 0,
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      passed: section.cases.filter((c) => c.status === "pass").length,
      failed: section.cases.filter((c) => c.status === "fail").length,
      cases: section.cases,
    })),
  };
}
