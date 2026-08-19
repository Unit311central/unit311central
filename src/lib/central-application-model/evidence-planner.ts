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

export function planEvidenceGathering(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const isStrategic = STRATEGIC_KEYWORDS.some((kw) =>
    message.toLowerCase().includes(kw),
  );
  if (!isStrategic) return null;

  const tools: EaEvidencePlan["tools"] = [];
  const capabilityIds: string[] = [];

  if (business.permissions.canAccessFinancials) {
    tools.push({ tool: "getCashPosition", args: {} });
    tools.push({ tool: "searchInvoices", args: { outstandingOnly: true } });
    capabilityIds.push("financials.cashPosition.read");
  }
  if (business.permissions.canAccessHr) {
    tools.push({ tool: "searchEmployees", args: { query: "" } });
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
