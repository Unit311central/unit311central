import type { DirectAssistantIntent } from "@/lib/ai-operating-assistant/intent-router";
import type { EaExecutionCard } from "@/lib/ai-operating-assistant/execution-cards";
import type { EaResponseBlock } from "@/lib/ai-operating-assistant/capabilities/types";
import type { EaEvidencePlan } from "@/lib/central-application-model/types";

export type OrchestrationRoute =
  | {
      kind: "tool";
      intent: DirectAssistantIntent;
      executionCards?: EaExecutionCard[];
      /** Central read capability — when set, runtime skips GPT-Terra if deterministic */
      capabilityId?: string;
      deterministic?: boolean;
      skipSynthesis?: boolean;
    }
  | {
      kind: "semantic_capability";
      capabilityId: string;
      deterministic?: boolean;
      skipSynthesis?: boolean;
    }
  | {
      kind: "semantic_answer";
      message: string;
      responseBlocks?: EaResponseBlock[];
      capabilityId: string;
      deterministic?: boolean;
      skipSynthesis?: boolean;
      executionCards?: EaExecutionCard[];
    }
  | {
      kind: "evidence_gpt";
      plan: EaEvidencePlan;
      message: string;
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
