/**
 * ABHI Executive Assistant — structured test suite for CLI + /testing UI.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { buildAbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import {
  assessAbhiOrgHealth,
  buildAbhiBoardInsights,
  buildAbhiExecutiveBriefing,
  formatAbhiExecutiveBriefingText,
  formatAbhiBoardInsightsText,
  queryAbhiActionCentre,
} from "@/lib/abhi/executive-intelligence";
import { resolveAbhiExecutiveIntelligenceIntent } from "@/lib/abhi/executive-intelligence-intent";
import {
  getAbhiRequestMeetings,
  iterateWithAbhiRequestOrgState,
  parseAbhiClientOrgState,
  runWithAbhiRequestOrgState,
} from "@/lib/abhi/abhi-request-org-state";
import { getAbhiBoardMeetingsServerSnapshot } from "@/lib/abhi/board-meetings-store";
import { generateAbhiBoardDeck } from "@/lib/abhi/board-deck-generator";
import {
  answerPlatformQuestion,
  listPlatformModules,
  searchApplicationCatalogue,
} from "@/lib/ai-operating-assistant/application-catalogue";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { ABHI_EA_PHASE1_DEMO_CHECKS } from "@/lib/abhi/ea-phase1-demo-checks";
import { buildAbhiModuleNlCases } from "@/lib/abhi/ea-module-nl-cases";
import { ABHI_CASH_BALANCE_GBP } from "@/lib/abhi-financials";
import { generateBoardPackTool } from "@/lib/ai-operating-assistant/boardpack-tools";
import {
  createArtifactId,
  getAssistantArtifact,
  hydrateArtifactFromMessagePayload,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import { getLatestConversationWithArtifacts } from "@/lib/ai-operating-assistant/conversation-service";
import { getAbhiNavSections } from "@/lib/internal-role-views";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";

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
  suite: "abhi-ea";
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

const SUITE_VERSION = "abhi-ea-v3";

const FORBIDDEN_ABHI = [/\bTalanton\b/, /\bportfolio companies\b/i, /\bMOIC\b/i, /\bVertex VTOL\b/i];

const ANALYSIS_CASES: Array<{ q: string; tool: string; focusOrQuery?: string }> = [
  { q: "Give me an executive briefing.", tool: "abhi.getExecutiveBriefing" },
  { q: "Organisation health assessment", tool: "abhi.getOrgHealth" },
  { q: "What actions are overdue?", tool: "abhi.queryActions", focusOrQuery: "overdue" },
  { q: "What actions are due this week?", tool: "abhi.queryActions", focusOrQuery: "due_this_week" },
  { q: "Who owns the most actions?", tool: "abhi.queryActions", focusOrQuery: "by_owner" },
  {
    q: "What are the three biggest risks facing ABHI?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "risks",
  },
  {
    q: "What board decisions require attention?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "decisions",
  },
  {
    q: "How is sponsorship performing?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "sponsorship",
  },
  { q: "Are WHX targets at risk?", tool: "abhi.getBoardInsights", focusOrQuery: "whx" },
  {
    q: "Summarise financial performance.",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "financial",
  },
  {
    q: "What should the board discuss next month?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "agenda",
  },
  {
    q: "What issues are deteriorating?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "deteriorating",
  },
  {
    q: "What issues have improved?",
    tool: "abhi.getBoardInsights",
    focusOrQuery: "improving",
  },
];

const ABHI_CATALOGUE_MODULES = [
  "ABHI Intelligence",
  "Business Central",
  "Financials",
  "Board",
  "Marketing & Events",
  "Human Resources",
  "Training",
  "Quality Management",
];

function abhiBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-test",
      username: "demo@abhi.org.uk",
      displayName: "ABHI Demo",
      userType: "operator",
    },
    organisation: { id: "org-abhi", name: "ABHI" },
    workspace: { id: "ws-abhi", name: "ABHI", slug: "abhi" },
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

function assertNoForbiddenAbhiCopy(text: string, label: string) {
  for (const pattern of FORBIDDEN_ABHI) {
    if (pattern.test(text)) {
      throw new Error(`${label} must not match ${pattern}`);
    }
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

class SectionRunner {
  readonly id: string;
  readonly title: string;
  readonly cases: EaTestCaseResult[] = [];

  constructor(title: string) {
    this.title = title;
    this.id = slugify(title);
  }

  async run(label: string, fn: () => void | Promise<void>, detail?: string) {
    const id = `${this.id}:${slugify(label)}`;
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

export async function runAbhiEaTestSuite(): Promise<EaTestSuiteReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const sections: SectionRunner[] = [];

  const intents = new SectionRunner("Intent routing");
  sections.push(intents);
  for (const row of ANALYSIS_CASES) {
    await intents.run(`${row.tool} ← ${row.q}`, () => {
      const pack = resolveAbhiBoardPackIntent(row.q);
      if (pack !== null) throw new Error("must not generate board pack");
      const intent = resolveAbhiExecutiveIntelligenceIntent(row.q);
      if (!intent) throw new Error("expected intelligence intent");
      if (intent.tool !== row.tool) {
        throw new Error(`expected ${row.tool}, got ${intent.tool}`);
      }
      if (row.focusOrQuery && intent.tool === "abhi.queryActions") {
        if (intent.args.query !== row.focusOrQuery) {
          throw new Error(`expected query ${row.focusOrQuery}`);
        }
      }
      if (row.focusOrQuery && intent.tool === "abhi.getBoardInsights") {
        if (intent.args.focus !== row.focusOrQuery) {
          throw new Error(`expected focus ${row.focusOrQuery}`);
        }
      }
    });
  }

  const boardPack = new SectionRunner("Board pack guards");
  sections.push(boardPack);
  await boardPack.run("Create board pack → boardpack.generate", () => {
    const packQ = "Create a board pack for next week's meeting.";
    if (resolveAbhiExecutiveIntelligenceIntent(packQ) !== null) {
      throw new Error("intelligence intent should be null");
    }
    const packIntent = resolveAbhiBoardPackIntent(packQ);
    if (!packIntent || packIntent.tool !== "boardpack.generate") {
      throw new Error("expected boardpack.generate");
    }
  });
  await boardPack.run("Mention-only does not generate", () => {
    if (resolveAbhiBoardPackIntent("Tell me about the board pack numbers.") !== null) {
      throw new Error("mention-only should not generate");
    }
  });

  const outputs = new SectionRunner("Analysis outputs");
  sections.push(outputs);
  await outputs.run("Executive briefing prose", () => {
    const brief = buildAbhiExecutiveBriefing();
    const prose = formatAbhiExecutiveBriefingText(brief);
    if (!/Organisation Status/i.test(prose)) throw new Error("missing organisation status");
    if (!/Financial Summary/i.test(prose)) throw new Error("missing financial summary");
    assertNoForbiddenAbhiCopy(prose, "executive briefing prose");
  }, `status=${buildAbhiExecutiveBriefing().organisationStatus}`);

  await outputs.run("Organisation health dimensions", () => {
    const health = assessAbhiOrgHealth();
    if (!["Red", "Amber", "Green"].includes(health.overall)) throw new Error("invalid overall");
    if (health.dimensions.length !== 5) throw new Error("expected 5 dimensions");
    for (const dim of ["financial", "commercial", "operational", "governance", "overall"]) {
      if (!health.dimensions.some((d) => d.id === dim)) throw new Error(`missing ${dim}`);
    }
  }, `overall=${assessAbhiOrgHealth().overall}`);

  await outputs.run("Overdue actions query", () => {
    const overdue = queryAbhiActionCentre("overdue");
    if (overdue.actions.length < 1) throw new Error("expected overdue actions");
  }, `count=${queryAbhiActionCentre("overdue").actions.length}`);

  await outputs.run("Board insights risks", () => {
    const risks = buildAbhiBoardInsights("risks");
    if (risks.topRisks.length < 3) throw new Error("expected 3+ risks");
    assertNoForbiddenAbhiCopy(formatAbhiBoardInsightsText(risks), "board insights");
  }, `count=${buildAbhiBoardInsights("risks").topRisks.length}`);

  const packModel = new SectionRunner("Board pack model");
  sections.push(packModel);
  await packModel.run("ABHI board pack data", () => {
    const pack = buildAbhiBoardPackData("2026-08-20");
    if (!/^Board Pack - /i.test(pack.packName)) {
      throw new Error(`wrong pack name: ${pack.packName}`);
    }
    if (!pack.pageSummaries || pack.pageSummaries.length < 10) {
      throw new Error(`expected 10+ deck pages, got ${pack.pageSummaries?.length ?? 0}`);
    }
    const packText = [...pack.highlights, ...pack.concerns, pack.packName].join("\n");
    assertNoForbiddenAbhiCopy(packText, "board pack narrative");
  }, `pages=${buildAbhiBoardPackData("2026-08-20").pageSummaries?.length ?? 0}`);

  await packModel.run("Board deck PDF generator", async () => {
    const result = await generateAbhiBoardDeck("2026-09-01");
    if (result.pdfBytes.byteLength < 10_000) throw new Error("PDF too small");
    if (result.pageCount < 10) throw new Error("expected 10+ slides");
    if (!result.build.startsWith("2026")) throw new Error("missing build id");
  });

  const catalogue = new SectionRunner("Application catalogue");
  sections.push(catalogue);
  await catalogue.run("ABHI module catalogue", () => {
    const modules = listPlatformModules({ workspaceSlug: "abhi" });
    if (modules.length < 8) throw new Error(`expected 8+ modules, got ${modules.length}`);
    for (const label of ABHI_CATALOGUE_MODULES) {
      if (!modules.some((m) => m.displayName === label || m.label === label)) {
        throw new Error(`missing module: ${label}`);
      }
    }
    const intelligence = modules.find((m) => m.label === "ABHI Intelligence");
    if (!intelligence?.applications.some((a) => a.label === "Member Intelligence")) {
      throw new Error("missing Member Intelligence app");
    }
    const board = modules.find((m) => m.label === "Board");
    if (!board?.applications.some((a) => a.label === "Risk Register")) {
      throw new Error("missing Board Risk Register");
    }
  }, `modules=${listPlatformModules({ workspaceSlug: "abhi" }).length}`);

  await catalogue.run("Every ABHI sidebar page is searchable", () => {
    const options = { workspaceSlug: "abhi" as const };
    const pages: Array<{ module: string; label: string }> = [];
    for (const section of getAbhiNavSections()) {
      if (section.kind === "pin" || !section.label) continue;
      for (const item of section.items) {
        const walk = (label: string, children?: readonly { label: string; children?: readonly { label: string }[] }[]) => {
          if (!children?.length) {
            pages.push({ module: section.label!, label });
            return;
          }
          for (const child of children) {
            if (child.children?.length) {
              for (const grand of child.children) {
                pages.push({ module: section.label!, label: grand.label });
              }
            } else {
              pages.push({ module: section.label!, label: child.label });
            }
          }
        };
        walk(item.label, item.children);
      }
    }
    const misses: string[] = [];
    for (const page of pages) {
      const answered = answerPlatformQuestion(`Where is ${page.label}?`, options);
      const hits = searchApplicationCatalogue(page.label, 3, options);
      const ok =
        answered != null ||
        hits.some((h) => {
          if (h.entry.kind === "page") return h.entry.page.label === page.label;
          if (h.entry.kind === "application") return h.entry.application.label === page.label;
          return false;
        });
      if (!ok) misses.push(`${page.module} → ${page.label}`);
    }
    if (misses.length) {
      throw new Error(`unsearchable pages: ${misses.slice(0, 5).join("; ")}${misses.length > 5 ? "…" : ""}`);
    }
  }, `pages=${getAbhiNavSections().length}`);

  const demo = new SectionRunner("Phase 1 demo prompts");
  sections.push(demo);
  for (const check of ABHI_EA_PHASE1_DEMO_CHECKS) {
    await demo.run(check.id, async () => {
      const route = await resolveOrchestrationRoute(check.prompt, [], abhiBusiness());
      const ok =
        route.kind === "tool" ||
        route.kind === "platform_answer" ||
        route.kind === "capability_answer";
      if (!ok) throw new Error(`unexpected route: ${route.kind}`);
    });
  }

  const orgState = new SectionRunner("Request org-state");
  sections.push(orgState);
  await orgState.run("Client governance + risks overlay", async () => {
    const parsed = parseAbhiClientOrgState({
      meetings: {
        meetings: [
          {
            id: "BM-TEST",
            meetingDate: "2026-09-01",
            title: "Test Board",
            status: "Held",
            attendees: [],
            agenda: [],
            decisions: [],
            actions: [
              {
                id: "BA-TEST",
                title: "Client-synced overdue action",
                owner: "Test Owner",
                dueDate: "2026-08-01",
                status: "Overdue",
              },
            ],
            notes: "",
            resolutions: [],
            createdAt: "2026-08-01T00:00:00Z",
            updatedAt: "2026-08-01T00:00:00Z",
          },
        ],
      },
      risks: {
        risks: [
          {
            id: "R-99",
            description: "Client-synced risk",
            owner: "Risk Owner",
            impact: "H",
            likelihood: "H",
            rating: 25,
            trend: "↑",
            mitigation: "Mitigate",
            status: "Open",
            dateAdded: "2026-07-01",
            reviewDate: "2026-08-15",
            boardPackId: "",
            boardPackLabel: "",
            archived: false,
            createdAt: "2026-07-01T00:00:00Z",
            updatedAt: "2026-07-01T00:00:00Z",
          },
        ],
      },
    });
    if (!parsed?.meetings?.meetings.length || !parsed?.risks?.risks.length) {
      throw new Error("parse failed");
    }
    runWithAbhiRequestOrgState(parsed, () => {
      const meetings = getAbhiRequestMeetings();
      if (meetings?.meetings[0]?.id !== "BM-TEST") throw new Error("overlay meeting id mismatch");
    });
    async function* gen() {
      yield getAbhiBoardMeetingsServerSnapshot().meetings[0]?.id ?? "seed";
    }
    const seen: string[] = [];
    for await (const id of iterateWithAbhiRequestOrgState(parsed, gen())) {
      seen.push(String(id));
    }
    if (!seen.length) throw new Error("async iterator overlay failed");
  });

  const registry = new SectionRunner("Tool registry");
  sections.push(registry);
  await registry.run("Workspace-scoped OpenAI tools", () => {
    const abhiTools = getOpenAIToolSchemas("abhi").map((t) => t.name);
    for (const name of [
      "abhi.getExecutiveBriefing",
      "abhi.getOrgHealth",
      "abhi.queryActions",
      "abhi.getBoardInsights",
      "boardpack.generate",
      "listPlatformModules",
      "searchApplications",
      "queryBusiness",
    ]) {
      if (!abhiTools.includes(name)) throw new Error(`missing ${name}`);
    }
    const tiTools = getOpenAIToolSchemas("talantonimpact").map((t) => t.name);
    if (tiTools.includes("abhi.getExecutiveBriefing")) {
      throw new Error("abhi tools leaked to talanton schema");
    }
  }, `abhiTools=${getOpenAIToolSchemas("abhi").filter((t) => t.name.startsWith("abhi.")).length}`);

  const orchestration = new SectionRunner("Orchestration");
  sections.push(orchestration);
  await orchestration.run("WHX question routes correctly", async () => {
    const route = await resolveOrchestrationRoute("Are WHX targets at risk?", [], abhiBusiness());
    if (route.kind !== "tool") throw new Error(`expected tool route, got ${route.kind}`);
    if (route.intent.tool !== "abhi.getBoardInsights") {
      throw new Error(`expected abhi.getBoardInsights, got ${route.intent.tool}`);
    }
  });

  await orchestration.run("Board pack generate routes correctly", async () => {
    const route = await resolveOrchestrationRoute(
      "Create a board pack for next week's meeting",
      [],
      abhiBusiness(),
    );
    if (route.kind !== "tool") throw new Error(`expected tool route, got ${route.kind}`);
    if (route.intent.tool !== "boardpack.generate") {
      throw new Error(`expected boardpack.generate, got ${route.intent.tool}`);
    }
  });

  const financials = new SectionRunner("ABHI financial fixtures");
  sections.push(financials);
  await financials.run("Board pack cash aligns with £1M fixture", () => {
    const pack = buildAbhiBoardPackData("2026-08-20");
    if (pack.financialOverview.cashPosition.actual !== ABHI_CASH_BALANCE_GBP) {
      throw new Error(
        `expected cash ${ABHI_CASH_BALANCE_GBP}, got ${pack.financialOverview.cashPosition.actual}`,
      );
    }
    const prose = formatAbhiExecutiveBriefingText(buildAbhiExecutiveBriefing());
    if (!/£1(\.0)?m|£1,000,000|1m cash/i.test(prose)) {
      throw new Error("executive briefing should mention ~£1M cash");
    }
  }, `cash=${ABHI_CASH_BALANCE_GBP}`);

  await financials.run("Open business read routes to queryBusiness on ABHI", async () => {
    const route = await resolveOrchestrationRoute(
      "How many employees do we have?",
      [],
      abhiBusiness(),
    );
    if (route.kind !== "tool") throw new Error(`expected tool route, got ${route.kind}`);
    if (route.intent.tool !== "queryBusiness") {
      throw new Error(`expected queryBusiness, got ${route.intent.tool}`);
    }
  });

  const moduleNl = new SectionRunner("Module natural language");
  sections.push(moduleNl);
  for (const row of buildAbhiModuleNlCases()) {
    await moduleNl.run(row.id, async () => {
      const answered = answerPlatformQuestion(row.prompt, { workspaceSlug: "abhi" });
      const hits = searchApplicationCatalogue(row.prompt, 3, { workspaceSlug: "abhi" });
      const route = await resolveOrchestrationRoute(row.prompt, [], abhiBusiness());
      const okRoute =
        route.kind === "platform_answer" ||
        route.kind === "tool" ||
        route.kind === "capability_answer";
      const okCatalogue =
        answered != null ||
        hits.some(
          (hit) =>
            hit.entry.module.displayName === row.moduleLabel ||
            hit.entry.module.label === row.moduleLabel,
        );
      if (!okRoute && !okCatalogue) {
        throw new Error(`no catalogue or orchestration answer for ${row.prompt}`);
      }
    }, row.moduleLabel);
  }

  const artifacts = new SectionRunner("Artifact persistence");
  sections.push(artifacts);
  await artifacts.run("putAssistantArtifact retains base64", () => {
    const id = createArtifactId();
    const record = putAssistantArtifact({
      id,
      kind: "pdf",
      title: "Test Pack",
      filename: "Test.pdf",
      mimeType: "application/pdf",
      bytes: Buffer.from("%PDF-test"),
      userId: "u-test",
    });
    if (!record.contentBase64) throw new Error("missing contentBase64");
    if (!getAssistantArtifact(id, "u-test")) throw new Error("memory cache miss");
  });

  await artifacts.run("hydrateArtifactFromMessagePayload restores bytes", () => {
    const id = createArtifactId();
    const original = putAssistantArtifact({
      id,
      kind: "pdf",
      title: "Hydrate Pack",
      filename: "Hydrate.pdf",
      mimeType: "application/pdf",
      bytes: Buffer.from("%PDF-hydrate"),
      userId: "u-test",
    });
    const hydrated = hydrateArtifactFromMessagePayload({
      id,
      title: "Hydrate Pack",
      filename: "Hydrate.pdf",
      userId: "u-test",
      contentBase64: original.contentBase64!,
    });
    if (hydrated.bytes.toString() !== "%PDF-hydrate") throw new Error("hydration bytes mismatch");
  });

  await artifacts.run("boardpack.generate returns durable artifact items", async () => {
    process.env.EA_SKIP_BOARDPACK_STAGES = "1";
    try {
      const result = await generateBoardPackTool(
        { meetingDate: "2026-08-20" },
        {
          business: abhiBusiness(),
          selection: {},
        },
      );
      const status = String((result as { status?: string }).status ?? "");
      if (status !== "ok") throw new Error(`expected ok, got ${status}`);
      const items = (result as { items?: Array<Record<string, unknown>> }).items ?? [];
      const pdf = items.find((item) => item.kind === "pdf");
      if (!pdf?.contentBase64) throw new Error("board pack PDF missing contentBase64");
      if (!pdf.artifactId) throw new Error("board pack PDF missing artifactId");
      const cached = getAssistantArtifact(String(pdf.artifactId), "u-test");
      if (!cached?.contentBase64) throw new Error("board pack artifact not in memory cache");
    } finally {
      delete process.env.EA_SKIP_BOARDPACK_STAGES;
    }
  });

  await artifacts.run("conversation resume helper is callable", async () => {
    const latest = await getLatestConversationWithArtifacts({
      userId: "00000000-0000-0000-0000-000000000000",
      workspaceId: "ws-abhi",
    });
    if (latest !== null && !Array.isArray(latest.messages)) {
      throw new Error("unexpected conversation shape");
    }
  });

  const finishedAt = new Date().toISOString();
  const allCases = sections.flatMap((s) => s.cases);
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;

  return {
    suite: "abhi-ea",
    version: SUITE_VERSION,
    startedAt,
    finishedAt,
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
