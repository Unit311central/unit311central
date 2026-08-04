/**
 * ABHI Executive Intelligence intents — analysis before document generation.
 */

import type {
  AbhiActionCentreQuery,
  AbhiBoardInsightsFocus,
} from "@/lib/abhi/executive-intelligence";

export type AbhiExecutiveIntelligenceTool =
  | "abhi.getExecutiveBriefing"
  | "abhi.getOrgHealth"
  | "abhi.queryActions"
  | "abhi.getBoardInsights";

export type AbhiExecutiveIntelligenceIntent = {
  tool: AbhiExecutiveIntelligenceTool;
  args: Record<string, unknown>;
  reason: string;
};

function isDocumentGenerateAsk(lower: string) {
  return (
    /\b(create|generate|prepare|build|make|produce|draft|assemble|export)\b/.test(lower) &&
    /\b(board\s+pack|board\s+deck|board\s+papers?|powerpoint|pptx|pdf)\b/.test(lower)
  );
}

/**
 * Resolve ABHI analysis intents. Returns null for document-generation asks
 * so boardpack.generate can handle those separately.
 */
export function resolveAbhiExecutiveIntelligenceIntent(
  message: string,
): AbhiExecutiveIntelligenceIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  // Never steal explicit pack/document generation.
  if (isDocumentGenerateAsk(lower)) return null;

  // —— Executive Briefing ——
  if (
    /\bexecutive\s+briefing\b/.test(lower) ||
    /\b(give|get|provide|prepare|show|send)\s+(me\s+)?(an?\s+)?(executive\s+)?briefing\b/.test(
      lower,
    ) ||
    /\bchief\s+of\s+staff\s+brief(ing)?\b/.test(lower) ||
    /\borganisation\s+status\b/.test(lower) ||
    /\borganization\s+status\b/.test(lower)
  ) {
    return {
      tool: "abhi.getExecutiveBriefing",
      args: { question: text },
      reason: "abhi_executive_briefing",
    };
  }

  // —— Organisation Health ——
  if (
    /\b(org(anisational|anizational)?\s+health|organisation\s+health|organization\s+health|rag\s+(status|rating|assessment)|health\s+assessment)\b/.test(
      lower,
    ) ||
    /\b(red|amber|green)\b/.test(lower) &&
      /\b(financial|commercial|operational|governance|overall|health)\b/.test(lower)
  ) {
    return {
      tool: "abhi.getOrgHealth",
      args: { question: text },
      reason: "abhi_org_health",
    };
  }

  // —— Action Centre ——
  const actionQuery = resolveActionQuery(lower);
  if (actionQuery) {
    return {
      tool: "abhi.queryActions",
      args: { query: actionQuery, question: text },
      reason: `abhi_action_centre_${actionQuery}`,
    };
  }

  // —— Board Insights / executive Q&A ——
  const focus = resolveInsightsFocus(lower);
  if (focus) {
    return {
      tool: "abhi.getBoardInsights",
      args: { focus, question: text },
      reason: `abhi_board_insights_${focus}`,
    };
  }

  return null;
}

function resolveActionQuery(lower: string): AbhiActionCentreQuery | null {
  if (
    /\b(who\s+owns\s+the\s+most|owns\s+the\s+most\s+actions|action\s+owners?|ownership\s+of\s+actions)\b/.test(
      lower,
    )
  ) {
    return "by_owner";
  }
  if (
    /\b(actions?\s+overdue|overdue\s+actions?|which\s+actions?\s+are\s+overdue|what\s+actions?\s+are\s+overdue)\b/.test(
      lower,
    )
  ) {
    return "overdue";
  }
  if (
    /\b(actions?\s+due\s+(this|next)\s+week|due\s+(this|next)\s+week|what\s+actions?\s+are\s+due)\b/.test(
      lower,
    )
  ) {
    return "due_this_week";
  }
  if (
    /\baction\s+centre\b|\baction\s+center\b|\bopen\s+actions?\b|\boutstanding\s+actions?\b|\bboard\s+actions?\b/.test(
      lower,
    ) &&
    !/\b(pack|deck|papers?|presentation)\b/.test(lower)
  ) {
    return "open";
  }
  return null;
}

function resolveInsightsFocus(lower: string): AbhiBoardInsightsFocus | null {
  if (
    /\b(decisions?\s+(require|needed|likely)|board\s+decisions?|what\s+decisions?|decisions?\s+at\s+the\s+next\s+board)\b/.test(
      lower,
    )
  ) {
    return "decisions";
  }
  if (
    /\b(deteriorating|deteriorate[sd]?|worsening|worsen(ed|ing)?|getting\s+worse|trending\s+up)\b/.test(
      lower,
    )
  ) {
    return "deteriorating";
  }
  if (
    /\b(improved|improving|improvement|getting\s+better|trending\s+down|issues?\s+have\s+improved)\b/.test(
      lower,
    )
  ) {
    return "improving";
  }
  if (
    /\b(biggest\s+risks?|top\s+risks?|three\s+biggest\s+risks?|risks?\s+facing\s+abhi|what\s+are\s+the\s+.*risks?)\b/.test(
      lower,
    )
  ) {
    return "risks";
  }
  if (/\bsponsorship\b/.test(lower)) {
    return "sponsorship";
  }
  if (/\bwhx\b|\bpavilion\b/.test(lower)) {
    return "whx";
  }
  if (
    /\b(summarise|summarize)\s+financial|financial\s+performance|how\s+are\s+(we|finances?)\b|\bfinancial\s+summary\b/.test(
      lower,
    )
  ) {
    return "financial";
  }
  if (
    /\b(board\s+discuss|should\s+the\s+board|next\s+month|next\s+board\s+meeting|board\s+agenda|what\s+should\s+the\s+board)\b/.test(
      lower,
    )
  ) {
    return "agenda";
  }
  if (
    /\bboard\s+insights?\b|\bexecutive\s+insights?\b|\bwhat\s+requires?\s+attention\b/.test(lower) ||
    (/\b(abhi|board|organisation|organization)\b/.test(lower) &&
      /\b(risk|status|performance|attention|outlook)\b/.test(lower) &&
      !/\b(pack|deck|papers?|presentation|pdf)\b/.test(lower))
  ) {
    return "general";
  }
  return null;
}
