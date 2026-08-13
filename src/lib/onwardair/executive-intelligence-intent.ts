/**
 * OnwardAir Executive Intelligence intents — route NL to onwardair.* tools.
 */

import type {
  OaActionCentreQuery,
  OaBoardInsightsFocus,
  OaModuleId,
} from "@/lib/onwardair/executive-intelligence";
import { resolveOnwardAirModuleId } from "@/lib/onwardair/executive-intelligence";

export type OnwardAirExecutiveIntelligenceTool =
  | "onwardair.getExecutiveBriefing"
  | "onwardair.getOrgHealth"
  | "onwardair.queryActions"
  | "onwardair.getBoardInsights"
  | "onwardair.queryModule";

export type OnwardAirExecutiveIntelligenceIntent = {
  tool: OnwardAirExecutiveIntelligenceTool;
  args: Record<string, unknown>;
  reason: string;
};

function isDocumentGenerateAsk(lower: string) {
  return (
    /\b(create|generate|prepare|build|make|produce|draft|assemble|export)\b/.test(lower) &&
    /\b(board\s+pack|board\s+deck|board\s+papers?|powerpoint|pptx|pdf)\b/.test(lower)
  );
}

export function resolveOnwardAirExecutiveIntelligenceIntent(
  message: string,
): OnwardAirExecutiveIntelligenceIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (isDocumentGenerateAsk(lower)) return null;

  if (
    /\bexecutive\s+briefing\b/.test(lower) ||
    /\b(give|get|provide|prepare|show|send)\s+(me\s+)?(an?\s+)?(executive\s+)?briefing\b/.test(
      lower,
    ) ||
    /\bchief\s+of\s+staff\s+brief(ing)?\b/.test(lower) ||
    /\borganisation\s+status\b/.test(lower) ||
    /\borganization\s+status\b/.test(lower) ||
    /\bwhat\s+happened\s+overnight\b/.test(lower) ||
    /\bwhat\s+requires\s+my\s+attention\b/.test(lower)
  ) {
    return {
      tool: "onwardair.getExecutiveBriefing",
      args: { question: text },
      reason: "onwardair_executive_briefing",
    };
  }

  if (
    /\b(org(anisational|anizational)?\s+health|organisation\s+health|organization\s+health|rag\s+(status|rating|assessment)|health\s+assessment)\b/.test(
      lower,
    ) ||
    (/\b(red|amber|green)\b/.test(lower) &&
      /\b(financial|programme|program|fundraising|governance|overall|health)\b/.test(lower))
  ) {
    return {
      tool: "onwardair.getOrgHealth",
      args: { question: text },
      reason: "onwardair_org_health",
    };
  }

  const actionQuery = resolveActionQuery(lower);
  if (actionQuery) {
    return {
      tool: "onwardair.queryActions",
      args: { query: actionQuery, question: text },
      reason: `onwardair_action_centre_${actionQuery}`,
    };
  }

  const focus = resolveInsightsFocus(lower);
  if (focus) {
    return {
      tool: "onwardair.getBoardInsights",
      args: { focus, question: text },
      reason: `onwardair_board_insights_${focus}`,
    };
  }

  if (
    /\bengineering\b/.test(lower) &&
    /\b(issue|issues|risk|risks|priorit|concern|summary|executive)\b/.test(lower)
  ) {
    return {
      tool: "onwardair.queryModule",
      args: { module: "engineering", question: text },
      reason: "onwardair_engineering_executive",
    };
  }

  if (
    /\b(fundraising|seed\s+raise|investor|capital)\b/.test(lower) &&
    /\b(issue|issues|risk|risks|priorit|concern|summary|executive)\b/.test(lower)
  ) {
    return {
      tool: "onwardair.queryModule",
      args: { module: "fundraising", question: text },
      reason: "onwardair_fundraising_executive",
    };
  }

  const moduleId = resolveOnwardAirModuleId(lower);
  if (moduleId) {
    return {
      tool: "onwardair.queryModule",
      args: { module: moduleId, question: text },
      reason: `onwardair_module_${moduleId}`,
    };
  }

  if (
    /\b(seed\s+raise|fundraising|investor\s+pipeline|vtol|flex\s+pod|engineering\s+risk|competitor|board\s+action)\b/.test(
      lower,
    )
  ) {
    const mod = resolveOnwardAirModuleId(lower) ?? ("fundraising" as OaModuleId);
    return {
      tool: "onwardair.queryModule",
      args: { module: mod, question: text },
      reason: "onwardair_module_fallback",
    };
  }

  return null;
}

function resolveActionQuery(lower: string): OaActionCentreQuery | null {
  if (
    /\b(who\s+owns\s+the\s+most|owns\s+the\s+most\s+actions|action\s+owners?)\b/.test(lower)
  ) {
    return "by_owner";
  }
  if (/\b(actions?\s+overdue|overdue\s+actions?|which\s+actions?\s+are\s+overdue)\b/.test(lower)) {
    return "overdue";
  }
  if (/\b(actions?\s+due\s+(this|next)\s+week|due\s+(this|next)\s+week)\b/.test(lower)) {
    return "due_this_week";
  }
  if (/\b(open\s+board\s+actions?|board\s+actions?)\b/.test(lower)) {
    return "open";
  }
  return null;
}

function resolveInsightsFocus(lower: string): OaBoardInsightsFocus | null {
  const boardCtx = /\bboard\b/.test(lower);
  if (
    /\b(board\s+insights?|board\s+discussion|strategic\s+discussion)\b/.test(lower) ||
    (boardCtx && /\b(agenda|discussion\s+topics?)\b/.test(lower))
  ) {
    if (/\bfundraising|seed|capital/i.test(lower)) return "fundraising";
    if (/\bengineering|certification|vtol/i.test(lower)) return "engineering";
    if (/\bfinancial|cash|burn/i.test(lower)) return "financial";
    return "agenda";
  }
  if (boardCtx && /\b(risks?|risk\s+register|top\s+risks?)\b/.test(lower)) return "risks";
  if (boardCtx && /\b(decisions?\s+required|decisions?\s+needed)\b/.test(lower)) return "decisions";
  return null;
}
