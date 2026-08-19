/**
 * Detect genuinely ambiguous EA queries that need clarification before routing.
 */

import { normalizeEaMessage } from "@/lib/ai-operating-assistant/capabilities/message-normalize";
import { matchesHeadcountCapability } from "@/lib/ai-operating-assistant/capabilities/definitions";
import { isLiveFinancialBalanceQuestion } from "@/lib/ai-operating-assistant/knowledge-domains";
import { matchesFinancialChartCapability } from "./integrations/chart-capabilities";

const AMBIGUOUS_PATTERNS: Array<{
  test: (normalized: string) => boolean;
  message: string;
}> = [
  {
    test: (n) =>
      /\bshow me performance\b/.test(n) &&
      !/\b(sales|employee|financial|project|hr|payroll|revenue)\b/.test(n),
    message:
      "Do you mean sales performance, employee performance, financial performance, or project performance?",
  },
  {
    test: (n) =>
      /\bhow are we doing\b/.test(n) &&
      !/\b(sales|financial|project|hr|payroll|revenue|cash|bank)\b/.test(n),
    message:
      "Do you mean financial performance, sales, projects, HR, or overall business health?",
  },
  {
    test: (n) =>
      /\bwhat is the situation\b/.test(n) &&
      !/\b(cash|bank|invoice|project|client|support|payroll)\b/.test(n),
    message:
      "Which area should I focus on — financials, sales, projects, clients, or support?",
  },
  {
    test: (n) =>
      /\b(show|give me)\s+(the\s+)?report\b/.test(n) &&
      !/\b(financial|sales|board|payroll|employee|project|monthly|quarterly)\b/.test(n),
    message:
      "Which report do you need — financial, sales, board, payroll, employee, or project?",
  },
];

export function detectAmbiguousEaQuery(message: string): string | null {
  const raw = message.trim();
  if (!raw) return null;

  if (
    isLiveFinancialBalanceQuestion(raw) ||
    matchesHeadcountCapability(raw) ||
    matchesFinancialChartCapability(raw)
  ) {
    return null;
  }

  const normalized = normalizeEaMessage(raw);
  for (const row of AMBIGUOUS_PATTERNS) {
    if (row.test(normalized)) return row.message;
  }
  return null;
}
