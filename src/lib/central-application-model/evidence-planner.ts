/**
 * Evidence planning for strategic GPT reasoning — no tool execution imports.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { EaEvidencePlan } from "./types";
import { scoreSemanticOverlap } from "./semantic-text";

const STRATEGIC_KEYWORDS = [
  "what happens if",
  "what would happen",
  "ramifications",
  "increase revenue",
  "reduce burn",
  "underperforming",
  "becoming risky",
  "how can i",
  "how do i",
  "what should we",
  "recommend",
  "strategy",
  "scenario",
];

function pushTool(
  plan: EaEvidencePlan,
  tool: EaEvidencePlan["tools"][number]["tool"],
  args: Record<string, unknown>,
  capabilityId?: string,
) {
  plan.tools.push({ tool, args });
  if (capabilityId && !plan.capabilityIds.includes(capabilityId)) {
    plan.capabilityIds.push(capabilityId);
  }
}

export function planCrossModuleEvidence(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const lower = message.toLowerCase();

  const mentionsSales = /\b(sales|selling|pipeline|deals?|crm)\b/.test(lower);
  const mentionsRevenue = /\b(revenue|income|earnings|turnover)\b/.test(lower);
  const mentionsClients = /\b(clients?|customers?)\b/.test(lower);
  const mentionsOwe = /\b(owe|owing|outstanding|overdue|receivable|ar\b)\b/.test(lower);
  const mentionsSupport = /\b(support|tickets?|help\s+desk)\b/.test(lower);
  const crossVerb = /\b(affect|affecting|affects|impact|impacting|relate|drive|influence|connect|link|between)\b/.test(
    lower,
  );

  if (mentionsSales && mentionsRevenue && crossVerb) {
    const plan: EaEvidencePlan = {
      capabilityIds: [],
      tools: [],
      reasoningGoal: message,
      permissionsRequired: ["authenticated"],
    };
    pushTool(plan, "searchCRM", { question: message }, "crm.pipeline.summary.read");
    if (business.permissions.canAccessFinancials) {
      pushTool(plan, "getFinancialChartData", { series: "revenue", months: 12 });
      pushTool(plan, "getCashPosition", {});
      plan.capabilityIds.push("financials.cashPosition.read");
    }
    return plan.tools.length >= 2 ? plan : null;
  }

  if (mentionsClients && mentionsOwe && mentionsSupport) {
    return null;
  }

  return null;
}

export function planEvidenceGathering(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const cross = planCrossModuleEvidence(message, business);
  if (cross) return cross;

  const lower = message.toLowerCase();
  const isStrategic =
    STRATEGIC_KEYWORDS.some((kw) => lower.includes(kw)) ||
    (/\bincrease\b/.test(lower) && /\brevenue\b/.test(lower)) ||
    (/\breduce\b/.test(lower) && /\bburn\b/.test(lower)) ||
    (/\bhow can we\b/.test(lower) &&
      /\b(revenue|burn|costs|risk|growth|profit|margin|runway)\b/.test(lower)) ||
    /\bbiggest operational risks?\b/.test(lower) ||
    /\bwhat should management focus\b/.test(lower);
  if (!isStrategic) return null;

  const tools: EaEvidencePlan["tools"] = [];
  const capabilityIds: string[] = [];

  if (business.permissions.canAccessFinancials) {
    tools.push({ tool: "getCashPosition", args: {} });
    tools.push({ tool: "searchInvoices", args: { outstandingOnly: true } });
    capabilityIds.push("financials.cashPosition.read");
  }
  if (business.permissions.canAccessHr) {
    tools.push({ tool: "searchEmployees", args: { query: "", headcount: true } });
    capabilityIds.push("hr.employees.count.read");
  }
  tools.push({ tool: "searchClients", args: { query: "" } });
  tools.push({ tool: "getBusinessHealth", args: {} });

  return {
    capabilityIds,
    tools,
    reasoningGoal: message,
    permissionsRequired: ["authenticated"],
  };
}

export function scoreReasoningIntent(message: string): number {
  return scoreSemanticOverlap(message, STRATEGIC_KEYWORDS);
}
