/**
 * ABHI Executive Intelligence tools — briefing, org health, actions, board insights.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import {
  assessAbhiOrgHealth,
  buildAbhiBoardInsights,
  buildAbhiExecutiveBriefing,
  formatAbhiActionCentreText,
  formatAbhiBoardInsightsText,
  formatAbhiExecutiveBriefingText,
  formatAbhiOrgHealthText,
  queryAbhiActionCentre,
  type AbhiActionCentreQuery,
  type AbhiBoardInsightsFocus,
} from "@/lib/abhi/executive-intelligence";
import {
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function abhiOnly(
  tool: string,
  ctx: AssistantToolExecutionContext,
): AssistantToolResult | null {
  if (!isAbhiSlug(ctx.business.workspace.slug)) {
    return toolForbidden(tool, "ABHI Executive Intelligence is available on the ABHI workspace only.");
  }
  return null;
}

const FOLLOW_UPS = [
  { id: "fu_abhi_brief", label: "Give me an executive briefing", kind: "generate" as const },
  { id: "fu_abhi_health", label: "Organisation health assessment", kind: "generate" as const },
  { id: "fu_abhi_overdue", label: "What actions are overdue?", kind: "generate" as const },
  { id: "fu_abhi_pack", label: "Create a board pack for the next meeting", kind: "generate" as const },
];

export async function getAbhiExecutiveBriefingTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.getExecutiveBriefing", ctx);
  if (blocked) return blocked;

  const brief = buildAbhiExecutiveBriefing();
  const prose = formatAbhiExecutiveBriefingText(brief);
  return toolOk("abhi.getExecutiveBriefing", [{ ...brief, prose }], {
    source: ["abhi:executive-intelligence", "abhi:board-pack-model", "abhi:board-meetings"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      organisationStatus: brief.organisationStatus,
      nextBoardMeeting: brief.nextBoardMeeting,
      riskCount: brief.risksRequiringAttention.length,
      openActionCount: brief.openActions.length,
    },
    followUpActions: FOLLOW_UPS.filter((f) => f.id !== "fu_abhi_brief"),
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

export async function getAbhiOrgHealthTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.getOrgHealth", ctx);
  if (blocked) return blocked;

  const health = assessAbhiOrgHealth();
  const prose = formatAbhiOrgHealthText(health);
  return toolOk("abhi.getOrgHealth", [{ ...health, prose }], {
    source: ["abhi:executive-intelligence", "abhi:board-pack-model"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      overall: health.overall,
      financial: health.dimensions.find((d) => d.id === "financial")?.status,
      commercial: health.dimensions.find((d) => d.id === "commercial")?.status,
      operational: health.dimensions.find((d) => d.id === "operational")?.status,
      governance: health.dimensions.find((d) => d.id === "governance")?.status,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

function parseActionQuery(raw: string): AbhiActionCentreQuery {
  const value = raw.toLowerCase();
  if (value === "overdue" || value === "due_this_week" || value === "by_owner" || value === "open" || value === "all") {
    return value;
  }
  return "open";
}

export async function queryAbhiActionsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.queryActions", ctx);
  if (blocked) return blocked;

  const query = parseActionQuery(asString(args.query) || "open");
  const result = queryAbhiActionCentre(query);
  const prose = formatAbhiActionCentreText(result);
  return toolOk("abhi.queryActions", [{ ...result, prose }], {
    source: ["abhi:executive-intelligence", "abhi:board-meetings"],
    page: 1,
    pageSize: 1,
    summary: {
      message: prose,
      query: result.query,
      count: result.actions.length,
      headline: result.headline,
    },
    followUpActions: FOLLOW_UPS,
    appliedContext: { activeView: ctx.business.page.activeView },
  });
}

function parseInsightsFocus(raw: string): AbhiBoardInsightsFocus {
  const value = raw.toLowerCase();
  const allowed: AbhiBoardInsightsFocus[] = [
    "decisions",
    "deteriorating",
    "improving",
    "risks",
    "sponsorship",
    "whx",
    "financial",
    "agenda",
    "general",
  ];
  return (allowed.find((entry) => entry === value) ?? "general") as AbhiBoardInsightsFocus;
}

export async function getAbhiBoardInsightsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.getBoardInsights", ctx);
  if (blocked) return blocked;

  const focus = parseInsightsFocus(asString(args.focus) || "general");
  const insights = buildAbhiBoardInsights(focus);
  const prose = formatAbhiBoardInsightsText(insights);
  return toolOk("abhi.getBoardInsights", [{ ...insights, prose }], {
    source: ["abhi:executive-intelligence", "abhi:board-pack-model", "abhi:risk-register"],
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
