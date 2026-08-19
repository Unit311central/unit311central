/**
 * Central EA read capability registry — reusable capabilities, not question handlers.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";

export type EaReadCapabilityPermission =
  | "canAccessFinancials"
  | "canAccessHr"
  | "canAccessUsers"
  | "canAccessStrategy"
  | "authenticated";

export type EaResponseBlock =
  | { type: "text"; content: string }
  | { type: "kpi"; label: string; value: string | number; unit?: string }
  | {
      type: "line_chart" | "bar_chart";
      title: string;
      labels: string[];
      datasets: Array<{ label: string; data: number[] }>;
    }
  | {
      type: "pie_chart";
      title: string;
      labels: string[];
      values: number[];
    }
  | { type: "table"; title?: string; columns: string[]; rows: string[][] };

export type EaFormattedCapabilityAnswer = {
  text: string;
  blocks?: EaResponseBlock[];
  followUpActions?: import("@/lib/ai-operating-assistant/tool-result").AssistantFollowUpAction[];
};

export type EaReadCapabilityDefinition = {
  /** Stable id e.g. financials.cashPosition.read */
  id: string;
  module: string;
  submodule: string;
  entity: string;
  description: string;
  /** Keyword / pattern aliases — one capability, many phrasings */
  aliases: RegExp[];
  /** Negative patterns — catalogue / navigation only */
  exclude?: RegExp[];
  permissions: EaReadCapabilityPermission[];
  /** * = all workspaces; otherwise slug list */
  workspaces: "*" | string[];
  tool: string;
  buildArgs: (input: {
    message: string;
    normalized: string;
    business: AssistantBusinessContext;
  }) => Record<string, unknown>;
  /** When true, never call GPT-Terra after tool execution */
  deterministic: boolean;
  /** Skip LLM synthesis even when workspace pack would synthesize */
  skipSynthesis: boolean;
  formatAnswer: (
    result: AssistantToolResult,
    input: { message: string; business: AssistantBusinessContext },
  ) => EaFormattedCapabilityAnswer | null;
  supportsReporting?: boolean;
  supportsVisualisation?: boolean;
  crossModule?: boolean;
};

export type EaReadCapabilityMatch = {
  capability: EaReadCapabilityDefinition;
  score: number;
};

export type EaReadCapabilityDenied = {
  denied: true;
  reason: "permission" | "cross_workspace" | "platform_only";
  message: string;
};
