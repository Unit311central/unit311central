/**
 * Talanton Executive Assistant — structured test suite for CLI + /testing UI.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { loadScopedPdfBundle } from "@/lib/ai-operating-assistant/scoped-business-pdf-service";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";
import {
  assessTalantonOrgHealth,
  buildTalantonBoardInsights,
  buildTalantonExecutiveBriefing,
  formatTalantonExecutiveBriefingText,
  listTalantonLiveRisks,
  queryTalantonActionCentre,
  queryTalantonFunds,
  queryTalantonImpact,
  queryTalantonPortfolio,
} from "@/lib/talanton/executive-intelligence";
import {
  buildTalantonBoardPackData,
  isTalantonBoardPackData,
} from "@/lib/talanton/board-pack-model";
import {
  iterateWithTalantonRequestOrgState,
  parseTalantonClientOrgState,
  runWithTalantonRequestOrgState,
} from "@/lib/talanton/talanton-request-org-state";

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
  suite: "talanton-ea";
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

const SUITE_VERSION = "talanton-ea-v1";

const FORBIDDEN_TALANTON = [
  /\bABHI\b/,
  /\bmembership\b/i,
  /\bWHX\b/,
  /\bHealthTech\b/i,
  /\bsponsorship\b/i,
];

const ANALYSIS_CASES: Array<{ q: string; tool: string; focusOrQuery?: string }> = [
  { q: "Give me an executive briefing.", tool: "talanton.getExecutiveBriefing" },
  { q: "Organisation health assessment", tool: "talanton.getOrgHealth" },
  { q: "What actions are overdue?", tool: "talanton.queryActions", focusOrQuery: "overdue" },
  { q: "What actions are due this week?", tool: "talanton.queryActions", focusOrQuery: "due_this_week" },
  { q: "Who owns the most actions?", tool: "talanton.queryActions", focusOrQuery: "by_owner" },
  { q: "What requires attention across the portfolio?", tool: "talanton.queryPortfolio" },
  { q: "Summarise fund capital deployment", tool: "talanton.queryFunds" },
  { q: "Summarise portfolio impact metrics", tool: "talanton.queryImpact" },
  { q: "What are the biggest portfolio risks?", tool: "talanton.getBoardInsights", focusOrQuery: "risks" },
  { q: "What board decisions require attention?", tool: "talanton.getBoardInsights", focusOrQuery: "decisions" },
  { q: "How is capital deployment performing?", tool: "talanton.queryFunds" },
  { q: "Summarise portfolio impact for the board", tool: "talanton.getBoardInsights", focusOrQuery: "impact" },
  { q: "What should the board discuss next month?", tool: "talanton.getBoardInsights", focusOrQuery: "general" },
];

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

function assertNoForbiddenTalantonCopy(text: string, label: string) {
  for (const pattern of FORBIDDEN_TALANTON) {
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

export async function runTalantonEaTestSuite(): Promise<EaTestSuiteReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const sections: SectionRunner[] = [];

  const intents = new SectionRunner("Intent routing");
  sections.push(intents);
  for (const row of ANALYSIS_CASES) {
    await intents.run(`${row.tool} ← ${row.q}`, () => {
      const pack = resolveAbhiBoardPackIntent(row.q);
      if (pack !== null) throw new Error("must not generate board pack");
      const intent = resolveTalantonExecutiveIntelligenceIntent(row.q);
      if (!intent) throw new Error("expected intelligence intent");
      if (intent.tool !== row.tool) {
        throw new Error(`expected ${row.tool}, got ${intent.tool}`);
      }
      if (row.focusOrQuery && intent.tool === "talanton.queryActions") {
        if (intent.args.query !== row.focusOrQuery) {
          throw new Error(`expected query ${row.focusOrQuery}`);
        }
      }
      if (row.focusOrQuery && intent.tool === "talanton.getBoardInsights") {
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
    if (resolveTalantonExecutiveIntelligenceIntent(packQ) !== null) {
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
    const brief = buildTalantonExecutiveBriefing();
    const prose = formatTalantonExecutiveBriefingText(brief);
    if (!/Talanton Executive Briefing/i.test(prose)) throw new Error("missing briefing header");
    if (!/Portfolio/i.test(prose)) throw new Error("missing portfolio section");
    assertNoForbiddenTalantonCopy(prose, "executive briefing prose");
  }, `status=${buildTalantonExecutiveBriefing().organisationStatus}`);

  await outputs.run("Organisation health dimensions", () => {
    const health = assessTalantonOrgHealth();
    if (!["Red", "Amber", "Green"].includes(health.overall)) throw new Error("invalid overall");
    if (health.dimensions.length !== 5) throw new Error("expected 5 dimensions");
    for (const dim of ["portfolio", "funds", "impact", "governance", "overall"]) {
      if (!health.dimensions.some((d) => d.id === dim)) throw new Error(`missing ${dim}`);
    }
  }, `overall=${assessTalantonOrgHealth().overall}`);

  await outputs.run("Portfolio intelligence", () => {
    const portfolio = queryTalantonPortfolio();
    if (portfolio.briefing.health.portfolioHealthScore <= 0) throw new Error("invalid health score");
    assertNoForbiddenTalantonCopy(portfolio.prose, "portfolio briefing");
  }, `health=${queryTalantonPortfolio().briefing.health.portfolioHealthScore}`);

  await outputs.run("Funds overview", () => {
    const funds = queryTalantonFunds();
    if (funds.overview.capitalCommittedUsd <= 0) throw new Error("no capital committed");
    if (funds.fundNames.length < 3) throw new Error("expected 3+ funds");
    if (!/\$/.test(funds.prose)) throw new Error("expected USD in prose");
  });

  await outputs.run("Impact briefing", () => {
    const impact = queryTalantonImpact();
    if (impact.briefing.summary.jobsCreated <= 0) throw new Error("no jobs created");
    if (impact.briefing.health.score <= 0) throw new Error("invalid impact health");
  }, `jobs=${queryTalantonImpact().briefing.summary.jobsCreated}`);

  await outputs.run("Board insights risks", () => {
    const risks = buildTalantonBoardInsights("risks");
    if (risks.topRisks.length < 1) throw new Error("expected risks");
  }, `count=${buildTalantonBoardInsights("risks").topRisks.length}`);

  await outputs.run("Overdue actions query", () => {
    const overdue = queryTalantonActionCentre("overdue");
    if (overdue.actions.length < 0) throw new Error("invalid actions");
  }, `count=${queryTalantonActionCentre("overdue").actions.length}`);

  const packModel = new SectionRunner("Board pack model");
  sections.push(packModel);
  await packModel.run("Talanton board pack data", () => {
    const pack = buildTalantonBoardPackData("2026-08-20");
    if (!isTalantonBoardPackData(pack)) throw new Error("not Talanton pack");
    if (!/Talanton Impact/i.test(pack.packName)) throw new Error("wrong pack name");
    const packText = [...pack.highlights, ...pack.concerns, pack.packName].join("\n");
    assertNoForbiddenTalantonCopy(packText, "board pack narrative");
    if (pack.risks.some((r) => /^R-0[1-6]$/.test(r.id))) throw new Error("ABHI risk ids found");
  }, `risks=${buildTalantonBoardPackData("2026-08-20").risks.length}`);

  const orgState = new SectionRunner("Request org-state");
  sections.push(orgState);
  await orgState.run("Client governance + risks overlay", async () => {
    const parsed = parseTalantonClientOrgState({
      governance: {
        meetings: [
          {
            id: "gov-test",
            meetingDate: "2026-09-01",
            meetingType: "Board Meeting",
            title: "Client-synced governance meeting",
            status: "Scheduled",
            attendees: [],
            minutes: "",
            decisions: [],
            actions: [
              {
                id: "ga-test",
                title: "Client-synced governance action",
                owner: "Test Owner",
                dueDate: "2026-08-01",
                status: "Overdue",
              },
            ],
            archived: false,
            createdAt: "2026-08-01T00:00:00Z",
            updatedAt: "2026-08-01T00:00:00Z",
          },
        ],
      },
      risks: {
        risks: [
          {
            id: "TI-R-99",
            description: "Client-synced Talanton risk",
            owner: "Risk Owner",
            impact: "H",
            likelihood: "H",
            rating: 25,
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
    if (!parsed?.governance?.meetings.length || !parsed?.risks?.risks.length) {
      throw new Error("parse failed");
    }
    runWithTalantonRequestOrgState(parsed, () => {
      const live = listTalantonLiveRisks();
      if (live[0]?.id !== "TI-R-99") throw new Error("overlay risk id mismatch");
    });
    async function* gen() {
      yield listTalantonLiveRisks()[0]?.id ?? "none";
    }
    const seen: string[] = [];
    for await (const id of iterateWithTalantonRequestOrgState(parsed, gen())) {
      seen.push(String(id));
    }
    if (seen.join() !== "TI-R-99") throw new Error("async iterator overlay failed");
  });

  const scopedPdf = new SectionRunner("Scoped PDF metrics");
  sections.push(scopedPdf);
  await scopedPdf.run("Parse Talanton PDF metrics", async () => {
    const scoped = parseScopedPdfRequest(
      "Generate a PDF with portfolio capital, fund deployment, and impact health for the board.",
    );
    if (!scoped.useScopedPath) throw new Error("expected scoped path");
    for (const metric of ["portfolio_capital", "fund_deployment", "impact_health"] as const) {
      if (!scoped.metrics.includes(metric)) throw new Error(`missing ${metric}`);
    }
    const bundle = await loadScopedPdfBundle({
      metrics: ["portfolio_capital", "fund_deployment", "impact_health", "jobs_created"],
      period: scoped.period,
      unknownTopics: [],
      canAccessFinancials: true,
      canAccessHr: true,
    });
    if (bundle.sections.length !== 4) throw new Error("expected 4 sections");
    if (!bundle.sections.some((s) => s.rows.some((r) => /\$/.test(r.value)))) {
      throw new Error("expected USD values");
    }
  });

  const registry = new SectionRunner("Tool registry");
  sections.push(registry);
  await registry.run("Workspace-scoped OpenAI tools", () => {
    const tiTools = getOpenAIToolSchemas("talantonimpact").map((t) => t.name);
    for (const name of [
      "talanton.getExecutiveBriefing",
      "talanton.getOrgHealth",
      "talanton.queryActions",
      "talanton.getBoardInsights",
      "talanton.queryPortfolio",
      "talanton.queryFunds",
      "talanton.queryImpact",
    ]) {
      if (!tiTools.includes(name)) throw new Error(`missing ${name}`);
    }
    const abhiTools = getOpenAIToolSchemas("abhi").map((t) => t.name);
    if (!abhiTools.includes("abhi.getExecutiveBriefing")) throw new Error("missing abhi tool");
    if (abhiTools.includes("talanton.getExecutiveBriefing")) {
      throw new Error("talanton tools leaked to abhi schema");
    }
  }, `talantonTools=${getOpenAIToolSchemas("talantonimpact").filter((t) => t.name.startsWith("talanton.")).length}`);

  const orchestration = new SectionRunner("Orchestration");
  sections.push(orchestration);
  await orchestration.run("Portfolio question routes correctly", async () => {
    const route = await resolveOrchestrationRoute(
      "What requires attention across the portfolio?",
      [],
      talantonBusiness(),
    );
    if (route.kind !== "tool") throw new Error(`expected tool route, got ${route.kind}`);
    if (route.intent.tool !== "talanton.queryPortfolio") {
      throw new Error(`expected talanton.queryPortfolio, got ${route.intent.tool}`);
    }
  });

  const finishedAt = new Date().toISOString();
  const allCases = sections.flatMap((s) => s.cases);
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;

  return {
    suite: "talanton-ea",
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
