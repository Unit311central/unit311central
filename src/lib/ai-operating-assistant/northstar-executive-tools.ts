/**
 * Northstar Demo — Executive Intelligence EA tools.
 */

import {
  assessNorthstarOrgHealth,
  buildNorthstarBoardInsights,
  buildNorthstarExecutiveBriefing,
  formatNorthstarActionCentreText,
  formatNorthstarBoardInsightsText,
  formatNorthstarExecutiveBriefingText,
  formatNorthstarModuleQueryText,
  formatNorthstarOrgHealthText,
  queryNorthstarActionCentre,
  queryNorthstarModule,
  type NorthstarActionCentreQuery,
  type NorthstarBoardInsightsFocus,
  type NorthstarModuleId,
} from "@/lib/demo/executive-intelligence";
import { isNorthstarDemoSlug } from "@/lib/demo/northstar-surface";
import {
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function northstarOnly(
  tool: string,
  ctx: AssistantToolExecutionContext,
): AssistantToolResult | null {
  if (!isNorthstarDemoSlug(ctx.business.workspace.slug)) {
    return toolForbidden(
      tool,
      "Northstar Executive Intelligence is available on the Northstar demo workspace only.",
    );
  }
  return null;
}

const FOLLOW_UPS = [
  { id: "fu_nst_brief", label: "Give me an executive briefing", kind: "generate" as const },
  { id: "fu_nst_health", label: "Organisation health assessment", kind: "generate" as const },
  { id: "fu_nst_sheffield", label: "Which customers are at risk?", kind: "generate" as const },
  { id: "fu_nst_atlas", label: "Atlas programme status", kind: "generate" as const },
  { id: "fu_nst_pack", label: "Create a board pack for the next meeting", kind: "generate" as const },
];

function parseActionQuery(raw: string): NorthstarActionCentreQuery {
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

function parseInsightsFocus(raw: string): NorthstarBoardInsightsFocus {
  const value = raw.toLowerCase();
  const allowed: NorthstarBoardInsightsFocus[] = [
    "decisions",
    "deteriorating",
    "improving",
    "risks",
    "financial",
    "engineering",
    "clients",
    "agenda",
    "general",
  ];
  return (allowed.find((entry) => entry === value) ?? "general") as NorthstarBoardInsightsFocus;
}

function parseModuleId(raw: string): NorthstarModuleId {
  const value = raw.toLowerCase() as NorthstarModuleId;
  const allowed: NorthstarModuleId[] = [
    "financials",
    "engineering",
    "fundraising",
    "board",
    "intelligence",
    "clients",
    "grants",
    "support",
    "qms",
  ];
  return allowed.includes(value) ? value : "intelligence";
}

export async function getNorthstarExecutiveBriefingTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = northstarOnly("northstar.getExecutiveBriefing", ctx);
  if (blocked) return blocked;
  const briefing = buildNorthstarExecutiveBriefing();
  const prose = formatNorthstarExecutiveBriefingText(briefing);
  return toolOk("northstar.getExecutiveBriefing", [{ ...briefing, prose }], {
    source: ["northstar:executive-intelligence", "northstar:financial-model", "northstar:intelligence"],
    pageSize: 1,
    summary: { message: prose },
    followUpActions: FOLLOW_UPS,
  });
}

export async function getNorthstarOrgHealthTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = northstarOnly("northstar.getOrgHealth", ctx);
  if (blocked) return blocked;
  const health = assessNorthstarOrgHealth();
  const prose = formatNorthstarOrgHealthText(health);
  return toolOk("northstar.getOrgHealth", [{ ...health, prose }], {
    source: ["northstar:executive-intelligence"],
    pageSize: 1,
    summary: { message: prose },
    followUpActions: FOLLOW_UPS,
  });
}

export async function queryNorthstarActionsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = northstarOnly("northstar.queryActions", ctx);
  if (blocked) return blocked;
  const query = parseActionQuery(asString(args.query) || "open");
  const result = queryNorthstarActionCentre(query);
  const prose = formatNorthstarActionCentreText(result);
  return toolOk("northstar.queryActions", [{ ...result, prose }], {
    source: ["northstar:board-data"],
    pageSize: result.actions.length || 1,
    summary: { message: prose, query },
    followUpActions: FOLLOW_UPS,
  });
}

export async function getNorthstarBoardInsightsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = northstarOnly("northstar.getBoardInsights", ctx);
  if (blocked) return blocked;
  const focus = parseInsightsFocus(asString(args.focus) || "general");
  const insights = buildNorthstarBoardInsights(focus);
  const prose = formatNorthstarBoardInsightsText(insights);
  return toolOk("northstar.getBoardInsights", [{ ...insights, prose }], {
    source: ["northstar:board-data", "northstar:executive-intelligence"],
    pageSize: 1,
    summary: { message: prose, focus },
    followUpActions: FOLLOW_UPS,
  });
}

export async function queryNorthstarModuleTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = northstarOnly("northstar.queryModule", ctx);
  if (blocked) return blocked;
  const moduleId = parseModuleId(asString(args.module) || "intelligence");
  const question = asString(args.question);
  const result = queryNorthstarModule(moduleId, question || undefined);
  const prose = formatNorthstarModuleQueryText(result);
  return toolOk("northstar.queryModule", [{ ...result, prose }], {
    source: [`northstar:module:${moduleId}`],
    pageSize: result.bullets.length || 1,
    summary: { message: prose, module: moduleId },
    followUpActions: FOLLOW_UPS,
  });
}

export const NORTHSTAR_EXECUTIVE_TOOL_DEFINITIONS = [
  {
    name: "northstar.getExecutiveBriefing",
    description:
      "Northstar only. Chief-of-staff executive briefing across financial, commercial, delivery, and governance. Use for executive briefing, organisation status, margin questions, funding history, or what requires attention.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "northstar.getOrgHealth",
    description:
      "Northstar only. RAG health assessment across financial, commercial, operational/delivery, and governance dimensions.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "northstar.queryActions",
    description:
      "Northstar only. Query open, overdue, or due-this-week board actions from board minutes.",
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
    name: "northstar.getBoardInsights",
    description:
      "Northstar only. Board-ready insights on decisions, risks, financial, engineering, and client topics. Not for board deck PDF — use boardpack.generate.",
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
            "financial",
            "engineering",
            "clients",
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
    name: "northstar.queryModule",
    description:
      "Northstar only. Live read of a workspace module: financials, engineering, fundraising, grants, board, intelligence, clients, support, qms. Use for Atlas, Sheffield, Voltex, margin, seed round, grants, pipeline, etc.",
    parameters: {
      type: "object",
      properties: {
        module: {
          type: "string",
          enum: [
            "financials",
            "engineering",
            "fundraising",
            "board",
            "intelligence",
            "clients",
            "grants",
            "support",
            "qms",
          ],
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];
