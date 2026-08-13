/**
 * Central EA workspace pack contracts — Phase 1 registry foundation.
 * Workspace-specific EA capabilities register here instead of central slug switches.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import type {
  AssistantBusinessContext,
  AssistantChatMessage,
  AssistantToolDefinition,
} from "@/lib/ai-operating-assistant/types";

export type EaIntentResolverContext = {
  message: string;
  business: AssistantBusinessContext;
  history: AssistantChatMessage[];
};

/** Ordered NL → orchestration route; first non-null result wins within the pack. */
export type EaIntentResolver = (
  ctx: EaIntentResolverContext,
) => OrchestrationRoute | null | Promise<OrchestrationRoute | null>;

export type EaPromptExtensionsInput = {
  context: AssistantBusinessContext;
};

export type EaPromptExtensions = {
  /** Appended to system instructions (tool hints, conversational standards). */
  systemHint?: string;
  /** Overrides reporting currency in the operating-context JSON block when set. */
  reportingCurrency?: string;
};

export type EaSynthesisRule = {
  id: string;
  matches: (ctx: EaSynthesisContext) => boolean;
};

export type EaArtifactBranding = {
  workspacePrefix: (input: {
    slug: string | null | undefined;
    organisationName: string | null | undefined;
  }) => string;
};

export type EaOrgStatePack = {
  /** Request field name on AssistantChatRequest (e.g. abhiOrgState). */
  requestField: string;
  /** Human-readable label for diagnostics. */
  label: string;
};

/**
 * Workspace EA pack — registers capabilities for one customer workspace surface.
 * Phase 1: orchestration, tools, nav, prompts, synthesis. Other slots reserved for later phases.
 */
export type EaWorkspacePack = {
  id: string;
  label: string;
  matchesSlug: (slug: string | null | undefined) => boolean;
  toolDefinitions?: AssistantToolDefinition[];
  intentResolvers?: EaIntentResolver[];
  navProvider?: (slug: string | null | undefined) => readonly InternalNavSection[];
  promptExtensions?: (input: EaPromptExtensionsInput) => EaPromptExtensions | null;
  synthesisRules?: EaSynthesisRule[];
  orgState?: EaOrgStatePack;
  artifactBranding?: EaArtifactBranding;
};
