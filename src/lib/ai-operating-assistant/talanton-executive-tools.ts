/**
 * Talanton Executive Intelligence tools — briefing, org health, portfolio, funds, impact.
 */

import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import {
  assessTalantonOrgHealth,
  buildTalantonBoardInsights,
  buildTalantonExecutiveBriefing,
  formatTalantonActionCentreText,
  formatTalantonBoardInsightsText,
  formatTalantonExecutiveBriefingText,
  formatTalantonOrgHealthText,
  queryTalantonActionCentre,
  queryTalantonFunds,
  queryTalantonImpact,
  queryTalantonPortfolio,
  type TalantonActionCentreQuery,
  type TalantonBoardInsightsFocus,
} from "@/lib/talanton/executive-intelligence";
import {
  queryTalantonStories,
  type StoriesScope,
  type StoryStatusFilter,
  type StoryTypeFilter,
} from "@/lib/talanton/executive-stories-intelligence";
import type { ImpactCategory } from "@/lib/talanton/marketing-stories-store";
import {
  buildTalantonStoriesReportPdf,
  talantonStoriesReportFilename,
} from "@/lib/talanton/executive-stories-pdf";
import {
  buildTalantonStoriesLessonsPdf,
  talantonStoriesLessonsPdfFilename,
} from "@/lib/talanton/executive-stories-lessons-pdf";
import {
  formatStoriesLessonsProse,
  synthesizeTalantonStoriesLessons,
} from "@/lib/talanton/executive-stories-lessons";
import {
  createArtifactId,
  persistArtifactToStorage,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function talantonOnly(
  tool: string,
  ctx: AssistantToolExecutionContext,
): AssistantToolResult | null {
  if (!isTalantonImpactSlug(ctx.business.workspace.slug)) {
    return toolForbidden(
      tool,
      "Talanton Executive Intelligence is available on the Talanton Impact workspace only.",
    );
  }
  return null;
}

const FOLLOW_UPS = [
  { id: "fu_ti_brief", label: "Give me an executive briefing", kind: "generate" as const },
  { id: "fu_ti_health", label: "Organisation health assessment", kind: "generate" as const },
  { id: "fu_ti_portfolio", label: "What requires attention across the portfolio?", kind: "generate" as const },
  { id: "fu_ti_impact", label: "Summarise portfolio impact", kind: "generate" as const },
  { id: "fu_ti_stories", label: "Summarise impact stories across the portfolio", kind: "generate" as const },
  { id: "fu_ti_pack", label: "Create a board pack for the next meeting", kind: "generate" as const },
];

function parseActionQuery(raw: string): TalantonActionCentreQuery {
  const value = raw.toLowerCase();
  if (
    value === "overdue" ||
    value === "due_this_week" ||
    value === "by_owner" ||
    value === "open" ||
    value === "all"
  ) {
    return value;
  }
  return "open";
}

function parseInsightsFocus(raw: string): TalantonBoardInsightsFocus {
  const value = raw.toLowerCase();
  const allowed: TalantonBoardInsightsFocus[] = [
    "decisions",
    "deteriorating",
    "improving",
    "risks",
    "funds",
    "impact",
    "portfolio",
    "governance",
    "general",
  ];
  return (allowed.find((entry) => entry === value) ?? "general") as TalantonBoardInsightsFocus;
}

export async function getTalantonExecutiveBriefingTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.getExecutiveBriefing", ctx);
  if (blocked) return blocked;

  const brief = buildTalantonExecutiveBriefing();
  const prose = formatTalantonExecutiveBriefingText(brief);
  return toolOk("talanton.getExecutiveBriefing", [{ ...brief, prose }], {
    source: ["talanton:executive-intelligence", "talanton:portfolio", "talanton:funds", "talanton:impact"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      organisationStatus: brief.organisationStatus,
      nextBoardMeeting: brief.nextBoardMeeting,
      riskCount: brief.risksRequiringAttention.length,
      openActionCount: brief.openActions.length,
    },
    followUpActions: FOLLOW_UPS.filter((f) => f.id !== "fu_ti_brief"),
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function getTalantonOrgHealthTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.getOrgHealth", ctx);
  if (blocked) return blocked;

  const health = assessTalantonOrgHealth();
  const prose = formatTalantonOrgHealthText(health);
  return toolOk("talanton.getOrgHealth", [{ ...health, prose }], {
    source: ["talanton:executive-intelligence"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      overall: health.overall,
      portfolio: health.dimensions.find((d) => d.id === "portfolio")?.status,
      funds: health.dimensions.find((d) => d.id === "funds")?.status,
      impact: health.dimensions.find((d) => d.id === "impact")?.status,
      governance: health.dimensions.find((d) => d.id === "governance")?.status,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function queryTalantonActionsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.queryActions", ctx);
  if (blocked) return blocked;

  const query = parseActionQuery(asString(args.query) || "open");
  const result = queryTalantonActionCentre(query);
  const prose = formatTalantonActionCentreText(result);
  return toolOk("talanton.queryActions", [{ ...result, prose }], {
    source: ["talanton:executive-intelligence", "talanton:governance"],
    page: 1,
    pageSize: 1,
    summary: { message: prose, query: result.query, count: result.actions.length, headline: result.headline },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function getTalantonBoardInsightsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.getBoardInsights", ctx);
  if (blocked) return blocked;

  const focus = parseInsightsFocus(asString(args.focus) || "general");
  const insights = buildTalantonBoardInsights(focus);
  const prose = formatTalantonBoardInsightsText(insights);
  return toolOk("talanton.getBoardInsights", [{ ...insights, prose }], {
    source: ["talanton:executive-intelligence", "talanton:governance", "talanton:risk-register"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      focus: insights.focus,
      headline: insights.headline,
      decisionCount: insights.decisionsRequired.length,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function queryTalantonPortfolioTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.queryPortfolio", ctx);
  if (blocked) return blocked;

  const result = queryTalantonPortfolio();
  return toolOk("talanton.queryPortfolio", [result], {
    source: ["talanton:portfolio-intelligence", "talanton:portfolio-data"],
    page: 1,
    pageSize: 1,
    summary: {
      message: result.prose,
      healthScore: result.briefing.health.portfolioHealthScore,
      attentionCount: result.briefing.health.companiesRequiringAttention,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function queryTalantonFundsTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.queryFunds", ctx);
  if (blocked) return blocked;

  const result = queryTalantonFunds();
  return toolOk("talanton.queryFunds", [result], {
    source: ["talanton:funds-data"],
    page: 1,
    pageSize: 1,
    summary: {
      message: result.prose,
      capitalCommittedUsd: result.overview.capitalCommittedUsd,
      capitalDeployedUsd: result.overview.capitalDeployedUsd,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function queryTalantonImpactTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.queryImpact", ctx);
  if (blocked) return blocked;

  const result = queryTalantonImpact();
  return toolOk("talanton.queryImpact", [result], {
    source: ["talanton:impact-intelligence"],
    page: 1,
    pageSize: 1,
    summary: {
      message: result.prose,
      impactHealthScore: result.briefing.health.score,
      jobsCreated: result.briefing.summary.jobsCreated,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

function parseStoryTypeFilter(raw: string): StoryTypeFilter {
  if (raw === "portfolio" || raw === "journey" || raw === "both") return raw;
  return "both";
}

function parseStoryStatusFilter(raw: string): StoryStatusFilter {
  if (raw === "approved_only" || raw === "include_review" || raw === "all") return raw;
  return "include_review";
}

function parseStoriesScopeArgs(args: Record<string, unknown>): StoriesScope {
  const companyRaw = args.companyIds;
  let companyIds: StoriesScope["companyIds"] = "all";
  if (companyRaw === "all") companyIds = "all";
  else if (Array.isArray(companyRaw)) {
    companyIds = companyRaw.map((v) => String(v));
  } else if (typeof companyRaw === "string" && companyRaw.trim()) {
    companyIds = companyRaw === "all" ? "all" : [companyRaw];
  }

  let categories: StoriesScope["categories"] = "all";
  const catRaw = args.categories;
  if (catRaw === "all") categories = "all";
  else if (Array.isArray(catRaw)) categories = catRaw as ImpactCategory[];

  return {
    companyIds,
    storyTypes: parseStoryTypeFilter(asString(args.storyTypes) || "both"),
    statusFilter: parseStoryStatusFilter(asString(args.statusFilter) || "include_review"),
    categories,
    outputFormat:
      asString(args.outputFormat) === "pdf"
        ? "pdf"
        : asString(args.outputFormat) === "newsletter"
          ? "newsletter"
          : "narrative",
    periodFrom: asString(args.periodFrom) || undefined,
    periodTo: asString(args.periodTo) || undefined,
  };
}

const STORY_FOLLOW_UPS = [
  { id: "fu_stories_report", label: "Generate impact stories PDF — all companies", kind: "generate" as const },
  { id: "fu_stories_approved", label: "Approved stories only", kind: "generate" as const },
  { id: "fu_stories_journey", label: "Journey field visits summary", kind: "generate" as const },
];

export async function queryTalantonStoriesTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.queryStories", ctx);
  if (blocked) return blocked;

  const scope = parseStoriesScopeArgs(args);
  scope.outputFormat = "narrative";
  const result = queryTalantonStories(scope);

  return toolOk("talanton.queryStories", [{ ...result }], {
    source: ["talanton:marketing-stories", "talanton:journey-stories"],
    page: 1,
    pageSize: 1,
    summary: {
      message: result.prose,
      storyCount: result.rows.length,
      portfolioCount: result.counts.portfolio,
      journeyCount: result.counts.journey,
    },
    followUpActions: STORY_FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function generateTalantonStoriesLessonsPdfTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.generateStoriesLessonsPdf", ctx);
  if (blocked) return blocked;

  const scope = parseStoriesScopeArgs(args);
  const question = asString(args.question) || "Management lessons from field stories";
  const result = queryTalantonStories({ ...scope, outputFormat: "narrative" });
  const analysis = await synthesizeTalantonStoriesLessons(result, question);
  const pdfBytes = await buildTalantonStoriesLessonsPdf(
    analysis,
    ctx.business.organisation.name ?? "Talanton Impact",
  );
  const filename = talantonStoriesLessonsPdfFilename();

  let artifact = putAssistantArtifact({
    id: createArtifactId(),
    kind: "pdf",
    title: analysis.documentTitle,
    filename,
    mimeType: "application/pdf",
    bytes: Buffer.from(pdfBytes),
    userId: ctx.business.user.id,
    meta: {
      workspaceSlug: ctx.business.workspace.slug,
      storyCount: analysis.storyCount,
      lessonCount: analysis.lessons.length,
      scope: result.scope,
      synthesisSource: analysis.synthesisSource,
    },
  });
  artifact = await persistArtifactToStorage(artifact);

  const openUrl = `/api/executive-assistant/artifacts/${artifact.id}?disposition=inline`;
  const downloadUrl = `/api/executive-assistant/artifacts/${artifact.id}?disposition=attachment`;
  const prose = `${formatStoriesLessonsProse(analysis)}\n\nPDF report generated (${analysis.lessons.length} management lessons from ${analysis.storyCount} stories).`;

  return toolOk(
    "talanton.generateStoriesLessonsPdf",
    [
      {
        ...result,
        analysis,
        prose,
        artifactId: artifact.id,
        title: artifact.title,
        filename: artifact.filename,
        openUrl,
        downloadUrl,
        kind: "pdf",
      },
    ],
    {
      source: [
        "talanton:marketing-stories",
        "talanton:journey-stories",
        "assistant:stories-lessons-pdf",
      ],
      page: 1,
      pageSize: 1,
      summary: {
        message: prose,
        storyCount: analysis.storyCount,
        lessonCount: analysis.lessons.length,
        artifactId: artifact.id,
        openUrl,
        downloadUrl,
        executed: true,
      },
      followUpActions: FOLLOW_UPS,
      appliedContext: { activeView: ctx.business.page.activeView },
    },
  );
}

export async function generateTalantonStoriesReportTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = talantonOnly("talanton.generateStoriesReport", ctx);
  if (blocked) return blocked;

  const scope = parseStoriesScopeArgs(args);
  scope.outputFormat = "pdf";
  const result = queryTalantonStories(scope);
  const pdfBytes = await buildTalantonStoriesReportPdf(result, ctx.business.organisation.name);
  const filename = talantonStoriesReportFilename();

  let artifact = putAssistantArtifact({
    id: createArtifactId(),
    kind: "pdf",
    title: "Impact Stories Report",
    filename,
    mimeType: "application/pdf",
    bytes: Buffer.from(pdfBytes),
    userId: ctx.business.user.id,
    meta: {
      workspaceSlug: ctx.business.workspace.slug,
      storyCount: result.rows.length,
      scope: result.scope,
    },
  });
  artifact = await persistArtifactToStorage(artifact);

  const openUrl = `/api/executive-assistant/artifacts/${artifact.id}?disposition=inline`;
  const downloadUrl = `/api/executive-assistant/artifacts/${artifact.id}?disposition=attachment`;
  const prose = `${result.prose}\n\nPDF report generated (${result.rows.length} stories).`;

  return toolOk(
    "talanton.generateStoriesReport",
    [
      {
        ...result,
        prose,
        artifactId: artifact.id,
        title: artifact.title,
        filename: artifact.filename,
        openUrl,
        downloadUrl,
        kind: "pdf",
      },
    ],
    {
      source: ["talanton:marketing-stories", "talanton:journey-stories", "assistant:stories-pdf"],
      page: 1,
      pageSize: 1,
      summary: {
        message: prose,
        storyCount: result.rows.length,
        artifactId: artifact.id,
        openUrl,
        downloadUrl,
        executed: true,
      },
      followUpActions: FOLLOW_UPS,
      appliedContext: { activeView: ctx.business.page.activeView },
    },
  );
}

export const TALANTON_EXECUTIVE_TOOL_DEFINITIONS = [
  {
    name: "talanton.getExecutiveBriefing",
    description:
      "Talanton Impact only. Chief-of-staff executive briefing across portfolio health, fund capital deployment, impact metrics, governance actions, and top risks. Use for executive briefing, organisation status, or stewardship overview.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.getOrgHealth",
    description:
      "Talanton Impact only. RAG health assessment across portfolio, funds, impact, and governance dimensions.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.queryActions",
    description:
      "Talanton Impact only. Query open, overdue, or due-this-week board/governance actions from minutes & decisions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          enum: ["overdue", "due_this_week", "by_owner", "open", "all"],
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.getBoardInsights",
    description:
      "Talanton Impact only. Board-ready insights on decisions, risks, funds, portfolio attention, and impact. Not for generating PDF board packs — use boardpack.generate for documents.",
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
          enum: [
            "decisions",
            "deteriorating",
            "improving",
            "risks",
            "funds",
            "impact",
            "portfolio",
            "governance",
            "general",
          ],
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.queryPortfolio",
    description:
      "Talanton Impact only. Live portfolio intelligence — companies requiring attention, compliance/reporting gaps, health score, recommended actions.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.queryFunds",
    description:
      "Talanton Impact only. Funds & capital overview — committed/deployed/available capital, fund list, LP stewardship metrics.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.queryImpact",
    description:
      "Talanton Impact only. Portfolio impact briefing — jobs created, people served, communities, impact health, top impact companies.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.queryStories",
    description:
      "Talanton Impact only. Query portfolio impact story submissions and journey field visits from Marketing & Stories and Journey Stories. Use for story lists, summaries, newsletter picks, and narrative briefings. For inventory PDF use talanton.generateStoriesReport; for management-lessons PDF use talanton.generateStoriesLessonsPdf.",
    parameters: {
      type: "object",
      properties: {
        companyIds: {
          type: "string",
          description: "all or omit for entire portfolio, or company id(s) when scoped",
        },
        storyTypes: {
          type: "string",
          enum: ["portfolio", "journey", "both"],
        },
        statusFilter: {
          type: "string",
          enum: ["approved_only", "include_review", "all"],
        },
        categories: {
          type: "string",
          description: "all or comma-separated impact categories",
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.generateStoriesReport",
    description:
      "Talanton Impact only. Generate a PDF inventory report listing portfolio submissions and journey visits. Use sensible defaults when companies or impact areas are not specified. Not for management lessons — use talanton.generateStoriesLessonsPdf.",
    parameters: {
      type: "object",
      properties: {
        companyIds: { type: "string" },
        storyTypes: {
          type: "string",
          enum: ["portfolio", "journey", "both"],
        },
        statusFilter: {
          type: "string",
          enum: ["approved_only", "include_review", "all"],
        },
        categories: { type: "string" },
        outputFormat: { type: "string", enum: ["pdf", "narrative", "newsletter"] },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "talanton.generateStoriesLessonsPdf",
    description:
      "Talanton Impact only. Synthesise the strongest recurring management lessons from portfolio and journey field stories, then export a branded Talanton PDF with lesson explanations and story evidence.",
    parameters: {
      type: "object",
      properties: {
        companyIds: { type: "string" },
        storyTypes: {
          type: "string",
          enum: ["portfolio", "journey", "both"],
        },
        statusFilter: {
          type: "string",
          enum: ["approved_only", "include_review", "all"],
        },
        categories: { type: "string" },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
] as const;

export const ABHI_EXECUTIVE_TOOL_DEFINITIONS = [
  {
    name: "abhi.getExecutiveBriefing",
    description:
      "ABHI only. Chief-of-staff executive briefing from membership, commercial, financial, and governance data.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.getOrgHealth",
    description: "ABHI only. Organisation health RAG assessment across financial, commercial, operational, governance.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.queryActions",
    description: "ABHI only. Query board actions (overdue, due this week, by owner, open).",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          enum: ["overdue", "due_this_week", "by_owner", "open", "all"],
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.getBoardInsights",
    description:
      "ABHI only. Board insights on decisions, risks, sponsorship, WHX, financial. Not for board pack PDF — use boardpack.generate.",
    parameters: {
      type: "object",
      properties: {
        focus: {
          type: "string",
          enum: [
            "decisions",
            "deteriorating",
            "improving",
            "risks",
            "sponsorship",
            "whx",
            "financial",
            "agenda",
            "general",
          ],
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
] as const;
