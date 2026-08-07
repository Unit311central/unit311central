/**
 * Talanton Executive Intelligence — intent, analysis, board pack, org-state smoke.
 * Run: npm run prove:talanton-ea
 */
import assert from "node:assert/strict";

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import { loadScopedPdfBundle } from "@/lib/ai-operating-assistant/scoped-business-pdf-service";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
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
  {
    q: "What requires attention across the portfolio?",
    tool: "talanton.queryPortfolio",
  },
  {
    q: "Summarise fund capital deployment",
    tool: "talanton.queryFunds",
  },
  {
    q: "Summarise portfolio impact metrics",
    tool: "talanton.queryImpact",
  },
  {
    q: "What are the biggest portfolio risks?",
    tool: "talanton.getBoardInsights",
    focusOrQuery: "risks",
  },
  {
    q: "What board decisions require attention?",
    tool: "talanton.getBoardInsights",
    focusOrQuery: "decisions",
  },
  {
    q: "How is capital deployment performing?",
    tool: "talanton.queryFunds",
  },
  {
    q: "Summarise portfolio impact for the board",
    tool: "talanton.getBoardInsights",
    focusOrQuery: "impact",
  },
  {
    q: "What should the board discuss next month?",
    tool: "talanton.getBoardInsights",
    focusOrQuery: "general",
  },
];

function assertNoForbiddenTalantonCopy(text: string, label: string) {
  for (const pattern of FORBIDDEN_TALANTON) {
    assert.doesNotMatch(text, pattern, `${label} must not match ${pattern}`);
  }
}

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

async function main() {
  console.log("\n=== Talanton analysis intents (not board pack) ===");
  for (const row of ANALYSIS_CASES) {
    const pack = resolveAbhiBoardPackIntent(row.q);
    assert.equal(pack, null, `must not generate pack for: ${row.q}`);
    const intent = resolveTalantonExecutiveIntelligenceIntent(row.q);
    assert.ok(intent, `expected intelligence intent for: ${row.q}`);
    assert.equal(intent!.tool, row.tool, row.q);
    if (row.focusOrQuery && intent!.tool === "talanton.queryActions") {
      assert.equal(intent!.args.query, row.focusOrQuery, row.q);
    }
    if (row.focusOrQuery && intent!.tool === "talanton.getBoardInsights") {
      assert.equal(intent!.args.focus, row.focusOrQuery, row.q);
    }
    console.log(`ok  ${row.tool.padEnd(30)} ← ${row.q}`);
  }

  console.log("\n=== Board pack only on explicit generate ===");
  const packQ = "Create a board pack for next week's meeting.";
  assert.equal(resolveTalantonExecutiveIntelligenceIntent(packQ), null);
  const packIntent = resolveAbhiBoardPackIntent(packQ);
  assert.ok(packIntent);
  assert.equal(packIntent!.tool, "boardpack.generate");
  console.log(`ok  boardpack.generate ← ${packQ}`);

  const mentionOnly = "Tell me about the board pack numbers.";
  assert.equal(resolveAbhiBoardPackIntent(mentionOnly), null);
  console.log("ok  mention-only board pack does not generate");

  console.log("\n=== Analysis outputs ===");
  const brief = buildTalantonExecutiveBriefing();
  const prose = formatTalantonExecutiveBriefingText(brief);
  assert.match(prose, /Talanton Executive Briefing/i);
  assert.match(prose, /Portfolio/i);
  assert.match(prose, /Funds & capital/i);
  assert.match(prose, /Impact/i);
  assert.match(prose, /Governance/i);
  assert.match(prose, /Risks requiring attention/i);
  assert.match(prose, /Open actions/i);
  assertNoForbiddenTalantonCopy(prose, "executive briefing prose");
  console.log(`ok  briefing status=${brief.organisationStatus}`);

  const health = assessTalantonOrgHealth();
  assert.ok(["Red", "Amber", "Green"].includes(health.overall));
  assert.equal(health.dimensions.length, 5);
  for (const dim of ["portfolio", "funds", "impact", "governance", "overall"]) {
    assert.ok(health.dimensions.some((d) => d.id === dim));
  }
  console.log(`ok  org health overall=${health.overall}`);

  const portfolio = queryTalantonPortfolio();
  assert.ok(portfolio.briefing.health.portfolioHealthScore > 0);
  assert.ok(portfolio.briefing.health.totalPortfolioCompanies >= 1);
  assertNoForbiddenTalantonCopy(portfolio.prose, "portfolio briefing");
  console.log(`ok  portfolio health=${portfolio.briefing.health.portfolioHealthScore}`);

  const funds = queryTalantonFunds();
  assert.ok(funds.overview.capitalCommittedUsd > 0);
  assert.ok(funds.fundNames.length >= 3);
  assert.match(funds.prose, /\$/);
  console.log(`ok  funds committed=${funds.overview.capitalCommittedUsd}`);

  const impact = queryTalantonImpact();
  assert.ok(impact.briefing.summary.jobsCreated > 0);
  assert.ok(impact.briefing.health.score > 0);
  console.log(`ok  impact jobs=${impact.briefing.summary.jobsCreated}`);

  const overdue = queryTalantonActionCentre("overdue");
  assert.ok(overdue.actions.length >= 0);
  console.log(`ok  overdue actions=${overdue.actions.length}`);

  const risks = buildTalantonBoardInsights("risks");
  assert.ok(risks.topRisks.length >= 1);
  console.log(`ok  top risks=${risks.topRisks.length}`);

  console.log("\n=== Board pack model ===");
  const pack = buildTalantonBoardPackData("2026-08-20");
  assert.ok(isTalantonBoardPackData(pack));
  assert.match(pack.packName, /Talanton Impact/i);
  assert.ok(pack.highlightCards.some((c) => /capital|Portfolio|Impact/i.test(c.title)));
  const packText = [...pack.highlights, ...pack.concerns, pack.packName].join("\n");
  assertNoForbiddenTalantonCopy(packText, "board pack narrative");
  assert.ok(pack.risks.length >= 1);
  assert.ok(!pack.risks.some((r) => /^R-0[1-6]$/.test(r.id)));
  console.log(`ok  board pack risks=${pack.risks.length} highlights=${pack.highlightCards.length}`);

  console.log("\n=== Request org-state overlay ===");
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
  assert.ok(parsed?.governance?.meetings.length === 1);
  assert.ok(parsed?.risks?.risks.length === 1);

  runWithTalantonRequestOrgState(parsed, () => {
    const live = listTalantonLiveRisks();
    assert.equal(live[0]?.id, "TI-R-99");
    assert.equal(live[0]?.description, "Client-synced Talanton risk");
  });

  async function* gen() {
    yield listTalantonLiveRisks()[0]?.id ?? "none";
  }

  const seen: string[] = [];
  for await (const id of iterateWithTalantonRequestOrgState(parsed, gen())) {
    seen.push(String(id));
  }
  assert.deepEqual(seen, ["TI-R-99"]);
  console.log("ok  Talanton request org-state overlay works");

  console.log("\n=== Scoped PDF metrics ===");
  const scoped = parseScopedPdfRequest(
    "Generate a PDF with portfolio capital, fund deployment, and impact health for the board.",
  );
  assert.ok(scoped.useScopedPath);
  assert.ok(scoped.metrics.includes("portfolio_capital"));
  assert.ok(scoped.metrics.includes("fund_deployment"));
  assert.ok(scoped.metrics.includes("impact_health"));

  const bundle = await loadScopedPdfBundle({
    metrics: ["portfolio_capital", "fund_deployment", "impact_health", "jobs_created"],
    period: scoped.period,
    unknownTopics: [],
    canAccessFinancials: true,
    canAccessHr: true,
  });
  assert.equal(bundle.sections.length, 4);
  assert.ok(bundle.sections.some((s) => s.metricId === "portfolio_capital"));
  assert.ok(bundle.sections.some((s) => s.rows.some((r) => /\$/.test(r.value))));
  console.log(`ok  scoped PDF sections=${bundle.sections.length}`);

  console.log("\n=== Tool registry (workspace-scoped) ===");
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
    assert.ok(tiTools.includes(name), `Talanton schema missing ${name}`);
  }
  const abhiTools = getOpenAIToolSchemas("abhi").map((t) => t.name);
  assert.ok(abhiTools.includes("abhi.getExecutiveBriefing"));
  assert.ok(!abhiTools.includes("talanton.getExecutiveBriefing"));
  console.log(`ok  talanton tool count=${tiTools.filter((n) => n.startsWith("talanton.")).length}`);

  console.log("\n=== Orchestration (Talanton workspace) ===");
  const route = await resolveOrchestrationRoute(
    "What requires attention across the portfolio?",
    [],
    talantonBusiness(),
  );
  assert.equal(route.kind, "tool");
  if (route.kind === "tool") {
    assert.equal(route.intent.tool, "talanton.queryPortfolio");
  }
  console.log("ok  portfolio question routes to talanton.queryPortfolio");

  console.log("\nAll Talanton executive intelligence checks passed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
