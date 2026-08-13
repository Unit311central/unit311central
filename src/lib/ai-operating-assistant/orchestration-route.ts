import type { DirectAssistantIntent } from "@/lib/ai-operating-assistant/intent-router";
import type { EaExecutionCard } from "@/lib/ai-operating-assistant/execution-cards";

export type OrchestrationRoute =
  | {
      kind: "tool";
      intent: DirectAssistantIntent;
      executionCards?: EaExecutionCard[];
    }
  | {
      kind: "need_info";
      message: string;
      actionId: string;
      missingFields: string[];
      input: Record<string, unknown>;
      executionCards: EaExecutionCard[];
    }
  | {
      kind: "capability_answer";
      message: string;
      executionCards?: EaExecutionCard[];
    }
  | {
      kind: "platform_answer";
      message: string;
      executionCards?: EaExecutionCard[];
    }
  | {
      kind: "workflow_read";
      message: string;
      executionCards: EaExecutionCard[];
    }
  | {
      kind: "none";
    };
