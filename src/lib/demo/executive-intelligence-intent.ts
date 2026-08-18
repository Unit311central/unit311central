/**
 * Northstar Demo — Executive Intelligence intents (route NL to northstar.* tools).
 */

import type {
  NorthstarActionCentreQuery,
  NorthstarBoardInsightsFocus,
} from "@/lib/demo/executive-intelligence";
import {
  resolveNorthstarModuleId,
  type NorthstarModuleId,
} from "@/lib/demo/northstar-module-id";

export type NorthstarExecutiveIntelligenceTool =
  | "northstar.getExecutiveBriefing"
  | "northstar.getOrgHealth"
  | "northstar.queryActions"
  | "northstar.getBoardInsights"
  | "northstar.queryModule";

export type NorthstarExecutiveIntelligenceIntent = {
  tool: NorthstarExecutiveIntelligenceTool;
  args: Record<string, unknown>;
  reason: string;
};

function isDocumentGenerateAsk(lower: string) {
  return (
    /\b(create|generate|prepare|build|make|produce|draft|assemble|export)\b/.test(lower) &&
    /\b(board\s+pack|board\s+deck|board\s+papers?|powerpoint|pptx|pdf)\b/.test(lower)
  );
}

export function resolveNorthstarExecutiveIntelligenceIntent(
  message: string,
): NorthstarExecutiveIntelligenceIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (isDocumentGenerateAsk(lower)) return null;

  if (
    /\b(year\s+by\s+year|yoy|year-on-year|growth|graph|chart|trend)\b/.test(lower) &&
    /\b(staff|headcount|employee|people|fte|location|office|hiring)\b/.test(lower)
  ) {
    return {
      tool: "northstar.queryModule",
      args: { module: "hr", question: text, focus: "headcount_growth" },
      reason: "northstar_hr_headcount_growth",
    };
  }

  if (
    /\bexecutive\s+briefing\b/.test(lower) ||
    /\b(give|get|provide|prepare|show|send)\s+(me\s+)?(an?\s+)?(executive\s+)?briefing\b/.test(
      lower,
    ) ||
    /\bchief\s+of\s+staff\s+brief(ing)?\b/.test(lower) ||
    /\borganisation\s+status\b/.test(lower) ||
    /\borganization\s+status\b/.test(lower) ||
    /\bwhat\s+happened\s+overnight\b/.test(lower) ||
    /\bwhat\s+requires\s+my\s+attention\b/.test(lower) ||
    /\bwhy\s+did\s+margin\s+fall\b/.test(lower) ||
    /\bsummarise\s+our\s+funding\s+history\b/.test(lower)
  ) {
    return {
      tool: "northstar.getExecutiveBriefing",
      args: { question: text },
      reason: "northstar_executive_briefing",
    };
  }

  if (
    /\b(org(anisational|anizational)?\s+health|organisation\s+health|organization\s+health|rag\s+(status|rating|assessment)|health\s+assessment|executive\s+health)\b/.test(
      lower,
    ) ||
    (/\b(red|amber|green)\b/.test(lower) &&
      /\b(financial|commercial|operational|delivery|governance|overall|health)\b/.test(lower))
  ) {
    return {
      tool: "northstar.getOrgHealth",
      args: { question: text },
      reason: "northstar_org_health",
    };
  }

  const actionQuery = resolveActionQuery(lower);
  if (actionQuery) {
    return {
      tool: "northstar.queryActions",
      args: { query: actionQuery, question: text },
      reason: `northstar_action_centre_${actionQuery}`,
    };
  }

  const focus = resolveInsightsFocus(lower);
  if (focus) {
    return {
      tool: "northstar.getBoardInsights",
      args: { focus, question: text },
      reason: `northstar_board_insights_${focus}`,
    };
  }

  if (
    /\b(which\s+customers?\s+are\s+at\s+risk|customers?\s+at\s+risk|sheffield|atlas\s+delay|voltex)\b/.test(
      lower,
    )
  ) {
    const mod = resolveNorthstarModuleId(lower) ?? ("clients" as NorthstarModuleId);
    return {
      tool: "northstar.queryModule",
      args: { module: mod, question: text },
      reason: `northstar_risk_query_${mod}`,
    };
  }

  if (
    /\b(engineering|atlas|fundraising|margin|sheffield|grants?)\b/.test(lower) &&
    /\b(status|summary|update|over\s+budget|pipeline|position)\b/.test(lower)
  ) {
    const mod = resolveNorthstarModuleId(lower) ?? ("engineering" as NorthstarModuleId);
    return {
      tool: "northstar.queryModule",
      args: { module: mod, question: text },
      reason: `northstar_module_status_${mod}`,
    };
  }

  const moduleId = resolveNorthstarModuleId(lower);
  if (moduleId) {
    return {
      tool: "northstar.queryModule",
      args: { module: moduleId, question: text },
      reason: `northstar_module_${moduleId}`,
    };
  }

  if (
    /\b(atlas|sheffield|voltex|seed\s+round|margin|grants?|senseforge|board\s+action)\b/.test(lower)
  ) {
    const mod = resolveNorthstarModuleId(lower) ?? ("intelligence" as NorthstarModuleId);
    return {
      tool: "northstar.queryModule",
      args: { module: mod, question: text },
      reason: "northstar_module_fallback",
    };
  }

  return null;
}

function resolveActionQuery(lower: string): NorthstarActionCentreQuery | null {
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

function resolveInsightsFocus(lower: string): NorthstarBoardInsightsFocus | null {
  const boardCtx = /\bboard\b/.test(lower);
  if (
    /\b(board\s+insights?|board\s+discussion|strategic\s+discussion)\b/.test(lower) ||
    (boardCtx && /\b(risks?|decisions?|agenda|financial|engineering|clients?)\b/.test(lower))
  ) {
    if (/\bengineering|atlas|voltex|delivery\b/.test(lower)) return "engineering";
    if (/\bfinancial|margin|cash|revenue\b/.test(lower)) return "financial";
    if (/\bclient|sheffield|commercial|renewal\b/.test(lower)) return "clients";
    if (/\brisks?\b/.test(lower)) return "risks";
    if (/\bdecisions?\b/.test(lower)) return "decisions";
    if (/\bagenda\b/.test(lower)) return "agenda";
    return "general";
  }
  if (/\b(top\s+risks?|biggest\s+risks?)\b/.test(lower)) return "risks";
  return null;
}
