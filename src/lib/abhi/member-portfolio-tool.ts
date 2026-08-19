/**
 * ABHI member portfolio read tool — live member count and portfolio summary.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import { buildMemberIntelligencePortfolio } from "@/lib/abhi/member-intelligence";
import {
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

function abhiOnly(
  tool: string,
  ctx: AssistantToolExecutionContext,
): AssistantToolResult | null {
  if (!isAbhiSlug(ctx.business.workspace.slug)) {
    return toolForbidden(
      tool,
      "ABHI member data is only available in the ABHI workspace.",
    );
  }
  return null;
}

export async function getAbhiMemberPortfolioTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.getMemberPortfolio", ctx);
  if (blocked) return blocked;

  const portfolio = buildMemberIntelligencePortfolio([]);
  const { summary } = portfolio;

  return toolOk(
    "abhi.getMemberPortfolio",
    [
      {
        activeMembers: summary.activeMembers,
        healthyMembers: summary.healthyMembers,
        atRiskMembers: summary.atRiskMembers,
        renewalsDueIn90Days: summary.renewalsDueIn90Days,
        totalMembershipRevenueGbp: summary.totalMembershipRevenueGbp,
        averageEngagementScore: summary.averageEngagementScore,
      },
    ],
    {
      source: ["abhi:member-intelligence"],
      page: 1,
      pageSize: 1,
      summary: {
        activeMembers: summary.activeMembers,
        healthyMembers: summary.healthyMembers,
        atRiskMembers: summary.atRiskMembers,
        message: `ABHI has ${summary.activeMembers} active member organisations.`,
      },
    },
  );
}
