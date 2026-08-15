/**
 * Internal (unit311) Executive Assistant — regression prove suite.
 */

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
  suite: "internal-ea";
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

const SUITE_VERSION = "internal-ea-v1";

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

function internalBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-internal",
      username: "ops@unit311central.com",
      displayName: "Unit311 Ops",
      userType: "operator",
    },
    organisation: { id: "org-u3", name: "Unit311 Central" },
    workspace: { id: "ws-internal", name: "Unit311 Central", slug: "unit311" },
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

export async function runInternalEaTestSuite(): Promise<EaTestSuiteReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const sections: SectionRunner[] = [];
  const business = internalBusiness();

  const packSection = new SectionRunner("Workspace pack");
  sections.push(packSection);
  await packSection.run("internal pack registered", () => {
    ensureEaWorkspacePacksRegistered();
    const pack = getEaWorkspacePackForSlug("unit311");
    if (!pack || pack.id !== "internal") throw new Error("missing internal pack");
  });
  await packSection.run("nav provider returns sections", () => {
    const modules = listPlatformModules({ workspaceSlug: "unit311" });
    if (modules.length < 8) throw new Error(`expected 8+ modules, got ${modules.length}`);
  });

  const tools = new SectionRunner("Tool registration");
  sections.push(tools);
  await tools.run("core tool schemas present", () => {
    const schemas = getOpenAIToolSchemas("unit311");
    const names = new Set(schemas.map((s) => s.name));
    for (const required of ["queryBusiness", "getDailyBrief", "searchApplications"]) {
      if (!names.has(required)) throw new Error(`missing ${required}`);
    }
    if (names.has("abhi.getExecutiveBriefing")) {
      throw new Error("ABHI tools should not appear on internal slug");
    }
  });

  const orchestration = new SectionRunner("Orchestration");
  sections.push(orchestration);
  await orchestration.run("business read falls back to queryBusiness", async () => {
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
  await synthesis.run("queryBusiness synthesizes on internal", () => {
    const ok = shouldSynthesizeExecutiveToolResult({
      workspaceSlug: "unit311",
      toolName: "queryBusiness",
      toolArgs: { question: "Summarise clients" },
      userMessage: "Summarise clients",
      toolResult: { status: "ok" },
    });
    if (!ok) throw new Error("expected synthesis for queryBusiness");
  });

  const finishedAt = new Date().toISOString();
  const allCases = sections.flatMap((s) => s.cases);
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;
  return {
    suite: "internal-ea",
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
