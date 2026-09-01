/**
 * Demo EA routing guards — chart / cross-module / executive / missing-entity bypass for module spine.
 */

import "server-only";

import type { AssistantBusinessContext, AssistantChatMessage } from "@/lib/ai-operating-assistant/types";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import { matchesFinancialChartCapability } from "@/lib/central-application-model/integrations/chart-capabilities";
import { isLiveFinancialBalanceQuestion } from "@/lib/ai-operating-assistant/knowledge-domains";
import { getNorthstarClients } from "@/lib/demo/module-fixtures";
import { buildNorthstarDemoUsers } from "@/lib/demo/northstar-users-data";
import { resolveNorthstarExecutiveIntelligenceIntent } from "@/lib/demo/executive-intelligence-intent";

const DEMO_OFFICE_LOCATIONS = new Set(
  ["manchester", "bristol", "austin", "sheffield", "uk", "us", "united kingdom"].map((s) =>
    s.toLowerCase(),
  ),
);

const UNKNOWN_PLACE_MARKERS =
  /\b(antarctica|tokyo|sydney|mars|moon|narnia|atlantis|fictional|nonexistent)\b/i;

export function isDemoChartRequest(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (/\b(chart of accounts|org chart|organization chart|organisation chart)\b/i.test(lower)) {
    return false;
  }
  if (/\b(graph|chart|plot|visuali[sz]e|pie chart|bar chart|line chart)\b/i.test(lower)) return true;
  if (/\bactual\s+versus\s+target\b/i.test(lower)) return true;
  if (/\bshow\s+actual\s+vs\s+target\b/i.test(lower)) return true;
  if (
    /\b(revenue|sales)\b[\s\S]{0,40}\b(expenses?|costs)\b/i.test(lower) ||
    /\b(expenses?|costs)\b[\s\S]{0,40}\b(revenue|sales)\b/i.test(lower)
  ) {
    return true;
  }
  return Boolean(matchesFinancialChartCapability(message));
}

export function isDemoCrossModuleSynthesisQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\b(create|generate|make|export|prepare|build)\b/i.test(lower) && /\b(pdf|report|pack|deck)\b/i.test(lower)) {
    return false;
  }
  if (
    /\b(sales|opportunities?|pipeline|deals?)\b/.test(lower) &&
    /\b(forecast|affect|impact|important enough)\b/.test(lower)
  ) {
    return true;
  }
  if (
    /\bclients?\b/.test(lower) &&
    /\b(commercial value|unresolved issues|significant commercial|both significant)\b/.test(lower)
  ) {
    return true;
  }
  if (/\bprojects?\b/.test(lower) && /\b(at risk|financial impact)\b/.test(lower)) {
    return true;
  }
  if (
    /\bemployees?\b/.test(lower) &&
    /\bprojects?\b/.test(lower) &&
    /\b(behind schedule|late|delayed|behind)\b/.test(lower)
  ) {
    return true;
  }
  if (/\brisks?\b/.test(lower) && /\b(greatest|biggest|potential).*\bimpact\b/.test(lower)) {
    return true;
  }
  if (/\bmanagement summary\b/.test(lower) || /\bneeds my attention\b/.test(lower)) {
    return true;
  }
  if (/\bcompare\b/.test(lower) && /\b(last|previous|prior|six|6)\s+months?\b/.test(lower)) return true;
  return false;
}

export function isDemoOpenEndedExecutiveQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\banything i should know\b/.test(lower)) return true;
  if (/\bwhat'?s worrying you\b/.test(lower)) return true;
  if (/\bwhat should i prioritise this week\b/.test(lower)) return true;
  if (/\bwhat should i prioritize this week\b/.test(lower)) return true;
  if (/\bwhat should i focus on today\b/.test(lower)) return true;
  if (/\bmaterial(ly)?\s+changed\b/.test(lower)) return true;
  if (/\bwhat has materially changed\b/.test(lower)) return true;
  if (/\bwhat should management be concerned about\b/.test(lower)) return true;
  if (/\bcompare\b/.test(lower) && /\b(last|previous|prior|six|6)\s+months?\b/.test(lower)) return true;
  return false;
}

export function shouldBypassDemoModuleSpine(message: string): boolean {
  if (isDemoChartRequest(message)) return true;
  if (isDemoCrossModuleSynthesisQuestion(message)) return true;
  if (isDemoOpenEndedExecutiveQuestion(message)) return true;
  if (isLiveFinancialBalanceQuestion(message)) return true;
  if (detectDemoMissingEntityQuestion(message)) return true;
  return false;
}

function normalizeEntityToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function clientNames(): string[] {
  return getNorthstarClients().map((c) => c.companyName.toLowerCase());
}

function employeeNames(): string[] {
  return buildNorthstarDemoUsers().map((u) => (u.fullName ?? u.username ?? "").toLowerCase()).filter(Boolean);
}

export function detectDemoMissingEntityQuestion(message: string): string | null {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (!text) return null;

  if (UNKNOWN_PLACE_MARKERS.test(lower)) {
    if (/\bantarctica\b/i.test(lower)) {
      return "I couldn't find an Antarctica division in the Demo data. Northstar operates from Manchester, Bristol, and Austin — there is no Antarctica division in the demo fixtures.";
    }
    if (/\btokyo\b/i.test(lower)) {
      return "I couldn't find a CEO in Tokyo in the available Demo records. Executive leadership and offices in the demo are UK- and Austin-based, not Tokyo.";
    }
    return "I couldn't find that location or entity in the Demo data.";
  }

  const divisionMatch = lower.match(
    /\b(?:our|the)\s+([a-z][a-z0-9\s-]{2,40}?)\s+division\b/i,
  );
  if (divisionMatch?.[1]) {
    const division = normalizeEntityToken(divisionMatch[1]);
    const known = ["uk", "us", "engineering", "commercial", "operations", "sales"];
    if (!known.some((k) => division.includes(k))) {
      return `I couldn't find a "${divisionMatch[1].trim()}" division in the Demo data. I can summarise financials, sales, projects, or HR from the live Northstar demo fixtures instead.`;
    }
  }

  if (/\bceo\b/i.test(lower)) {
    const locationMatch = lower.match(/\bceo\b[\s\S]{0,30}\b(in|at|for)\s+([a-z][a-z\s-]+)/i);
    const loc = locationMatch?.[2]?.trim().toLowerCase();
    if (loc && !DEMO_OFFICE_LOCATIONS.has(loc.split(/\s+/)[0] ?? "")) {
      return `I couldn't find a CEO record for "${locationMatch?.[2]?.trim()}" in the Demo data.`;
    }
  }

  const customerMatch = text.match(
    /\b(?:client|customer|account)\s+(?:called|named)?\s*["']?([A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){0,4})/,
  );
  if (customerMatch?.[1]) {
    const name = customerMatch[1].trim().toLowerCase();
    if (!clientNames().some((c) => c.includes(name) || name.includes(c.split(" ")[0] ?? ""))) {
      return `I couldn't find a client called "${customerMatch[1].trim()}" in the Demo data.`;
    }
  }

  const employeeMatch = text.match(
    /\b(?:employee|staff member|person)\s+(?:called|named)?\s*["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  );
  if (employeeMatch?.[1]) {
    const name = employeeMatch[1].trim().toLowerCase();
    if (!employeeNames().some((e) => e.includes(name))) {
      return `I couldn't find an employee called "${employeeMatch[1].trim()}" in the Demo HR records.`;
    }
  }

  return null;
}

export function resolveDemoMissingEntityRoute(
  message: string,
  _business: AssistantBusinessContext,
): OrchestrationRoute | null {
  const gap = detectDemoMissingEntityQuestion(message);
  if (!gap) return null;
  return { kind: "capability_answer", message: gap };
}

export function resolveDemoCrossModuleExecutiveRoute(message: string): OrchestrationRoute | null {
  if (!isDemoCrossModuleSynthesisQuestion(message)) return null;
  const lower = message.toLowerCase();
  if (/\brisks?\b/.test(lower) && /\b(greatest|biggest|potential).*\bimpact\b/.test(lower)) {
    return {
      kind: "tool",
      intent: {
        tool: "northstar.getBoardInsights",
        args: { focus: "risks", question: message },
        reason: "demo_cross_module_risk_impact",
      },
    };
  }
  return null;
}

export function resolveDemoOpenEndedExecutiveRoute(message: string): OrchestrationRoute | null {
  if (!isDemoOpenEndedExecutiveQuestion(message)) return null;
  const lower = message.toLowerCase();
  if (/\bcompare\b/.test(lower) && /\b(last|previous|prior|six|6)\s+months?\b/.test(lower)) {
    return {
      kind: "tool",
      intent: {
        tool: "northstar.getExecutiveBriefing",
        args: { question: message },
        reason: "demo_period_compare_briefing",
      },
    };
  }
  const exec = resolveNorthstarExecutiveIntelligenceIntent(message);
  if (!exec) {
    return {
      kind: "tool",
      intent: {
        tool: "northstar.getExecutiveBriefing",
        args: { question: message },
        reason: "demo_open_ended_executive_briefing",
      },
    };
  }
  return {
    kind: "tool",
    intent: {
      tool: exec.tool,
      args: exec.args,
      reason: exec.reason,
    },
  };
}

export function isDemoConversationFollowUp(message: string, history: AssistantChatMessage[]): boolean {
  if (!history.length) return false;
  const lower = message.trim().toLowerCase();
  return (
    /\b(that one|this one|which one|tell me more|what should we do|about that|about them|their pipeline|who is behind|what about their)\b/i.test(
      lower,
    ) ||
    (/\b(them|their|that|it)\b/i.test(lower) && lower.split(/\s+/).length <= 8)
  );
}

function recentTurns(history: AssistantChatMessage[], limit = 6): AssistantChatMessage[] {
  return history.slice(-limit);
}

function inferConversationTopic(history: AssistantChatMessage[]): string | null {
  for (const turn of [...history].reverse()) {
    const content = String(turn.content ?? "").toLowerCase();
    if (/\bsales\b|\bpipeline\b|\btarget\b|\bforecast\b|\bopportunit/.test(content)) return "sales";
    if (/\bproject\b|\bdelivery\b|\batlas\b/.test(content)) return "projects";
    if (/\bfinancial\b|\bcash\b|\bmargin\b|\bp&l\b/.test(content)) return "financials";
    if (/\brisk\b|\bboard\b/.test(content)) return "board";
  }
  return null;
}

/** Expand pronoun follow-ups using prior turn content (Demo EA only). */
export function enrichDemoOrchestrationMessage(
  message: string,
  history: AssistantChatMessage[],
): string {
  if (!isDemoConversationFollowUp(message, history)) return message;
  const topic = inferConversationTopic(history);
  const priorAssistant =
    [...recentTurns(history)].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const priorUser =
    [...recentTurns(history)].reverse().find((m) => m.role === "user")?.content ?? "";
  const lower = message.toLowerCase();

  if (topic === "sales") {
    if (/\btell me more about that one\b/i.test(lower)) {
      return `Executive sales review: which at-risk opportunity or rep behind target needs the most detail, and why? Prior context: ${priorAssistant.slice(0, 500)}`;
    }
    if (/\bwhat should we do\b/i.test(lower)) {
      return `What should management do about the sales rep or opportunity we are most concerned about? Prior context: ${priorAssistant.slice(0, 500)}`;
    }
    if (/\bwho is behind target\b/i.test(lower)) {
      return "Who on the sales team is behind target this quarter and what is their pipeline?";
    }
    if (/\bwhat about their pipeline\b/i.test(lower)) {
      return "What does the sales pipeline look like for the reps who are behind target?";
    }
    if (/\bwhich one should i be most concerned about\b/i.test(lower)) {
      return "Which sales opportunity or rep behind target should management be most concerned about?";
    }
  }

  if (/\bhow are sales doing\b/i.test(priorUser) || topic === "sales") {
    return `${message} (continuing sales executive review — prior answer: ${priorAssistant.slice(0, 300)})`;
  }

  return message;
}

export function resolveDemoConversationFollowUpRoute(
  message: string,
  history: AssistantChatMessage[],
): OrchestrationRoute | null {
  if (!isDemoConversationFollowUp(message, history)) return null;
  const enriched = enrichDemoOrchestrationMessage(message, history);
  const topic = inferConversationTopic(history);
  const lower = enriched.toLowerCase();

  if (topic === "sales" || /\bsales\b|\bpipeline\b|\btarget\b/.test(lower)) {
    return {
      kind: "tool",
      intent: {
        tool: "northstar.queryModule",
        args: {
          module: "sales-management",
          question: enriched,
          focus: /\bwhat should we do\b/i.test(message)
            ? "forecast"
            : /\bpipeline\b/i.test(enriched)
              ? "pipeline"
              : "performance",
        },
        reason: "demo_conversation_sales_follow_up",
      },
    };
  }

  return null;
}
