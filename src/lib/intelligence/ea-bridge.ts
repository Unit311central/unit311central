/**
 * L1 EA bridge contracts — provider tools and intent resolvers plug in here.
 * No registration into tool-service until a later phase.
 */

import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { DailyExecutiveBrief } from "@/lib/ai-operating-assistant/executive-types";
import type {
  AssistantBusinessContext,
  AssistantChatMessage,
  AssistantToolDefinition,
} from "@/lib/ai-operating-assistant/types";
import type { EaPackToolHandler } from "@/lib/ai-operating-assistant/workspace-packs/handlers-registry";

import type {
  IntelligenceBriefing,
  IntelligenceDomainId,
  IntelligenceWorkspaceSlug,
} from "@/lib/intelligence/types";

export type IntelligenceIntentResolverContext = {
  message: string;
  business: AssistantBusinessContext;
  history: AssistantChatMessage[];
  workspaceSlug: IntelligenceWorkspaceSlug;
  domainId?: IntelligenceDomainId;
};

/** Resolve natural language to an EA orchestration route for a workspace intelligence provider. */
export type IntelligenceIntentResolver = (
  ctx: IntelligenceIntentResolverContext,
) => OrchestrationRoute | null | Promise<OrchestrationRoute | null>;

export type IntelligenceDailyBriefSectionAdapter = (
  briefing: IntelligenceBriefing,
) => DailyExecutiveBrief["sections"][number];

/**
 * Optional per-pack EA integration — registered on the intelligence workspace pack.
 * Handlers are not merged into tool-service until explicitly wired in a later phase.
 */
export type IntelligenceEaBridge = {
  /** Tool definitions exposed to EA for this workspace intelligence pack. */
  toolDefinitions?: readonly AssistantToolDefinition[];
  /** Tool name → handler map (same contract as EaPackToolHandler). */
  toolHandlers?: Readonly<Record<string, EaPackToolHandler>>;
  /** NL intent resolvers for intelligence-specific EA routing. */
  intentResolvers?: readonly IntelligenceIntentResolver[];
  /** Map a domain briefing into a Daily Executive Brief section. */
  dailyBriefSectionAdapter?: IntelligenceDailyBriefSectionAdapter;
};

/** Metadata for documenting which EA capabilities a provider registers. */
export type IntelligenceEaRegistration = {
  packId: string;
  workspaceSlug: IntelligenceWorkspaceSlug;
  domainIds: readonly IntelligenceDomainId[];
  toolNames: readonly string[];
  intentResolverCount: number;
  hasDailyBriefAdapter: boolean;
};

export function describeIntelligenceEaRegistration(
  packId: string,
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainIds: readonly IntelligenceDomainId[],
  bridge?: IntelligenceEaBridge,
): IntelligenceEaRegistration {
  return {
    packId,
    workspaceSlug,
    domainIds: [...domainIds],
    toolNames: bridge?.toolDefinitions?.map((t) => t.name) ?? [],
    intentResolverCount: bridge?.intentResolvers?.length ?? 0,
    hasDailyBriefAdapter: Boolean(bridge?.dailyBriefSectionAdapter),
  };
}
