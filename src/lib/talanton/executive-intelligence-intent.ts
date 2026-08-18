/**
 * Talanton Executive Intelligence intents — analysis before document generation.
 */

import type {
  TalantonActionCentreQuery,
  TalantonBoardInsightsFocus,
} from "@/lib/talanton/executive-intelligence";

export type TalantonExecutiveIntelligenceTool =
  | "talanton.getExecutiveBriefing"
  | "talanton.getOrgHealth"
  | "talanton.queryActions"
  | "talanton.getBoardInsights"
  | "talanton.queryPortfolio"
  | "talanton.queryFunds"
  | "talanton.queryImpact";

export type TalantonExecutiveIntelligenceIntent = {
  tool: TalantonExecutiveIntelligenceTool;
  args: Record<string, unknown>;
  reason: string;
};

function isDocumentGenerateAsk(lower: string) {
  if (
    /\b(create|generate|prepare|build|make|produce|draft|assemble|export|give\s+me)\b/.test(lower) &&
    /\b(report|pdf|document)\b/.test(lower) &&
    /\b(impact|portfolio|journey|field)?\s*stor(y|ies)\b/.test(lower)
  ) {
    return true;
  }
  return (
    /\b(create|generate|prepare|build|make|produce|draft|assemble|export)\b/.test(lower) &&
    /\b(board\s+pack|board\s+deck|board\s+papers?|powerpoint|pptx|pdf|quarterly\s+portfolio|annual\s+impact)\b/.test(
      lower,
    )
  );
}

function resolveActionQuery(lower: string): TalantonActionCentreQuery | null {
  if (
    /\b(who\s+owns\s+the\s+most|owns\s+the\s+most\s+actions|action\s+owners?|ownership\s+of\s+actions)\b/.test(
      lower,
    )
  ) {
    return "by_owner";
  }
  if (/\boverdue\b/.test(lower) && /\baction/.test(lower)) return "overdue";
  if (/\bdue\s+this\s+week\b/.test(lower) && /\baction/.test(lower)) return "due_this_week";
  if (/\bby\s+owner\b/.test(lower) && /\baction/.test(lower)) return "by_owner";
  if (/\bopen\s+actions?\b/.test(lower) || /\bboard\s+actions?\b/.test(lower)) return "open";
  return null;
}

function resolveInsightsFocus(lower: string): TalantonBoardInsightsFocus | null {
  if (/\bdecision/.test(lower)) return "decisions";
  if (/\bdeteriorat|watch\s+list|requires?\s+attention\b/.test(lower)) return "deteriorating";
  if (/\bimprov/.test(lower)) return "improving";
  if (/\brisk/.test(lower)) return "risks";
  if (/\bfund|capital|deployment|lp\b/.test(lower)) return "funds";
  if (/\bimpact|jobs\s+created|people\s+served|communities\b/.test(lower)) return "impact";
  if (/\bportfolio|holdings|companies\b/.test(lower)) return "portfolio";
  if (/\bgovernance|minutes|decisions\b/.test(lower)) return "governance";
  return null;
}

export function resolveTalantonExecutiveIntelligenceIntent(
  message: string,
): TalantonExecutiveIntelligenceIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (isDocumentGenerateAsk(lower)) return null;

  if (
    /\bexecutive\s+briefing\b/.test(lower) ||
    /\b(give|get|provide|prepare|show|send)\s+(me\s+)?(an?\s+)?(executive\s+)?briefing\b/.test(lower) ||
    /\bchief\s+of\s+staff\s+brief(ing)?\b/.test(lower) ||
    /\bportfolio\s+stewardship\s+status\b/.test(lower)
  ) {
    return {
      tool: "talanton.getExecutiveBriefing",
      args: { question: text },
      reason: "talanton_executive_briefing",
    };
  }

  if (
    /\b(org(anisational|anizational)?\s+health|organisation\s+health|organization\s+health|health\s+assessment)\b/.test(
      lower,
    ) ||
    (/\b(red|amber|green)\b/.test(lower) &&
      /\b(portfolio|funds|impact|governance|overall|health)\b/.test(lower))
  ) {
    return {
      tool: "talanton.getOrgHealth",
      args: { question: text },
      reason: "talanton_org_health",
    };
  }

  const actionQuery = resolveActionQuery(lower);
  if (actionQuery) {
    return {
      tool: "talanton.queryActions",
      args: { query: actionQuery, question: text },
      reason: "talanton_action_centre",
    };
  }

  if (
    /\bportfolio\s+intelligence\b/.test(lower) ||
    /\bwhat\s+requires?\s+attention\s+across\s+the\s+portfolio\b/.test(lower) ||
    /\bcompanies\s+requiring\s+attention\b/.test(lower) ||
    /\bportfolio\s+health\b/.test(lower)
  ) {
    return {
      tool: "talanton.queryPortfolio",
      args: { question: text },
      reason: "talanton_portfolio_query",
    };
  }

  if (
    /\bfunds?\s+(overview|summary|performance|deployment)\b/.test(lower) ||
    /\bfund\s+capital\b/.test(lower) ||
    /\bcapital\s+(committed|deployed|available|deployment)\b/.test(lower) ||
    /\blp\s+(update|reporting)\b/.test(lower)
  ) {
    return {
      tool: "talanton.queryFunds",
      args: { question: text },
      reason: "talanton_funds_query",
    };
  }

  if (
    /\bimpact\s+(briefing|intelligence|dashboard|health)\b/.test(lower) ||
    /\bjobs\s+created\b/.test(lower) ||
    /\bpeople\s+served\b/.test(lower) ||
    /\bimpact\s+metrics\b/.test(lower)
  ) {
    return {
      tool: "talanton.queryImpact",
      args: { question: text },
      reason: "talanton_impact_query",
    };
  }

  const focus = resolveInsightsFocus(lower);
  if (
    focus ||
    /\bboard\s+insights?\b/.test(lower) ||
    /\bwhat\s+should\s+the\s+board\s+discuss\b/.test(lower) ||
    /\bboard\s+discussion\b/.test(lower)
  ) {
    return {
      tool: "talanton.getBoardInsights",
      args: { focus: focus ?? "general", question: text },
      reason: "talanton_board_insights",
    };
  }

  return null;
}
