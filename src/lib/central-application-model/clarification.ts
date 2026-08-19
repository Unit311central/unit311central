/**
 * Detect genuinely ambiguous EA queries that need clarification before routing.
 */

import { normalizeEaMessage } from "@/lib/ai-operating-assistant/capabilities/message-normalize";

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
      /\b(show|give me)\s+(the\s+)?report\b/.test(n) &&
      !/\b(financial|sales|board|payroll|employee|project|monthly|quarterly)\b/.test(n),
    message:
      "Which report do you need — financial, sales, board, payroll, employee, or project?",
  },
];

export function detectAmbiguousEaQuery(message: string): string | null {
  const normalized = normalizeEaMessage(message);
  for (const row of AMBIGUOUS_PATTERNS) {
    if (row.test(normalized)) return row.message;
  }
  return null;
}
