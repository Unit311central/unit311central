/**
 * Demo workspace Executive Assistant — regression prove suite.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { shouldSynthesizeExecutiveToolResult } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
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
  await tools.run("generic EA tools only", () => {
    const schemas = getOpenAIToolSchemas(DEMO_WORKSPACE_SLUG);
    const names = new Set(schemas.map((s) => s.name));
    if (!names.has("queryBusiness")) throw new Error("missing queryBusiness");
    if (names.has("onwardair.queryModule")) throw new Error("unexpected OA tool on demo");
  });

  const orchestration = new SectionRunner("Orchestration");
  sections.push(orchestration);
  await orchestration.run("open business question routes to queryBusiness", async () => {
    const route = await resolveOrchestrationRoute(
      "How many employees do we have?",
      [],
      business,
    );
    if (route.kind !== "tool" || route.intent.tool !== "queryBusiness") {
      throw new Error(`expected queryBusiness, got ${JSON.stringify(route)}`);
    }
  });

  const synthesis = new SectionRunner("LLM synthesis");
  sections.push(synthesis);
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
