/**
 * OnwardAir Executive Intelligence tools.
 */

import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import {
  assessOnwardAirOrgHealth,
  buildOnwardAirBoardInsights,
  buildOnwardAirExecutiveBriefing,
  formatOnwardAirActionCentreText,
  formatOnwardAirBoardInsightsText,
  formatOnwardAirExecutiveBriefingText,
  formatOnwardAirModuleQueryText,
  formatOnwardAirOrgHealthText,
  queryOnwardAirActionCentre,
  queryOnwardAirModule,
  type OaActionCentreQuery,
  type OaBoardInsightsFocus,
  type OaModuleId,
} from "@/lib/onwardair/executive-intelligence";
import {
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function onwardAirOnly(
  tool: string,
  ctx: AssistantToolExecutionContext,
): AssistantToolResult | null {
  if (!isOnwardAirSlug(ctx.business.workspace.slug)) {
    return toolForbidden(
      tool,
      "OnwardAir Executive Intelligence is available on the OnwardAir workspace only.",
    );
  }
  return null;
}

const FOLLOW_UPS = [
  { id: "fu_oa_brief", label: "Give me an executive briefing", kind: "generate" as const },
  { id: "fu_oa_health", label: "Organisation health assessment", kind: "generate" as const },
  { id: "fu_oa_fundraising", label: "Where are we on the seed raise?", kind: "generate" as const },
  { id: "fu_oa_engineering", label: "Engineering programme status", kind: "generate" as const },
  { id: "fu_oa_pack", label: "Create a board deck for the next meeting", kind: "generate" as const },
];

function parseActionQuery(raw: string): OaActionCentreQuery {
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

function parseInsightsFocus(raw: string): OaBoardInsightsFocus {
  const value = raw.toLowerCase();
  const allowed: OaBoardInsightsFocus[] = [
    "decisions",
    "deteriorating",
    "improving",
    "risks",
    "fundraising",
    "engineering",
    "financial",
    "agenda",
    "general",
  ];
  return (allowed.find((entry) => entry === value) ?? "general") as OaBoardInsightsFocus;
}

function parseModuleId(raw: string): OaModuleId {
  const value = raw.toLowerCase() as OaModuleId;
  const allowed: OaModuleId[] = [
    "fundraising",
    "engineering",
    "board",
    "intelligence",
    "marketing",
    "operations",
    "qms",
    "technology",
    "business-central",
    "training",
    "support",
  ];
  return allowed.includes(value) ? value : "fundraising";
}

export async function getOnwardAirExecutiveBriefingTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = onwardAirOnly("onwardair.getExecutiveBriefing", ctx);
  if (blocked) return blocked;

  const brief = buildOnwardAirExecutiveBriefing();
  const prose = formatOnwardAirExecutiveBriefingText(brief);
  return toolOk("onwardair.getExecutiveBriefing", [{ ...brief, prose }], {
    source: ["onwardair:executive-intelligence", "onwardair:board-pack-model"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      organisationStatus: brief.organisationStatus,
      nextBoardMeeting: brief.nextBoardMeeting,
      riskCount: brief.risksRequiringAttention.length,
      openActionCount: brief.openActions.length,
    },
    followUpActions: FOLLOW_UPS.filter((f) => f.id !== "fu_oa_brief"),
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function getOnwardAirOrgHealthTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = onwardAirOnly("onwardair.getOrgHealth", ctx);
  if (blocked) return blocked;

  const health = assessOnwardAirOrgHealth();
  const prose = formatOnwardAirOrgHealthText(health);
  return toolOk("onwardair.getOrgHealth", [{ ...health, prose }], {
    source: ["onwardair:executive-intelligence"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      overall: health.overall,
      financial: health.dimensions.find((d) => d.id === "financial")?.status,
      programme: health.dimensions.find((d) => d.id === "programme")?.status,
      fundraising: health.dimensions.find((d) => d.id === "fundraising")?.status,
      governance: health.dimensions.find((d) => d.id === "governance")?.status,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function queryOnwardAirActionsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = onwardAirOnly("onwardair.queryActions", ctx);
  if (blocked) return blocked;

  const query = parseActionQuery(asString(args.query) || "open");
  const result = queryOnwardAirActionCentre(query);
  const prose = formatOnwardAirActionCentreText(result);
  return toolOk("onwardair.queryActions", [{ ...result, prose }], {
    source: ["onwardair:executive-intelligence", "onwardair:board-data"],
    page: 1,
    pageSize: 1,
    summary: { message: prose, query: result.query, count: result.actions.length, headline: result.headline },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function getOnwardAirBoardInsightsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = onwardAirOnly("onwardair.getBoardInsights", ctx);
  if (blocked) return blocked;

  const focus = parseInsightsFocus(asString(args.focus) || "general");
  const insights = buildOnwardAirBoardInsights(focus);
  const prose = formatOnwardAirBoardInsightsText(insights);
  return toolOk("onwardair.getBoardInsights", [{ ...insights, prose }], {
    source: ["onwardair:executive-intelligence", "onwardair:board-data"],
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

export async function queryOnwardAirModuleTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = onwardAirOnly("onwardair.queryModule", ctx);
  if (blocked) return blocked;

  const module = parseModuleId(asString(args.module) || "fundraising");
  const question = asString(args.question);
  const result = queryOnwardAirModule(module, question || undefined);
  const prose = formatOnwardAirModuleQueryText(result);
  return toolOk("onwardair.queryModule", [{ ...result, prose }], {
    source: [`onwardair:${module}`, "onwardair:executive-intelligence"],
    page: 1,
    pageSize: 1,
    summary: { message: prose, module: result.module, headline: result.headline },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export const ONWARDAIR_EXECUTIVE_TOOL_DEFINITIONS = [
  {
    name: "onwardair.getExecutiveBriefing",
    description:
      "OnwardAir only. Chief-of-staff executive briefing across financial, programme/engineering, fundraising, and governance. Use for executive briefing, organisation status, overnight summary, or what requires attention.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "onwardair.getOrgHealth",
    description:
      "OnwardAir only. RAG health assessment across financial, programme, fundraising, and governance dimensions.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "onwardair.queryActions",
    description:
      "OnwardAir only. Query open, overdue, or due-this-week board actions from board minutes.",
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
    name: "onwardair.getBoardInsights",
    description:
      "OnwardAir only. Board-ready insights on decisions, risks, fundraising, engineering, and financial topics. Not for board deck PDF — use boardpack.generate.",
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
            "fundraising",
            "engineering",
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
  {
    name: "onwardair.queryModule",
    description:
      "OnwardAir only. Live read of a workspace module: fundraising, engineering, board, intelligence (competitors/IP), marketing, operations, qms, technology, business-central, training, support. Use for seed raise, VTOL milestones, competitor intel, pipeline, etc.",
    parameters: {
      type: "object",
      properties: {
        module: {
          type: "string",
          enum: [
            "fundraising",
            "engineering",
            "board",
            "intelligence",
            "marketing",
            "operations",
            "qms",
            "technology",
            "business-central",
            "training",
            "support",
          ],
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
] as const;
